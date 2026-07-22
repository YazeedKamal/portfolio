"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Trash2,
  Type,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { updateProject } from "@/app/admin/actions";
import type { ContentBlock, Project } from "@/lib/types";

export function ProjectEditor({ project }: { project: Project }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [subtitle, setSubtitle] = useState(project.subtitle ?? "");
  const [cover, setCover] = useState<string | null>(project.cover_url);
  const [published, setPublished] = useState(project.published);
  const [blocks, setBlocks] = useState<ContentBlock[]>(project.content ?? []);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function updateBlock(i: number, next: ContentBlock) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? next : b)));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function removeBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addBlock(type: "text" | "image") {
    setBlocks((prev) => [
      ...prev,
      type === "text"
        ? { type: "text", heading: "", body: "" }
        : { type: "image", url: "", caption: "" },
    ]);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateProject(project.id, {
        title,
        subtitle,
        slug,
        cover_url: cover,
        content: blocks,
        published,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-[var(--foreground)]"
            />
            Published
          </label>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {pending ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
          {error}
        </p>
      )}

      {/* Core fields */}
      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Slug (URL)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ImageUploader value={cover} onChange={setCover} label="Cover image" />
      </div>

      {/* Content blocks */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build the case study with text and image blocks.
        </p>

        <div className="mt-5 space-y-4">
          {blocks.map((block, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {block.type}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(i, -1)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/5"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(i, 1)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/5"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(i)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Remove block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {block.type === "text" && (
                <div className="space-y-3">
                  <input
                    value={block.heading ?? ""}
                    onChange={(e) => updateBlock(i, { ...block, heading: e.target.value })}
                    placeholder="Heading (optional)"
                    className={inputCls}
                  />
                  <textarea
                    value={block.body}
                    onChange={(e) => updateBlock(i, { ...block, body: e.target.value })}
                    placeholder="Body text…"
                    rows={4}
                    className={`${inputCls} resize-y`}
                  />
                </div>
              )}

              {block.type === "image" && (
                <div className="space-y-3">
                  <ImageUploader
                    value={block.url || null}
                    onChange={(url) => updateBlock(i, { ...block, url: url ?? "" })}
                    label="Block image"
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(e) => updateBlock(i, { ...block, caption: e.target.value })}
                    placeholder="Caption (optional)"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => addBlock("text")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
          >
            <Type className="h-4 w-4" />
            Add text
          </button>
          <button
            type="button"
            onClick={() => addBlock("image")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
          >
            <ImageIcon className="h-4 w-4" />
            Add image
          </button>
        </div>
      </div>
    </main>
  );
}
