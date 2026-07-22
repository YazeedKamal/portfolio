import { Reveal } from "@/components/ui/Reveal";
import type { Testimonial } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <Reveal>
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Kind words
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            What people say
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08}>
            <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-7">
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-foreground text-xs font-semibold text-background">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatar_url} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(t.name)
                  )}
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-medium">{t.name}</div>
                  {t.role && (
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  )}
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
