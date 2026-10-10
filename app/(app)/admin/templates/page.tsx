import { requireAdmin } from '@/lib/auth/current-user';
import { listOfficialTemplates } from '@/lib/db/templates';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { TemplatesManager } from '@/components/admin/templates-manager';

export const metadata = { title: 'Admin — Templates' };

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const templates = await listOfficialTemplates();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg text-ink">Admin</h1>
        <p className="mt-1 text-xs text-muted">Official starter content offered in the editor.</p>
      </div>
      <AdminTabs />
      <TemplatesManager templates={templates} />
    </div>
  );
}
