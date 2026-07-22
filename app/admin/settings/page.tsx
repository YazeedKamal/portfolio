import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { AvatarUploader } from "@/components/admin/AvatarUploader";
import { AvailabilityToggle } from "@/components/admin/AvailabilityToggle";
import { HeroTextForm } from "@/components/admin/HeroTextForm";
import { getSiteSettings } from "@/lib/data";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  if (!isSupabaseConfigured) redirect("/admin");

  const settings = await getSiteSettings();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <AdminNav />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Site-wide preferences. Changes apply immediately.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <AvatarUploader initialUrl={settings.avatar_url} />
        <HeroTextForm
          initialTitle={settings.hero_title}
          initialSubtitle={settings.hero_subtitle}
          initialHighlight={settings.hero_highlight}
        />
        <AvailabilityToggle initial={settings.available_for_work} />
      </div>
    </main>
  );
}
