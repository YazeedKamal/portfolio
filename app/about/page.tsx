import { Testimonials } from "@/components/home/Testimonials";
import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Footer } from "@/components/home/Footer";
import { getSiteSettings, getTestimonials } from "@/lib/data";

export const revalidate = 0;

export default async function AboutPage() {
  const [settings, testimonials] = await Promise.all([
    getSiteSettings(),
    getTestimonials(),
  ]);

  return (
    <main className="flex-1">
      <Testimonials testimonials={testimonials} />
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
