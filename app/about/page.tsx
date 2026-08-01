import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Footer } from "@/components/home/Footer";
import { getSiteSettings } from "@/lib/data";

export const revalidate = 0;

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex-1">
      <About
        eyebrow={settings.about_eyebrow}
        title={settings.about_title}
        body={settings.about_body}
        imageUrl={settings.about_image_url ?? settings.avatar_url}
      />
      <Contact />
      <Footer />
    </main>
  );
}
