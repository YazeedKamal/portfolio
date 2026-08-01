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

/**
 * Homepage contact section — open on the page (no card wrapper), separated
 * from the About section above by a hairline divider. LinkedIn is the primary
 * channel (featured CTA); email + the rest are secondary. Details come from
 * `lib/contact`.
 */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="w-full scroll-mt-24 border-t border-border bg-background text-foreground transition-colors duration-500 ease-out motion-reduce:transition-none"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-32">
        <Reveal>
          <h2
            id="contact-heading"
            className="max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
          >
            I&apos;d love to hear what you&apos;re working on.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
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
    </section>
  );
}
