import { CONTACT_EMAIL, SOCIALS } from "@/lib/contact";

/** Simple footer bar — a single hairline row: name + year on the left,
 *  quick links on the right. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {year} Yazeed — Product Designer</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="transition-colors hover:text-foreground"
          >
            Email
          </a>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
