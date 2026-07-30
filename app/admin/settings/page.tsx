import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { AvatarUploader } from "@/components/admin/AvatarUploader";
import { AvailabilityToggle } from "@/components/admin/AvailabilityToggle";
import { HeroTitleDesigner } from "@/components/admin/HeroTitleDesigner";
import { HeroTextForm } from "@/components/admin/HeroTextForm";
import { AboutForm } from "@/components/admin/AboutForm";
import { FooterLogosManager } from "@/components/admin/FooterLogosManager";
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
        <HeroTitleDesigner
          initialRich={settings.hero_title_rich}
          initialTitle={settings.hero_title}
          initialFonts={settings.hero_fonts}
        />
        <HeroTextForm initialSubtitle={settings.hero_subtitle} />
        <AboutForm
          initialEyebrow={settings.about_eyebrow}
          initialTitle={settings.about_title}
          initialBody={settings.about_body}
          initialImageUrl={settings.about_image_url}
        />
        <FooterLogosManager initialLogos={settings.footer_logos} />
        <AvailabilityToggle initial={settings.available_for_work} />
      </div>
    </main>
  );
}
