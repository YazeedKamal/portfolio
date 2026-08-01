import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Playfair_Display,
  Space_Grotesk,
  Bebas_Neue,
  Caveat,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { DynamicIsland } from "@/components/navbar/DynamicIsland";
import { HeroFontFaces } from "@/components/hero/HeroFontFaces";
import { getSiteSettings } from "@/lib/data";
import { SITE, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Curated fonts for the hand-designed hero headline (see `lib/hero-fonts.ts`).
// Each is exposed as a CSS variable the designer/homepage reference per word.
const heroSans = Inter({ variable: "--font-hero-sans", subsets: ["latin"], style: ["normal", "italic"] });
const heroSerif = Playfair_Display({ variable: "--font-hero-serif", subsets: ["latin"], style: ["normal", "italic"] });
const heroGrotesk = Space_Grotesk({ variable: "--font-hero-grotesk", subsets: ["latin"] });
const heroDisplay = Bebas_Neue({ variable: "--font-hero-display", subsets: ["latin"], weight: "400" });
const heroScript = Caveat({ variable: "--font-hero-script", subsets: ["latin"] });
const heroMono = JetBrains_Mono({ variable: "--font-hero-mono", subsets: ["latin"], style: ["normal", "italic"] });

const heroFontVars = [heroSans, heroSerif, heroGrotesk, heroDisplay, heroScript, heroMono]
  .map((f) => f.variable)
  .join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = settings.hero_subtitle?.trim() || SITE.tagline;
  const defaultTitle = `${SITE.name} — ${SITE.role}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: defaultTitle, template: `%s — ${SITE.shortName}` },
    description,
    applicationName: SITE.name,
    authors: [{ name: SITE.name, url: SITE_URL }],
    creator: SITE.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: defaultTitle,
      description,
      url: SITE_URL,
      images: [{ url: "/api/og", width: 1200, height: 630, alt: defaultTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
      images: ["/api/og"],
    },
  };
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${heroFontVars} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HeroFontFaces fonts={settings.hero_fonts} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <DynamicIsland avatarUrl={settings.avatar_url} />
          {children}
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}
