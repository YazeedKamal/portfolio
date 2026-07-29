"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setHeroSubtitle } from "@/app/admin/actions";

const DEFAULT_SUBTITLE =
  "I design end-to-end products — from first sketch to shipped pixels — with an obsession for clarity, craft, and the details you feel but never notice.";

/** Edit the homepage hero description. The headline is designed separately in
 *  the HeroTitleDesigner. Empty = the description is hidden. */
export function HeroTextForm({ initialSubtitle }: { initialSubtitle: string | null }) {
  // Preset with the default copy the first time (never saved); clearing it and
  // saving leaves the homepage description empty.
  const [subtitle, setSubtitle] = useState(initialSubtitle ?? DEFAULT_SUBTITLE);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await setHeroSubtitle(subtitle);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-sm font-medium">Hero description</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        The paragraph under the headline on your homepage.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="hero-subtitle" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="hero-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Leave empty to hide the description"
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Prefilled with the default copy — edit it, or clear it to hide the
            description on your homepage.
          </p>
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
