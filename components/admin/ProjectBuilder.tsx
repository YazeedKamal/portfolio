"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  Columns2,
  Copy,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Info,
  Italic,
  Link2,
  ListPlus,
  Loader2,
  Minus,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Type,
  Underline,
  Upload,
  X,
} from "lucide-react";
import { updateProject } from "@/app/admin/actions";
import { ProjectPreviewSheet } from "@/components/admin/ProjectPreviewSheet";
import { MEDIA_ACCEPT, uploadMedia } from "@/lib/upload-media";
import { INFO_MAX_COLUMNS, infoColsClass } from "@/lib/info-columns";
import { ICON_LIBRARY, ICON_NAMES } from "@/components/icon-library";
import type {
  BlockAlign,
  Column,
  ColumnContent,
  ContentBlock,
  InfoItem,
  Media,
  Project,
} from "@/lib/types";

type Item = { id: string; block: ContentBlock };
type Device = "web" | "mobile";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyMedia = (): Media => ({ url: "", kind: "image" });

// Multi-column rows hold between 2 and 4 equal-width columns.
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 4;
const emptyColumn = (): Column => ({ width: 0, content: { kind: "text", heading: "", body: "" } });
// Columns are always equal width now (no manual resizing) — spread 100% evenly.
const equalizeColumns = (cols: Column[]): Column[] => {
  const w = 100 / cols.length;
  return cols.map((c) => ({ ...c, width: w }));
};

type BlockKind = "text" | "media" | "columns" | "info" | "divider";

function newBlock(type: BlockKind): ContentBlock {
  if (type === "text") return { type: "text", body: "", align: "left", width: 100 };
  if (type === "media") return { type: "media", media: emptyMedia(), align: "center", width: 100 };
  if (type === "divider") return { type: "divider" };
  if (type === "info")
    return {
      type: "info",
      columns: 2,
      items: [{ title: "", body: "" }, { title: "", body: "" }],
    };
  return {
    type: "columns",
    columns: [
      { width: 50, content: { kind: "media", media: emptyMedia() } },
      { width: 50, content: { kind: "text", heading: "", body: "" } },
    ],
  };
}

type PaletteEntry = {
  kind: BlockKind;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
};

const PALETTE: PaletteEntry[] = [
  { kind: "columns", icon: Columns2, label: "Multi-column", hint: "Media + text side by side" },
  { kind: "text", icon: Type, label: "Text", hint: "A paragraph, no media" },
  { kind: "media", icon: ImageIcon, label: "Media", hint: "Image, gif or video" },
  { kind: "info", icon: Info, label: "Details", hint: "Facts with icon, title & text" },
  { kind: "divider", icon: Minus, label: "Divider", hint: "A thin separator line" },
];

/* ================================ Builder ================================= */

export function ProjectBuilder({
  project,
  otherProjects = [],
}: {
  project: Project;
  otherProjects?: Project[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [cover, setCover] = useState<string | null>(project.cover_url);
  const [cardUrl, setCardUrl] = useState<string | null>(project.card_url);
  const [published, setPublished] = useState(project.published);
  const [items, setItems] = useState<Item[]>(() =>
    (project.content ?? []).map((block) => ({ id: uid(), block })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("web");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Drag-and-drop: `dragKind` is the palette section being dragged in (null
  // while just reordering existing blocks); `overId` is the block/zone the
  // pointer is over, used to draw the insertion line.
  const [dragKind, setDragKind] = useState<BlockKind | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function setBlock(id: string, block: ContentBlock) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, block } : it)));
  }
  function addBlock(type: BlockKind) {
    const item = { id: uid(), block: newBlock(type) };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }
  function duplicate(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { id: uid(), block: structuredClone(prev[idx].block) };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  }
  function insertBlock(kind: BlockKind, index: number) {
    const item = { id: uid(), block: newBlock(kind) };
    setItems((prev) => {
      const next = [...prev];
      next.splice(Math.max(0, Math.min(index, prev.length)), 0, item);
      return next;
    });
    setSelectedId(item.id);
  }

  function onDragStart(e: DragStartEvent) {
    const kind = e.active.data.current?.kind as BlockKind | undefined;
    setDragKind(kind ?? null);
  }
  function onDragOver(e: DragOverEvent) {
    setOverId(e.over ? String(e.over.id) : null);
  }
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const kind = active.data.current?.kind as BlockKind | undefined;
    setDragKind(null);
    setOverId(null);

    // Dropping a new section from the palette.
    if (kind) {
      let index = items.length;
      if (over) {
        const i = items.findIndex((it) => it.id === over.id);
        index = i === -1 ? items.length : i;
      }
      insertBlock(kind, index);
      return;
    }

    // Reordering existing blocks.
    if (!over || active.id === over.id) return;
    setItems((prev) =>
      arrayMove(
        prev,
        prev.findIndex((it) => it.id === active.id),
        prev.findIndex((it) => it.id === over.id),
      ),
    );
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateProject(project.id, {
        title,
        subtitle: project.subtitle ?? "", // preserved; not editable here
        slug: project.slug,
        cover_url: cover,
        card_url: cardUrl,
        content: items.map((it) => it.block),
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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <div className="flex items-center gap-3">
          <DeviceToggle device={device} onChange={setDevice} />
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {pending ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      {error && (
        <p className="shrink-0 bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setDragKind(null);
          setOverId(null);
        }}
      >
        <div className="flex min-h-0 flex-1">
          {/* Left workspace — interactive canvas */}
          <main
            className="min-w-0 flex-1 overflow-auto bg-[var(--card)] p-6 sm:p-10"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            <div
              className="mx-auto overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition-[max-width] duration-300"
              style={{ maxWidth: device === "mobile" ? 390 : 960 }}
            >
              <div className="mx-auto w-full max-w-4xl p-6">
                <CanvasHero title={title} onTitle={setTitle} cover={cover} onCover={setCover} />

                <SortableContext
                  items={items.map((it) => it.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div data-blocks className="@container flex flex-col gap-14 pt-10">
                    {items.map((it) => (
                      <Fragment key={it.id}>
                        {dragKind && overId === it.id && <DropLine />}
                        <SortableBlock
                          item={it}
                          selected={selectedId === it.id}
                          onSelect={() => setSelectedId(it.id)}
                          onChange={(b) => setBlock(it.id, b)}
                          onMoveUp={() => move(it.id, -1)}
                          onMoveDown={() => move(it.id, 1)}
                          onDuplicate={() => duplicate(it.id)}
                          onRemove={() => remove(it.id)}
                        />
                      </Fragment>
                    ))}
                    <EndZone
                      empty={items.length === 0}
                      dragging={dragKind !== null}
                      active={overId === "canvas-end"}
                    />
                  </div>
                </SortableContext>
              </div>
            </div>
          </main>

          {/* Right panel — component picker (click or drag onto the canvas) */}
          <aside className="w-[260px] shrink-0 overflow-auto border-l border-border p-4">
            <CardThumbnail value={cardUrl} cover={cover} onChange={setCardUrl} />

            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Add section
            </p>
            <div className="space-y-2">
              {PALETTE.map((p) => (
                <PaletteItem key={p.kind} entry={p} onClick={() => addBlock(p.kind)} />
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Click to append, or drag a section onto the canvas to drop it exactly
              where you want. Click any element to edit it.
            </p>
          </aside>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragKind ? <PaletteChip entry={PALETTE.find((p) => p.kind === dragKind)!} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Live preview of the unsaved in-memory build, in the real bottom sheet. */}
      <ProjectPreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        device={device}
        onDeviceChange={setDevice}
        otherProjects={otherProjects}
        project={{
          ...project,
          title,
          cover_url: cover,
          card_url: cardUrl,
          published,
          content: items.map((it) => it.block),
        }}
      />
    </div>
  );
}

/* ============================== Canvas hero =============================== */

function CanvasHero({
  title,
  onTitle,
  cover,
  onCover,
}: {
  title: string;
  onTitle: (v: string) => void;
  cover: string | null;
  onCover: (v: string | null) => void;
}) {
  return (
    <div className="w-full">
      <InlineText
        as="h1"
        value={title}
        onChange={onTitle}
        placeholder="Project title"
        className="text-2xl font-semibold leading-tight tracking-tight @2xl:text-4xl"
      />
      <div className="mt-8">
        <InlineImage
          url={cover}
          onChange={onCover}
          aspect="aspect-[16/9]"
          rounded="rounded-[2rem]"
          label="hero image"
        />
      </div>
    </div>
  );
}

/* ============================ Card thumbnail ============================= */

/** Sidebar uploader for the homepage card image. When empty the card reuses
 *  the hero `cover` — so this only needs setting when you want a different
 *  thumbnail than the internal cover. */
function CardThumbnail({
  value,
  cover,
  onChange,
}: {
  value: string | null;
  cover: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const preview = value ?? cover;
  const usingFallback = !value;

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const { url } = await uploadMedia(file);
      onChange(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Card thumbnail
      </p>
      <div className="group/thumb relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 grid cursor-pointer place-items-center bg-black/45 text-xs font-medium text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
        >
          <span className="inline-flex items-center gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {preview ? "Replace" : "Upload"}
          </span>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {usingFallback ? "Using cover image" : "Custom image"}
        </p>
        {!usingFallback && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ============================= Sortable block ============================= */

function SortableBlock({
  item,
  selected,
  onSelect,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  item: Item;
  selected: boolean;
  onSelect: () => void;
  onChange: (b: ContentBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const showAlign = item.block.type === "text" || item.block.type === "media";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-2xl outline-offset-4 transition-shadow ${
        isDragging ? "opacity-60" : ""
      } ${
        selected
          ? "outline outline-2 outline-[#0D99FF]"
          : "outline outline-1 outline-transparent hover:outline-border-strong"
      }`}
      onPointerDown={onSelect}
    >
      {/* Floating toolbar */}
      <div
        className={`absolute bottom-full right-0 mb-2 z-20 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 shadow-sm transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {showAlign && (
          <AlignInline
            value={(item.block as { align?: BlockAlign }).align ?? (item.block.type === "media" ? "center" : "left")}
            onChange={(align) => onChange({ ...item.block, align } as ContentBlock)}
          />
        )}
        <ToolBtn onClick={onMoveUp} label="Move up" icon={ChevronDown} rotate />
        <ToolBtn onClick={onMoveDown} label="Move down" icon={ChevronDown} />
        <ToolBtn onClick={onDuplicate} label="Duplicate" icon={Copy} />
        <ToolBtn onClick={onRemove} label="Delete" icon={Trash2} danger />
      </div>

      <BlockEditor block={item.block} onChange={onChange} selected={selected} />
    </div>
  );
}

/* ============================== Block editor ============================== */

function BlockEditor({
  block,
  onChange,
  selected,
}: {
  block: ContentBlock;
  onChange: (b: ContentBlock) => void;
  selected: boolean;
}) {
  if (block.type === "text") {
    const { box, text } = alignClasses(block.align);
    return (
      <ResizableWidth
        width={block.width ?? 100}
        align={block.align ?? "left"}
        selected={selected}
        onChange={(width) => onChange({ ...block, width })}
        className={`${box} ${text}`}
      >
        <InlineText
          as="h2"
          value={block.heading ?? ""}
          onChange={(heading) => onChange({ ...block, heading })}
          placeholder="Heading (optional)"
          className="mb-3 text-2xl font-semibold tracking-tight empty:mb-0"
        />
        <InlineText
          value={block.body}
          onChange={(body) => onChange({ ...block, body })}
          placeholder="Write something…"
          className="whitespace-pre-line text-lg leading-relaxed text-foreground/80"
          multiline
          rich
        />
      </ResizableWidth>
    );
  }

  if (block.type === "media") {
    return (
      <ResizableWidth
        width={block.width ?? 100}
        align={block.align ?? "center"}
        selected={selected}
        onChange={(width) => onChange({ ...block, width })}
        className={alignClasses(block.align ?? "center").box}
      >
        <InlineMedia
          media={block.media}
          onChange={(media) => onChange({ ...block, media })}
          aspect={block.aspect}
          onAspectChange={(aspect) => onChange({ ...block, aspect })}
          selected={selected}
        />
      </ResizableWidth>
    );
  }

  if (block.type === "columns") {
    return (
      <ColumnsEditor
        columns={block.columns}
        selected={selected}
        onChange={(columns) => onChange({ ...block, columns })}
      />
    );
  }

  if (block.type === "info") {
    return (
      <InfoEditor
        items={block.items}
        columns={block.columns ?? 2}
        onItems={(items) => onChange({ ...block, items })}
        onColumns={(columns) => onChange({ ...block, columns })}
      />
    );
  }

  if (block.type === "divider") {
    return (
      <div className="py-3">
        <hr className="border-t border-border" />
      </div>
    );
  }

  // Legacy blocks: read-only note.
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Legacy “{block.type}” block — delete it and add a new section.
    </div>
  );
}

/* ============================= Columns editor ============================ */

function ColumnsEditor({
  columns,
  selected,
  onChange,
}: {
  columns: Column[];
  selected: boolean;
  onChange: (cols: Column[]) => void;
}) {
  const setContent = (i: number, content: ColumnContent) =>
    onChange(columns.map((c, idx) => (idx === i ? { ...c, content } : c)));

  const addColumn = () => onChange(equalizeColumns([...columns, emptyColumn()]));
  const removeColumn = (i: number) =>
    onChange(equalizeColumns(columns.filter((_, idx) => idx !== i)));

  return (
    <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-stretch @2xl:gap-8">
      {columns.map((col, i) => (
        <div
          key={i}
          style={{ ["--col-g" as string]: `${col.width}` }}
          className="relative w-full min-w-0 @2xl:w-auto @2xl:basis-0 @2xl:grow-[var(--col-g)]"
        >
          {selected && (
            <div
              className="absolute -top-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background p-0.5 shadow-sm"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MiniToggle
                active={col.content.kind === "media"}
                onClick={() =>
                  col.content.kind !== "media" && setContent(i, { kind: "media", media: emptyMedia() })
                }
                label="Media"
              />
              <MiniToggle
                active={col.content.kind === "text"}
                onClick={() =>
                  col.content.kind !== "text" && setContent(i, { kind: "text", heading: "", body: "" })
                }
                label="Text"
              />
              {columns.length > MIN_COLUMNS && (
                <>
                  <span className="mx-0.5 h-4 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => removeColumn(i)}
                    className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Remove column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {col.content.kind === "media" ? (
            <InlineMedia
              media={col.content.media}
              onChange={(media) =>
                setContent(i, {
                  kind: "media",
                  media,
                  aspect: col.content.kind === "media" ? col.content.aspect : undefined,
                })
              }
              aspect={col.content.aspect}
              onAspectChange={(aspect) =>
                setContent(i, {
                  kind: "media",
                  media: col.content.kind === "media" ? col.content.media : emptyMedia(),
                  aspect,
                })
              }
              selected={selected}
              placeholderAspect="aspect-[4/3]"
            />
          ) : (
            <div>
              <InlineText
                as="h2"
                value={col.content.heading ?? ""}
                onChange={(heading) => setContent(i, { ...(col.content as { kind: "text"; body: string }), kind: "text", heading })}
                placeholder="Heading (optional)"
                // No `empty:mb-0` here (unlike the standalone text block): keep the
                // title's space reserved so a title-less column stays aligned with
                // sibling columns that have a title.
                className="mb-3 text-2xl font-semibold tracking-tight"
              />
              <InlineText
                value={col.content.kind === "text" ? col.content.body : ""}
                onChange={(body) => setContent(i, { kind: "text", heading: (col.content as { heading?: string }).heading, body })}
                placeholder="Write something…"
                className="whitespace-pre-line text-lg leading-relaxed text-foreground/80"
                multiline
                rich
              />
            </div>
          )}
        </div>
      ))}

      {selected && columns.length < MAX_COLUMNS && (
        <button
          type="button"
          onClick={addColumn}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground @2xl:w-auto @2xl:self-stretch @2xl:px-3 @2xl:py-0"
          aria-label="Add column"
        >
          <Plus className="h-4 w-4" />
          <span className="@2xl:hidden">Add column</span>
        </button>
      )}
    </div>
  );
}

/* ============================= Info / details =========================== */

function InfoEditor({
  items,
  columns,
  onItems,
  onColumns,
}: {
  items: InfoItem[];
  columns: number;
  onItems: (items: InfoItem[]) => void;
  onColumns: (columns: number) => void;
}) {
  const setItem = (i: number, item: InfoItem) =>
    onItems(items.map((it, idx) => (idx === i ? item : it)));

  return (
    <div>
      <dl className={`grid grid-cols-1 gap-x-10 gap-y-7 ${infoColsClass(columns)}`}>
        {items.map((item, i) => (
          <div key={i} className="group/item relative">
            <div className="flex items-center gap-2">
              <IconPicker value={item.icon} onChange={(icon) => setItem(i, { ...item, icon })} />
              <InlineText
                as="h2"
                value={item.title}
                onChange={(title) => setItem(i, { ...item, title })}
                placeholder="Title"
                className="flex-1 text-lg font-semibold tracking-tight"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onItems(items.filter((_, idx) => idx !== i))}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="cursor-pointer rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover/item:opacity-100"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <InlineText
              value={item.body}
              onChange={(body) => setItem(i, { ...item, body })}
              placeholder="Details…"
              className="mt-1 whitespace-pre-line leading-relaxed text-foreground/70"
              multiline
              rich
            />
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onItems([...items, { title: "", body: "" }])}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5"
        >
          <ListPlus className="h-4 w-4" />
          Add item
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Columns</span>
          <div className="flex items-center gap-0.5 rounded-full bg-foreground/5 p-0.5">
            {Array.from({ length: INFO_MAX_COLUMNS }, (_, k) => k + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onColumns(n)}
                className={`h-6 w-6 cursor-pointer rounded-full text-xs tabular-nums transition-colors ${
                  columns === n ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (name: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const names = query
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    : ICON_NAMES;
  const Current = value ? ICON_LIBRARY[value] : undefined;

  return (
    <div className="relative shrink-0" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border text-foreground/70 transition-colors hover:bg-foreground/5"
        aria-label="Choose icon"
      >
        {Current ? <Current className="h-5 w-5" /> : <Plus className="h-4 w-4" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-50 w-64 rounded-2xl border border-border bg-background p-2 shadow-xl">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons"
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-sm outline-none focus:border-foreground/40"
              />
            </div>
            <div className="grid max-h-52 grid-cols-7 gap-1 overflow-auto">
              {names.map((n) => {
                const Icon = ICON_LIBRARY[n];
                return (
                  <button
                    key={n}
                    type="button"
                    title={n}
                    onClick={() => {
                      onChange(n);
                      setOpen(false);
                    }}
                    className={`grid aspect-square cursor-pointer place-items-center rounded-lg transition-colors hover:bg-foreground/5 ${
                      value === n ? "bg-foreground/10 text-foreground" : "text-foreground/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-muted-foreground hover:bg-foreground/5"
              >
                <X className="h-3.5 w-3.5" />
                Remove icon
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== Inline text ============================== */

function InlineText({
  value,
  onChange,
  as: Tag = "div",
  className = "",
  placeholder,
  multiline = false,
  rich = false,
}: {
  value: string;
  onChange: (v: string) => void;
  as?: "div" | "h1" | "h2" | "p";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  // When true the field stores HTML and shows a bold/italic/underline/link
  // toolbar over the current text selection.
  rich?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);

  // Seed the DOM once on mount; never re-seed from props (avoids caret jumps —
  // the contentEditable is the source of truth while editing). Plain fields use
  // `innerText` (round-trips line breaks); rich fields seed HTML, but legacy
  // plain-text values (no tags) are seeded as text so stray "<" isn't parsed.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (rich && /<[a-z][\s\S]*>/i.test(value)) {
      if (el.innerHTML !== value) el.innerHTML = value;
    } else if (el.innerText !== value) {
      el.innerText = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(rich ? ref.current.innerHTML : ref.current.innerText);
  };

  // Show/position the floating format bar over the current selection.
  const syncMenu = () => {
    if (!rich) return;
    const sel = window.getSelection();
    if (
      !sel ||
      sel.rangeCount === 0 ||
      sel.isCollapsed ||
      !ref.current ||
      !ref.current.contains(sel.anchorNode)
    ) {
      setMenu(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setMenu(null);
      return;
    }
    setMenu({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  useEffect(() => {
    if (!rich) return;
    document.addEventListener("selectionchange", syncMenu);
    return () => document.removeEventListener("selectionchange", syncMenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rich]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    syncMenu();
  };

  const addLink = () => {
    const sel = window.getSelection();
    const saved = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const url = window.prompt("Link URL", "https://");
    if (saved) {
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(saved);
    }
    ref.current?.focus();
    if (url === null) return;
    if (url.trim() === "") document.execCommand("unlink", false);
    else document.execCommand("createLink", false, url.trim());
    emit();
    setMenu(null);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      return;
    }
    // Markdown-style bullets: typing "- " at the start of a line turns it into
    // a "• " bullet.
    if (multiline && e.key === " ") {
      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent ?? "";
      const offset = range.startOffset;
      const lineStart = text.slice(0, offset).lastIndexOf("\n") + 1;
      if (text.slice(lineStart, offset) === "-") {
        e.preventDefault();
        node.textContent = text.slice(0, lineStart) + "• " + text.slice(offset);
        const caret = lineStart + 2;
        const r = document.createRange();
        r.setStart(node, caret);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        emit();
      }
    }
  }

  return (
    <>
      <Tag
        // @ts-expect-error — ref type varies with the tag but is a valid HTMLElement ref
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={placeholder}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onBlur={() => setMenu(null)}
        className={`cursor-text whitespace-pre-wrap break-words outline-none ${
          rich ? "[&_a]:underline [&_a]:underline-offset-2" : ""
        } ${className}`}
      />
      {menu &&
        createPortal(
          <div
            style={{ position: "fixed", top: menu.top, left: menu.left, transform: "translate(-50%, calc(-100% - 8px))" }}
            className="z-50 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 shadow-lg"
            // Keep the text selection alive when a button is pressed.
            onMouseDown={(e) => e.preventDefault()}
          >
            <FmtBtn icon={Bold} label="Bold" onClick={() => exec("bold")} />
            <FmtBtn icon={Italic} label="Italic" onClick={() => exec("italic")} />
            <FmtBtn icon={Underline} label="Underline" onClick={() => exec("underline")} />
            <FmtBtn icon={Link2} label="Link" onClick={addLink} />
          </div>,
          document.body,
        )}
    </>
  );
}

function FmtBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ============================== Inline media ============================= */

function InlineMedia({
  media,
  onChange,
  aspect,
  onAspectChange,
  selected = false,
  placeholderAspect = "aspect-[16/9]",
}: {
  media: Media;
  onChange: (m: Media) => void;
  /** CSS aspect-ratio (e.g. "1600 / 900") set by the resize handles; when
   *  undefined the media keeps its natural height. */
  aspect?: string;
  onAspectChange?: (a: string) => void;
  selected?: boolean;
  placeholderAspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(file);
      onChange({ ...uploaded, caption: media.caption });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  // An embed (HTML animation) has no natural height, so it always needs an
  // aspect-ratio — default to 16:9 until the user drags the height handle.
  const effectiveAspect = aspect ?? (media.kind === "embed" ? "16 / 9" : undefined);
  const fill = effectiveAspect ? "h-full " : "";
  // Embeds carry inline `html` (no upload) instead of a `url`.
  const hasMedia = !!(media.url || media.html);

  return (
    <figure className="w-full">
      {hasMedia ? (
        <div
          ref={frameRef}
          className="group/m relative overflow-hidden rounded-3xl border border-border bg-card"
          style={effectiveAspect ? { aspectRatio: effectiveAspect } : undefined}
        >
          {media.kind === "embed" ? (
            // `pointer-events-none` so clicking the frame selects the block
            // instead of the animation swallowing the click; Replace overlay wins.
            // Inline `srcDoc` renders live HTML; `src` is a fallback for older embeds.
            <iframe
              {...(media.html ? { srcDoc: media.html } : { src: media.url })}
              title={media.caption ?? "Animation"}
              sandbox="allow-scripts allow-pointer-lock"
              className={`pointer-events-none ${fill}w-full`}
            />
          ) : media.kind === "video" ? (
            <video
              src={media.url}
              muted
              loop
              autoPlay
              playsInline
              className={`${fill}w-full object-cover`}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt="" className={`${fill}w-full object-cover`} />
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover/m:opacity-100"
          >
            <span className="inline-flex items-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Replace
            </span>
          </button>
          {selected && onAspectChange && <HeightHandle frameRef={frameRef} onChange={onAspectChange} />}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`grid ${placeholderAspect} w-full cursor-pointer place-items-center rounded-3xl border border-dashed border-border bg-background text-muted-foreground transition-colors hover:bg-foreground/5`}
        >
          <span className="flex flex-col items-center gap-2 text-sm">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
            {busy ? "Uploading…" : "Add media"}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {hasMedia && (
        <InlineText
          value={media.caption ?? ""}
          onChange={(caption) => onChange({ ...media, caption })}
          placeholder="Add a caption (optional)"
          className="mt-3 text-center text-sm text-muted-foreground"
        />
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </figure>
  );
}

/** Inline uploader for the hero (a plain image URL, not a Media object). */
function InlineImage({
  url,
  onChange,
  aspect,
  rounded,
  label,
}: {
  url: string | null;
  onChange: (v: string | null) => void;
  aspect: string;
  rounded: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const { url: uploaded } = await uploadMedia(file);
      onChange(uploaded);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      {url ? (
        <div className={`group/m relative overflow-hidden ${rounded} border border-border bg-card`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={`${aspect} w-full object-cover`} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover/m:opacity-100"
          >
            <span className="inline-flex items-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Replace {label}
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`grid ${aspect} w-full cursor-pointer place-items-center ${rounded} border border-dashed border-border bg-background text-muted-foreground transition-colors hover:bg-foreground/5`}
        >
          <span className="flex flex-col items-center gap-2 text-sm">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
            {busy ? "Uploading…" : `Add ${label}`}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* =========================== Resizable width ============================= */

function ResizableWidth({
  width,
  align,
  selected,
  onChange,
  className = "",
  children,
}: {
  width: number;
  align: BlockAlign;
  selected: boolean;
  onChange: (w: number) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const start = (dir: 1 | -1) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = (e.currentTarget as HTMLElement).closest("[data-blocks]") as HTMLElement | null;
    const cw = container?.getBoundingClientRect().width ?? 1;
    const startX = e.clientX;
    const startW = width;
    const factor = align === "center" ? 2 : 1;
    const onMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / cw) * 100 * factor * dir;
      onChange(Math.max(30, Math.min(100, Math.round(startW + dxPct))));
    };
    const up = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
  };

  const handle =
    "absolute top-1/2 z-10 h-12 w-1.5 -translate-y-1/2 cursor-col-resize rounded-full bg-[#0D99FF]";

  return (
    <div className={`relative ${className}`} style={{ width: `${width}%` }}>
      {selected && align !== "left" && (
        <div className={`${handle} -left-1`} onPointerDown={start(-1)} />
      )}
      {selected && align !== "right" && (
        <div className={`${handle} -right-1`} onPointerDown={start(1)} />
      )}
      {children}
    </div>
  );
}

/** A drag handle on the bottom edge of a media / embed frame. Dragging it sets
 *  the frame's height by writing a responsive CSS aspect-ratio (`width / height`
 *  in px — a pure ratio, so the frame still scales with the column). Pairs with
 *  the left/right width handles on `ResizableWidth`. */
function HeightHandle({
  frameRef,
  onChange,
}: {
  frameRef: React.RefObject<HTMLElement | null>;
  onChange: (aspect: string) => void;
}) {
  const start = (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const startH = rect.height;
    const startY = e.clientY;
    const onMove = (ev: PointerEvent) => {
      const h = Math.max(60, startH + (ev.clientY - startY));
      onChange(`${Math.round(w)} / ${Math.round(h)}`);
    };
    const up = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      onPointerDown={start}
      className="absolute bottom-1.5 left-1/2 z-10 h-1.5 w-12 -translate-x-1/2 cursor-row-resize rounded-full bg-[#0D99FF]"
    />
  );
}

/* ============================== Small UI ================================= */

function alignClasses(align: BlockAlign | undefined) {
  const a = align ?? "left";
  return {
    box: a === "center" ? "mx-auto" : a === "right" ? "ml-auto" : "mr-auto",
    text: a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left",
  };
}

function DeviceToggle({ device, onChange }: { device: Device; onChange: (d: Device) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-1">
      {([["web", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-label={d}
          className={`grid h-7 w-8 cursor-pointer place-items-center rounded-full transition-colors ${
            device === d ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function AlignInline({
  value,
  onChange,
}: {
  value: BlockAlign;
  onChange: (a: BlockAlign) => void;
}) {
  const opts = [["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const;
  return (
    <div className="flex items-center">
      {opts.map(([a, Icon]) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          aria-label={`Align ${a}`}
          className={`cursor-pointer rounded-full p-1.5 transition-colors ${
            value === a ? "text-[#0D99FF]" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <span className="mx-0.5 h-4 w-px bg-border" />
    </div>
  );
}

function MiniToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-2 py-0.5 text-xs transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5"
      }`}
    >
      {label}
    </button>
  );
}

function ToolBtn({
  onClick,
  label,
  icon: Icon,
  rotate,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rotate?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`cursor-pointer rounded-full p-1.5 transition-colors ${
        danger
          ? "text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${rotate ? "rotate-180" : ""}`} />
    </button>
  );
}

/* -------------------------- Drag-and-drop pieces -------------------------- */

/** A palette section — click to append, or drag onto the canvas to insert. */
function PaletteItem({ entry, onClick }: { entry: PaletteEntry; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new:${entry.kind}`,
    data: { kind: entry.kind },
  });
  const Icon = entry.icon;
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={`flex w-full cursor-grab items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-foreground/5 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-foreground/5">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{entry.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{entry.hint}</span>
      </span>
    </button>
  );
}

/** Floating chip shown under the cursor while dragging a palette section. */
function PaletteChip({ entry }: { entry: PaletteEntry }) {
  const Icon = entry.icon;
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium shadow-lg">
      <Icon className="h-4 w-4" />
      {entry.label}
    </div>
  );
}

/** Blue insertion line shown where a dragged section will land. */
function DropLine() {
  return <div className="-my-6 h-1 rounded-full bg-[#0D99FF]" />;
}

/** Drop target at the end of the list (and the empty-state placeholder). */
function EndZone({
  empty,
  dragging,
  active,
}: {
  empty: boolean;
  dragging: boolean;
  active: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: "canvas-end" });
  if (empty) {
    return (
      <div
        ref={setNodeRef}
        className={`grid place-items-center rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground transition-colors ${
          active ? "border-[#0D99FF] bg-[#0D99FF]/5" : "border-border"
        }`}
      >
        Click a section on the right, or drag one here.
      </div>
    );
  }
  return (
    <div ref={setNodeRef} className="min-h-10">
      {dragging && active && <DropLine />}
    </div>
  );
}
