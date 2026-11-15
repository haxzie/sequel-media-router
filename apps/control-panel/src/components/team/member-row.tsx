'use client';

import { Avatar, Badge, Select } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { MemberView } from './team-manager';

export function MemberRow({
  member,
  organizationId,
  canManage,
  isSelf,
  divided,
}: {
  member: MemberView;
  organizationId: string;
  canManage: boolean;
  isSelf: boolean;
  divided: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // An owner is not demotable or removable from here. Letting the last owner
  // drop their own role would leave an organization nobody can administer.
  const locked = member.role === 'owner';
  const editable = canManage && !locked && !isSelf;

  async function changeRole(role: string) {
    setBusy(true);
    await authClient.organization.updateMemberRole({
      memberId: member.id,
      role: role as 'member',
      organizationId,
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await authClient.organization.removeMember({
      memberIdOrEmail: member.id,
      organizationId,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className={[
        'flex items-center gap-4 px-5 py-3.5',
        divided ? 'border-t border-[var(--color-line)]' : '',
        busy ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Avatar name={member.name} src={member.image} size={32} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px]">{member.name}</span>
          {isSelf && <Badge tone="outline">you</Badge>}
        </div>
        <div className="truncate text-[12px] text-[var(--color-dim)]">{member.email}</div>
      </div>

      {editable ? (
        <div className="w-[130px]">
          <Select
            value={member.role}
            disabled={busy}
            onChange={(event) => void changeRole(event.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
      ) : (
        <span className="w-[130px] text-right text-[13px] capitalize text-[var(--color-muted)]">
          {member.role}
        </span>
      )}

      <div className="w-[70px] text-right">
        {editable && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="text-[12px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-pink)]"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
