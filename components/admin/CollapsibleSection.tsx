"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A titled, collapsible card used to group the admin settings so the page
 * doesn't read as one long stack. Each section owns the card + header; the
 * child provides just the fields (its own title/card chrome is removed).
 */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.02]"
      >
        <span className="text-sm font-medium">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* grid-rows 0fr→1fr gives a smooth height collapse without JS measuring. */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
