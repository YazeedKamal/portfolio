"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setHeroText } from "@/app/admin/actions";

const DEFAULT_TITLE = "Product designer crafting calm, human interfaces.";
const DEFAULT_SUBTITLE =
  "I design end-to-end products — from first sketch to shipped pixels — with an obsession for clarity, craft, and the details you feel but never notice.";

/** Edit the homepage hero headline + subtitle. Empty = default copy. */
export function HeroTextForm({
  initialTitle,
  initialSubtitle,
  initialHighlight,
}: {
  initialTitle: string | null;
  initialSubtitle: string | null;
  initialHighlight: string | null;
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [subtitle, setSubtitle] = useState(initialSubtitle ?? "");
  const [highlight, setHighlight] = useState(initialHighlight ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const highlightMissing =
    highlight.trim().length > 0 &&
    !(title || DEFAULT_TITLE).toLowerCase().includes(highlight.trim().toLowerCase());

  function save() {
    setError(null);
    start(async () => {
      const res = await setHeroText(title, subtitle, highlight);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40";

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-sm font-medium">Hero text</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        The big headline and the description under it on your homepage. Leave
        empty to use the default copy.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="hero-title" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Headline
          </label>
          <textarea
            id="hero-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={DEFAULT_TITLE}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </div>
        <div>
          <label htmlFor="hero-subtitle" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="hero-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={DEFAULT_SUBTITLE}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="hero-highlight" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Figma-selection word
          </label>
          <input
            id="hero-highlight"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            placeholder="e.g. Figma — a word from the headline"
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            This word (or phrase) in the headline gets a Figma-style selection
            box — blue border with corner handles. Leave empty for none.
          </p>
          {highlightMissing && (
            <p className="mt-1 text-xs text-amber-500">
              Heads up: this text doesn&apos;t appear in the current headline, so
              nothing will be highlighted.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {pending ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
