"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { setAboutSection } from "@/app/admin/actions";

// Prefilled the first time so the user edits from the live copy. These mirror
// the defaults baked into components/home/About.tsx.
const DEFAULT_EYEBROW = "About";
const DEFAULT_TITLE = "I design products people actually enjoy using.";
const DEFAULT_BODY =
  "I'm Yazeed, a senior product designer with 7+ years shaping end-to-end experiences — from first sketch to shipped pixels. I care about clarity, craft, and the small details you feel but never notice.\n\nLately I've been leading product design, mentoring designers, and building AI-powered experiences that stay calm and human even when the problem underneath is anything but.";

/** Edit the homepage "About" section — the large photo, eyebrow label,
 *  headline, and body copy. Clearing a field restores its default. */
export function AboutForm({
  initialEyebrow,
  initialTitle,
  initialBody,
  initialImageUrl,
}: {
  initialEyebrow: string | null;
  initialTitle: string | null;
  initialBody: string | null;
  initialImageUrl: string | null;
}) {
  const [eyebrow, setEyebrow] = useState(initialEyebrow ?? DEFAULT_EYEBROW);
  const [title, setTitle] = useState(initialTitle ?? DEFAULT_TITLE);
  const [body, setBody] = useState(initialBody ?? DEFAULT_BODY);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await setAboutSection({ eyebrow, title, body, imageUrl });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        The personal section near the bottom of your homepage — photo, headline,
        and story.
      </p>

      <div className="mt-4 space-y-4">
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          label="Photo"
          aspect="aspect-square"
          maxWidthClass="max-w-[260px]"
        />
        <p className="-mt-2 text-xs text-muted-foreground">
          Shown large on the right. Leave empty to fall back to your profile
          photo.
        </p>

        <div>
          <label
            htmlFor="about-eyebrow"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Label
          </label>
          <input
            id="about-eyebrow"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="About"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>

        <div>
          <label
            htmlFor="about-title"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Headline
          </label>
          <textarea
            id="about-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            placeholder={DEFAULT_TITLE}
            className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>

        <div>
          <label
            htmlFor="about-body"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Story
          </label>
          <textarea
            id="about-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Leave empty to use the default copy"
            className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-foreground/40"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Leave a blank line between paragraphs.
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
