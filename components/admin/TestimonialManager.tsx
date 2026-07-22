"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, MessageSquareQuote, Plus, Trash2, X } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "@/app/admin/actions";
import type { Testimonial } from "@/lib/types";

type Draft = Pick<Testimonial, "name" | "role" | "avatar_url" | "quote">;

const emptyDraft: Draft = {
  name: "",
  role: "",
  avatar_url: null,
  quote: "",
};

export function TestimonialManager({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Testimonials</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add and edit the recommendations shown on your homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={adding}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add testimonial
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {adding && (
          <TestimonialEditor
            testimonial={null}
            onCancel={() => setAdding(false)}
            onSaved={(testimonial) => {
              setTestimonials((current) => [...current, testimonial]);
              setAdding(false);
            }}
          />
        )}

        {testimonials.length === 0 && !adding ? (
          <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
            <MessageSquareQuote className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">No testimonials yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a recommendation to show it on the homepage.
            </p>
          </div>
        ) : null}

        {testimonials.map((testimonial) => (
          <TestimonialEditor
            key={testimonial.id}
            testimonial={testimonial}
            onSaved={(saved) =>
              setTestimonials((current) =>
                current.map((item) => (item.id === saved.id ? saved : item)),
              )
            }
            onDeleted={(id) =>
              setTestimonials((current) => current.filter((item) => item.id !== id))
            }
          />
        ))}
      </div>
    </section>
  );
}

function TestimonialEditor({
  testimonial,
  onSaved,
  onDeleted,
  onCancel,
}: {
  testimonial: Testimonial | null;
  onSaved: (testimonial: Testimonial) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    testimonial
      ? {
          name: testimonial.name,
          role: testimonial.role ?? "",
          avatar_url: testimonial.avatar_url,
          quote: testimonial.quote,
        }
      : emptyDraft,
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5";

  function save() {
    setError(null);
    start(async () => {
      const result = testimonial
        ? await updateTestimonial(testimonial.id, {
            ...draft,
            role: draft.role ?? "",
          })
        : await createTestimonial({ ...draft, role: draft.role ?? "" });

      if ("error" in result) {
        setError(result.error ?? "Could not save testimonial.");
        return;
      }

      onSaved(result.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  function remove() {
    if (!testimonial || !onDeleted) return;
    if (!confirm(`Delete ${testimonial.name}'s testimonial? This can't be undone.`)) return;

    setError(null);
    start(async () => {
      const result = await deleteTestimonial(testimonial.id);
      if (result.error) {
        setError(result.error ?? "Could not delete testimonial.");
        return;
      }
      onDeleted(testimonial.id);
    });
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[132px_1fr]">
        <div>
          <ImageUploader
            value={draft.avatar_url}
            onChange={(avatar_url) => setDraft((current) => ({ ...current, avatar_url }))}
            label="Person photo"
            aspect="aspect-square"
            bucket="avatars"
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Square photos work best.
          </p>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Name</span>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Sarah Chen"
                maxLength={120}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Position</span>
              <input
                value={draft.role ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, role: event.target.value }))
                }
                placeholder="VP Product, Northwind"
                maxLength={160}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Testimonial</span>
            <textarea
              value={draft.quote}
              onChange={(event) =>
                setDraft((current) => ({ ...current, quote: event.target.value }))
              }
              placeholder="Write the recommendation…"
              rows={4}
              maxLength={2000}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
              {testimonial && onDeleted ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                onClick={save}
                disabled={pending || !draft.name.trim() || !draft.quote.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {pending ? "Saving…" : saved ? "Saved" : testimonial ? "Save changes" : "Add testimonial"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
