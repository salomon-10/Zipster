import { requireAdmin } from '@/lib/auth/current-user';
import { getActivitySeries, getPlatformStats } from '@/lib/db/generations';
import { listUsers } from '@/lib/db/users';
import { formatCount } from '@/lib/utils';
import { Panel, PanelHeader, Counter } from '@/components/ui/surface';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { ActivityChart } from '@/components/admin/activity-chart';
import { UsersTable } from '@/components/admin/users-table';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  const user = await requireAdmin();
  const [stats, activity, users] = await Promise.all([
    getPlatformStats(),
    getActivitySeries(30),
    listUsers(200),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg text-ink">Admin</h1>
        <p className="mt-1 text-xs text-muted">Platform-wide activity and account management.</p>
      </div>

      <AdminTabs />

      <Panel flush>
        <div className="flex flex-wrap gap-5 border-b border-rail px-4 py-3.5 sm:px-5">
          <Counter value={String(stats.users)} label="users" />
          <Counter value={String(stats.projects)} label="saved projects" />
          <Counter value={String(stats.publicProjects)} label="shared publicly" />
          <Counter value={String(stats.generations)} label="ZIPs generated" />
          <Counter value={String(stats.filesCreated)} label="files created" />
        </div>
        <div className="px-4 py-4 sm:px-5">
          <PanelHeader title="Generations, last 30 days" className="mb-2" />
          <ActivityChart data={activity} />
        </div>
      </Panel>

      <Panel flush>
        <PanelHeader
          title="Users"
          description={`${formatCount(users.length, 'account')} registered.`}
          className="px-4 py-3.5 sm:px-5"
        />
        <UsersTable users={users} currentUser={user} />
      </Panel>
    </div>
  );
}
