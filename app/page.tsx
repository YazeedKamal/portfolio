import { HomeShowcase } from "@/components/home/HomeShowcase";
import { Testimonials } from "@/components/home/Testimonials";
import { Footer } from "@/components/home/Footer";
import { Spotlight } from "@/components/home/Spotlight";
import { getPublishedProjects, getSpotlightItems, getTestimonials, getSiteSettings } from "@/lib/data";

export const revalidate = 0;

export default async function Home() {
  const [projects, testimonials, spotlightItems, settings] = await Promise.all([
    getPublishedProjects(),
    getTestimonials(),
    getSpotlightItems(),
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
      />
      <Testimonials testimonials={testimonials} />
      <Spotlight items={spotlightItems} avatarUrl={settings.avatar_url} />
      <Footer />
    </main>
  );
}
