import { Reveal } from "@/components/ui/Reveal";

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
        </div>

        {imageUrl && (
          <Reveal className="order-1 lg:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Yazeed"
              className="ml-auto aspect-square w-full max-w-sm rounded-3xl object-cover shadow-sm"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}
