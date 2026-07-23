"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Film,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createSpotlightItem,
  deleteSpotlightItem,
  reorderSpotlightItems,
  updateSpotlightItem,
  type SpotlightInput,
} from "@/app/admin/actions";
import { SpotlightLayoutEditor } from "@/components/admin/SpotlightLayoutEditor";
import { SpotlightMediaUploader } from "@/components/admin/SpotlightMediaUploader";
import { defaultSpotlightLayout } from "@/lib/spotlight-layout";
import type { SpotlightItem } from "@/lib/types";

const emptyDraft: SpotlightInput = {
  media_type: "image",
  media_url: "",
  title: "",
  caption: "",
  location: "",
  taken_at: "",
  published: true,
  layout: defaultSpotlightLayout(0),
};

export function SpotlightManager({
  initialItems,
  setupError,
}: {
  initialItems: SpotlightItem[];
  setupError: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [adding, setAdding] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [reordering, startReorder] = useTransition();

  function move(id: string, direction: -1 | 1) {
    const from = items.findIndex((item) => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;

    const previous = items;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);
    setOrderError(null);

    startReorder(async () => {
      const result = await reorderSpotlightItems(next.map((item) => item.id));
      if (result.error) {
        setItems(previous);
        setOrderError(result.error);
      }
    });
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Spotlight</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Curate the photos, films and memories shown below your testimonials.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={adding || Boolean(setupError)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add media
        </button>
      </div>

      {setupError ? (
        <div className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm leading-relaxed text-amber-700 dark:text-amber-300">
          <p className="font-medium">Spotlight needs its database setup first.</p>
          <p className="mt-1 opacity-80">
            Run <code className="font-mono">supabase/migrations/0006_spotlight.sql</code> in the Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      ) : null}

      {orderError ? (
        <p role="alert" className="mt-5 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">
          {orderError}
        </p>
      ) : null}

      {!setupError && items.length ? (
        <SpotlightLayoutEditor
          key={items.map((item) => item.id).join("-")}
          items={items}
          onSaved={(layouts) =>
            setItems((current) =>
              current.map((item) => ({
                ...item,
                layout: layouts[item.id] ?? item.layout,
              })),
            )
          }
        />
      ) : null}

      <div className="mt-6 space-y-4">
        {adding ? (
          <SpotlightEditor
            item={null}
            index={0}
            total={items.length + 1}
            onCancel={() => setAdding(false)}
            onSaved={(item) => {
              setItems((current) => [...current, item]);
              setAdding(false);
            }}
          />
        ) : null}

        {!setupError && items.length === 0 && !adding ? (
          <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
            <Film className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">Your Spotlight is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Add a photo or video to reveal the section on your homepage.</p>
          </div>
        ) : null}

        {items.map((item, index) => (
          <SpotlightEditor
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            moving={reordering}
            onMove={(direction) => move(item.id, direction)}
            onSaved={(saved) =>
              setItems((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)))
            }
            onDeleted={(id) => setItems((current) => current.filter((entry) => entry.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}

function SpotlightEditor({
  item,
  index,
  total,
  moving = false,
  onMove,
  onSaved,
  onDeleted,
  onCancel,
}: {
  item: SpotlightItem | null;
  index: number;
  total: number;
  moving?: boolean;
  onMove?: (direction: -1 | 1) => void;
  onSaved: (item: SpotlightItem) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<SpotlightInput>(
    item
      ? {
          media_type: item.media_type,
          media_url: item.media_url,
          title: item.title,
          caption: item.caption ?? "",
          location: item.location ?? "",
          taken_at: item.taken_at ?? "",
          published: item.published,
          layout: item.layout,
        }
      : emptyDraft,
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5";

  function save() {
    setError(null);
    start(async () => {
      const result = item
        ? await updateSpotlightItem(item.id, draft)
        : await createSpotlightItem(draft);
      if ("error" in result) {
        setError(result.error ?? "Could not save Spotlight item.");
        return;
      }
      onSaved(result.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  function remove() {
    if (!item || !onDeleted) return;
    if (!confirm("Delete this Spotlight item? This can't be undone.")) return;
    setError(null);
    start(async () => {
      const result = await deleteSpotlightItem(item.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDeleted(item.id);
    });
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <SpotlightMediaUploader
          value={draft.media_url ? { url: draft.media_url, type: draft.media_type } : null}
          onChange={(media) =>
            setDraft((current) => ({
              ...current,
              media_url: media?.url ?? "",
              media_type: media?.type ?? "image",
            }))
          }
        />

        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Title</span>
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="A day worth keeping" maxLength={120} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Location</span>
              <input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Amman, Jordan" maxLength={160} className={inputClass} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Caption</span>
            <textarea value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} placeholder="Tell the story behind this moment…" rows={4} maxLength={2000} className={`${inputClass} resize-y leading-relaxed`} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Date</span>
              <input type="date" value={draft.taken_at} onChange={(event) => setDraft((current) => ({ ...current, taken_at: event.target.value }))} className={inputClass} />
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm">
              <input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4 accent-foreground" />
              Show on homepage
            </label>
          </div>

          {error ? <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1">
              {item && onDeleted ? (
                <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              ) : null}
              {item && onMove ? (
                <>
                  <button type="button" onClick={() => onMove(-1)} disabled={moving || index === 0} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-25" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onMove(1)} disabled={moving || index === total - 1} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-25" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {onCancel ? (
                <button type="button" onClick={onCancel} disabled={pending} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"><X className="h-4 w-4" />Cancel</button>
              ) : null}
              <button type="button" onClick={save} disabled={pending || !draft.media_url} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
                {pending ? "Saving…" : saved ? "Saved" : item ? "Save changes" : "Add to Spotlight"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
