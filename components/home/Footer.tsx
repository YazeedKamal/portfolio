import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const socials = [
  { label: "Email", href: "mailto:hello@example.com" },
  { label: "Twitter / X", href: "https://x.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
];

export function Footer() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl px-6 pb-16">
      <div className="rounded-[2rem] border border-border bg-card p-10 sm:p-14">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Let&apos;s work together
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Have a product worth designing well?
        </h2>
        <a
          href="mailto:hello@example.com"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
        >
          Start a conversation
          <ArrowUpRight className="h-4 w-4" />
        </a>

        <div className="mt-14 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/play" className="transition-colors hover:text-foreground">
              Play
            </Link>
            <span>© {new Date().getFullYear()} Yazeed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
