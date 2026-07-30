import { HomeShowcase } from "@/components/home/HomeShowcase";
import { Footer } from "@/components/home/Footer";
import { getPublishedProjects, getSiteSettings } from "@/lib/data";

export const revalidate = 0;

export default async function Home() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings(),
  ]);

  return (
    <main className="flex-1">
      <HomeShowcase
        projects={projects}
        showAvailable={settings.available_for_work}
        heroTitle={settings.hero_title}
        heroSubtitle={settings.hero_subtitle}
        heroHighlight={settings.hero_highlight}
        heroRich={settings.hero_title_rich}
        heroFonts={settings.hero_fonts}
      />
      <Footer />
    </main>
  );
}
