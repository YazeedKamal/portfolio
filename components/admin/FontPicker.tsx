"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { HERO_FONTS } from "@/lib/hero-fonts";
import type { HeroFont } from "@/lib/types";

type Opt = { id: string; label: string; family: string | undefined };

/** Searchable font dropdown — each option is rendered in its own font so the
 *  user previews it before picking, and can type to filter by name. Covers the
 *  "Default" (inherit), curated Google fonts, and custom uploaded fonts. */
export function FontPicker({
  value,
  onChange,
  fonts,
}: {
  value: string;
  onChange: (id: string) => void;
  fonts: HeroFont[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo<Opt[]>(
    () => [
      { id: "default", label: "Default", family: undefined },
      ...HERO_FONTS.map((f) => ({ id: f.id, label: f.label, family: `var(${f.cssVar})` })),
      ...fonts.map((f) => ({ id: f.id, label: f.name, family: `"hf-${f.id}"` })),
    ],
    [fonts],
  );

  const current = options.find((o) => o.id === value) ?? options[0];
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 min-w-[9.5rem] items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition-colors hover:bg-foreground/5"
      >
        <span className="truncate" style={{ fontFamily: current.family }}>
          {current.label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">No fonts found</li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-foreground/5"
                  >
                    <span className="truncate text-lg leading-tight" style={{ fontFamily: o.family }}>
                      {o.label}
                    </span>
                    {o.id === value ? (
                      <Check className="h-4 w-4 shrink-0 text-[#0D99FF]" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
