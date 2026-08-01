import { HomeShowcase } from "@/components/home/HomeShowcase";
import { Footer } from "@/components/home/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedProjects, getSiteSettings } from "@/lib/data";
import { SITE, SITE_URL } from "@/lib/site";

export const revalidate = 0;

export default async function Home() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings(),
  ]);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: SITE.name,
      jobTitle: SITE.role,
      url: SITE_URL,
      description: settings.hero_subtitle?.trim() || SITE.tagline,
      sameAs: [SITE.linkedin],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE_URL,
    },
  ];

  return (
    <main className="flex-1">
      <JsonLd data={structuredData} />
      <HomeShowcase
        projects={projects}
        showAvailable={settings.available_for_work}
        heroTitle={settings.hero_title}
        heroSubtitle={settings.hero_subtitle}
        heroHighlight={settings.hero_highlight}
        heroRich={settings.hero_title_rich}
        heroFonts={settings.hero_fonts}
      />
      <Footer footerLogos={settings.footer_logos} />
    </main>
  );
}
