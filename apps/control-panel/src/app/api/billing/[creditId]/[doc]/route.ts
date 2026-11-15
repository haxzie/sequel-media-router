import { resolveActor } from '@/lib/actor';
import { renderBillingDocument } from '@/lib/billing-pdf';
import { getWallet } from '@/lib/wallet';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * A receipt or invoice as a PDF.
 *
 * Scoped like every other read: the credit must belong to the caller's
 * organisation, or it does not exist. A billing document is exactly the kind
 * of id someone would try incrementing.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ creditId: string; doc: string }> },
) {
  const { creditId, doc } = await params;
  if (doc !== 'receipt' && doc !== 'invoice') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not found' }, { status: 404 });

  const wallet = await getWallet(actor.organizationId);
  const credit = wallet.credits.find((entry) => entry.id === creditId);
  if (!credit) return Response.json({ error: 'Not found' }, { status: 404 });

  const auth = await getAuth();
  const org = await auth.api
    .getFullOrganization({
      headers: await headers(),
      query: { organizationId: actor.organizationId },
    })
    .catch(() => null);

  const addedBy = org?.members.find((member) => member.userId === credit.createdByUserId);

  const pdf = await renderBillingDocument({
    credit,
    organizationName: org?.name ?? 'Your organisation',
    addedByName: addedBy ? addedBy.user.name || addedBy.user.email : null,
    documentType: doc,
  });

  return new Response(pdf as BodyInit, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="sequel-${doc}-${credit.id}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
