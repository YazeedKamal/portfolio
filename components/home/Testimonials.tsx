import { Reveal } from "@/components/ui/Reveal";
import { UniqueTestimonial } from "@/components/ui/UniqueTestimonial";
import type { Testimonial } from "@/lib/types";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="mx-auto w-full max-w-6xl overflow-hidden px-6 py-24 sm:py-32"
    >
      <Reveal>
        <h2
          id="testimonials-heading"
          className="text-center text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          Kind words
        </h2>
      </Reveal>

      <Reveal delay={0.08}>
        <UniqueTestimonial testimonials={testimonials} />
      </Reveal>
    </section>
  );
}
