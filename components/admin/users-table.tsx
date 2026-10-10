'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { AdminUserRow, User } from '@/lib/db/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { setRoleAction } from '@/app/actions/admin';

export function UsersTable({ users, currentUser }: { users: AdminUserRow[]; currentUser: User }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-rail text-2xs uppercase tracking-normal text-muted">
            <th className="py-2 pl-4 font-medium sm:pl-5">User</th>
            <th className="py-2 font-medium">Role</th>
            <th className="py-2 font-medium">Projects</th>
            <th className="py-2 font-medium">Downloads</th>
            <th className="py-2 font-medium">Joined</th>
            <th className="py-2 pr-4 font-medium sm:pr-5" />
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <UserRow key={row.id} row={row} currentUser={currentUser} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ row, currentUser }: { row: AdminUserRow; currentUser: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleRole() {
    const nextRole = row.role === 'admin' ? 'user' : 'admin';
    startTransition(async () => {
      const result = await setRoleAction(row.id, nextRole);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${row.username} is now ${nextRole === 'admin' ? 'an admin' : 'a regular user'}.`);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-rail last:border-b-0">
      <td className="py-2.5 pl-4 sm:pl-5">
        <div className="font-mono text-ink">{row.username}</div>
        <div className="text-2xs text-muted">{row.email}</div>
      </td>
      <td className="py-2.5">
        <Badge tone={row.role === 'admin' ? 'folder' : 'neutral'}>{row.role}</Badge>
      </td>
      <td className="py-2.5 tabular-nums text-ink-soft">{row.projectCount}</td>
      <td className="py-2.5 tabular-nums text-ink-soft">{row.generationCount}</td>
      <td className="py-2.5 text-muted">{formatDate(row.createdAt)}</td>
      <td className="py-2.5 pr-4 text-right sm:pr-5">
        <Button variant="ghost" size="sm" loading={pending} onClick={toggleRole} disabled={row.id === currentUser.id && row.role === 'admin'}>
          {row.role === 'admin' ? 'Revoke admin' : 'Make admin'}
        </Button>
      </td>
    </tr>
  );
}
