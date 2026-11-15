'use client';

import { Avatar, Badge, Card, PageHeader, PrimaryButton } from '@sequel/ui';
import { useState } from 'react';
import { InviteDialog } from './invite-dialog';
import { InviteRow } from './invite-row';
import { MemberRow } from './member-row';

export interface MemberView {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

export interface InviteView {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

/** Only these two may change membership. Owner is set at creation, not granted. */
const CAN_MANAGE = ['owner', 'admin'];

export function TeamManager({
  organization,
  viewerRole,
  viewerUserId,
  members,
  invitations,
}: {
  organization: { id: string; name: string; slug: string };
  viewerRole: string;
  viewerUserId: string;
  members: MemberView[];
  invitations: InviteView[];
}) {
  const [inviting, setInviting] = useState(false);
  const [lastInviteId, setLastInviteId] = useState<string | null>(null);

  const canManage = CAN_MANAGE.includes(viewerRole);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'Team']}
        title="Team"
        meta={
          <>
            {members.length} member{members.length === 1 ? '' : 's'} in {organization.name}
            {invitations.length > 0 && ` · ${invitations.length} pending`}
          </>
        }
        actions={
          canManage ? (
            <PrimaryButton onClick={() => setInviting(true)}>Invite</PrimaryButton>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-line)] px-5 py-3 text-[12px] font-medium text-[var(--color-dim)]">
          Members
        </div>
        {members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            organizationId={organization.id}
            canManage={canManage}
            isSelf={member.userId === viewerUserId}
            divided={index > 0}
          />
        ))}
      </Card>

      {invitations.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-[var(--color-line)] px-5 py-3 text-[12px] font-medium text-[var(--color-dim)]">
            Pending invitations
          </div>
          {invitations.map((invite, index) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              canManage={canManage}
              highlight={invite.id === lastInviteId}
              divided={index > 0}
            />
          ))}
        </Card>
      )}

      {!canManage && (
        <p className="mt-4 text-[12px] text-[var(--color-dim)]">
          You are a {viewerRole}. Only owners and admins can invite or remove people.
        </p>
      )}

      <InviteDialog
        open={inviting}
        organizationId={organization.id}
        onClose={() => setInviting(false)}
        onInvited={setLastInviteId}
      />
    </div>
  );
}

export { Avatar, Badge };
