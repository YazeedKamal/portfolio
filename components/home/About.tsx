import { Reveal } from "@/components/ui/Reveal";
import { LINKEDIN_URL } from "@/lib/contact";

/** LinkedIn brand glyph — inline so it doesn't depend on Lucide's
 *  (deprecated) brand icons. Inherits color via `currentColor`. */
function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

/** Built-in default copy — used until the fields are set in /admin/settings. */
const DEFAULT_EYEBROW = "About";
const DEFAULT_TITLE = "I design products people actually enjoy using.";
const DEFAULT_BODY =
  "I'm Yazeed, a senior product designer with 7+ years shaping end-to-end experiences — from first sketch to shipped pixels. I care about clarity, craft, and the small details you feel but never notice.\n\nLately I've been leading product design, mentoring designers, and building AI-powered experiences that stay calm and human even when the problem underneath is anything but.";

/**
 * "About me" — an open, editorial section (no card wrapper). Sits above the
 * contact section as the personal lead-in to the page's closing. Every field
 * (eyebrow, title, body, image) is editable from /admin/settings; unset fields
 * fall back to the defaults above.
 */
export function About({
  eyebrow,
  title,
  body,
  imageUrl,
}: {
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
}) {
  const eyebrowText = eyebrow ?? DEFAULT_EYEBROW;
  const titleText = title ?? DEFAULT_TITLE;
  // Blank lines separate paragraphs.
  const paragraphs = (body ?? DEFAULT_BODY)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="w-full scroll-mt-24 bg-background text-foreground transition-colors duration-500 ease-out motion-reduce:transition-none"
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 px-6 py-24 sm:py-32 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {eyebrowText}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h2
              id="about-heading"
              className="mt-4 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              {titleText}
            </h2>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#0A66C2] px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-95"
            >
              <LinkedInLogo className="h-5 w-5" />
              Connect on LinkedIn
            </a>
          </Reveal>
        </div>

        {imageUrl && (
          <Reveal className="order-1 lg:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Yazeed"
              className="ml-auto aspect-square w-full max-w-[280px] rounded-3xl object-cover shadow-sm sm:max-w-[300px] lg:aspect-[3/4]"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}
