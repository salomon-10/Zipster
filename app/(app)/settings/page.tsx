import { requireUser } from '@/lib/auth/current-user';
import { Panel, PanelHeader, Divider } from '@/components/ui/surface';
import { ProfileForm } from '@/components/project/profile-form';
import { PasswordForm } from '@/components/project/password-form';
import { DangerZone } from '@/components/project/danger-zone';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-lg text-ink">Account settings</h1>

      <Panel>
        <PanelHeader title="Profile" description="Your username is how you'll appear on shared projects." />
        <Divider className="my-4" />
        <ProfileForm user={user} />
      </Panel>

      <Panel>
        <PanelHeader title="Password" />
        <Divider className="my-4" />
        <PasswordForm />
      </Panel>

      <Panel className="border-danger/25">
        <PanelHeader title="Danger zone" />
        <Divider className="my-4" />
        <DangerZone />
      </Panel>
    </div>
  );
}
