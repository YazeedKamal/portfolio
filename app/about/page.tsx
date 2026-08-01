import type { Metadata } from "next";
import { About } from "@/components/home/About";
import { Footer } from "@/components/home/Footer";
import { getSiteSettings } from "@/lib/data";
import { htmlToPlainText } from "@/lib/content-to-markdown";
import { SITE } from "@/lib/site";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description =
    htmlToPlainText(settings.about_body ?? "").slice(0, 200) ||
    `About ${SITE.name}, ${SITE.role}.`;
  const title = "About";
  const ogImage = `/api/og?title=${encodeURIComponent("About")}&subtitle=${encodeURIComponent(
    settings.about_title ?? SITE.role,
  )}`;

  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      type: "profile",
      title: `${title} — ${SITE.shortName}`,
      description,
      url: "/about",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE.shortName}`,
      description,
      images: [ogImage],
    },
  };
}

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
      <Footer />
    </main>
  );
}
