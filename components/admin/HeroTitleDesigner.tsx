"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  Image as ImageIcon,
  Italic,
  Loader2,
  Minus,
  Plus,
  SquareDashed,
  Trash2,
  Upload,
} from "lucide-react";
import { addHeroFont, removeHeroFont, setHeroTitleRich } from "@/app/admin/actions";
import { FontPicker } from "@/components/admin/FontPicker";
import { HeroFontFaces } from "@/components/hero/HeroFontFaces";
import { heroFontFamily } from "@/lib/hero-fonts";
import { FONT_ACCEPT, uploadFont } from "@/lib/upload-font";
import { SVG_ACCEPT, uploadSvg } from "@/lib/upload-svg";
import {
  heroImageStyle,
  isHeroImage,
  type HeroFont,
  type HeroImageSegment,
  type HeroRichTitle,
  type HeroSegment,
  type HeroTextSegment,
} from "@/lib/types";

const DEFAULT_TITLE = "Product designer crafting calm, human interfaces.";

// Headline defaults matching the homepage classes (tracking-tight / leading-[1.05]).
const DEFAULT_LETTER = -0.025;
const DEFAULT_WORD = 0;
const DEFAULT_LINE = 1.05;

const WEIGHTS = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extrabold" },
];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/** Words → lines of segments, reusing existing text segments (id + styling) by
 *  matching word text, and re-inserting inline images at their anchors so both
 *  survive text edits. */
function reconcile(text: string, prevLines: HeroSegment[][]): HeroSegment[][] {
  const images: { seg: HeroImageSegment; lineIndex: number; afterTextId: string | null }[] = [];
  prevLines.forEach((line, li) => {
    let lastTextId: string | null = null;
    for (const seg of line) {
      if (isHeroImage(seg)) images.push({ seg, lineIndex: li, afterTextId: lastTextId });
      else lastTextId = seg.id;
    }
  });

  const pool = new Map<string, HeroTextSegment[]>();
  for (const line of prevLines)
    for (const seg of line)
      if (!isHeroImage(seg)) {
        const q = pool.get(seg.text);
        if (q) q.push(seg);
        else pool.set(seg.text, [seg]);
      }

  const newLines: HeroSegment[][] = text.split("\n").map((line) =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map((word): HeroSegment => {
        const q = pool.get(word);
        const reused = q && q.length ? q.shift() : undefined;
        return reused ? { ...reused, text: word } : { id: uid(), text: word };
      }),
  );

  for (const img of images) {
    const target = newLines[img.lineIndex] ?? newLines[newLines.length - 1];
    if (!target) {
      newLines.push([img.seg]);
      continue;
    }
    if (img.afterTextId == null) target.unshift(img.seg);
    else {
      const idx = target.findIndex((s) => s.id === img.afterTextId);
      if (idx >= 0) target.splice(idx + 1, 0, img.seg);
      else target.push(img.seg);
    }
  }
  return newLines;
}

function toText(lines: HeroSegment[][]): string {
  return lines
    .map((l) => l.filter((s): s is HeroTextSegment => !isHeroImage(s)).map((s) => s.text).join(" "))
    .join("\n");
}

function segStyle(seg: HeroTextSegment, fonts: HeroFont[]): React.CSSProperties {
  return {
    fontFamily: heroFontFamily(seg.font, fonts),
    fontWeight: seg.weight ?? 400,
    fontStyle: seg.italic ? "italic" : undefined,
    fontSize: seg.size && seg.size !== 1 ? `${seg.size}em` : undefined,
    color: seg.color || undefined,
  };
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  decimals,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const round = (v: number) => Math.round(v * 10 ** decimals) / 10 ** decimals;
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="inline-flex items-center gap-1 rounded-lg border border-border px-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, round(value - step)))}
          className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-foreground/5"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-14 text-center text-xs tabular-nums text-muted-foreground">
          {value.toFixed(decimals)}
          {suffix}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, round(value + step)))}
          className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-foreground/5"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function HeroTitleDesigner({
  initialRich,
  initialTitle,
  initialFonts,
}: {
  initialRich: HeroRichTitle | null;
  initialTitle: string | null;
  initialFonts: HeroFont[];
}) {
  const hasInitial = !!(initialRich && initialRich.lines.length > 0);
  const seedText = hasInitial ? toText(initialRich!.lines) : initialTitle || DEFAULT_TITLE;

  const [lines, setLines] = useState<HeroSegment[][]>(
    hasInitial ? initialRich!.lines : reconcile(seedText, []),
  );
  const [text, setText] = useState(seedText);
  const [fonts, setFonts] = useState<HeroFont[]>(initialFonts);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [letterSpacing, setLetterSpacing] = useState(initialRich?.letterSpacing ?? DEFAULT_LETTER);
  const [wordSpacing, setWordSpacing] = useState(initialRich?.wordSpacing ?? DEFAULT_WORD);
  const [lineHeight, setLineHeight] = useState(initialRich?.lineHeight ?? DEFAULT_LINE);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [uploadingSvg, setUploadingSvg] = useState(false);
  const [pending, start] = useTransition();
  const fontFileRef = useRef<HTMLInputElement>(null);
  const svgFileRef = useRef<HTMLInputElement>(null);

  // Direct-manipulation state for SVGs on the canvas (drag to reposition,
  // corner handle to resize).
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ line: number; index: number } | null>(null);

  const selected = useMemo(
    () => lines.flat().find((s) => s.id === selectedId) ?? null,
    [lines, selectedId],
  );
  const textSel = selected && !isHeroImage(selected) ? selected : null;
  const imgSel = selected && isHeroImage(selected) ? selected : null;

  const spacingStyle: React.CSSProperties = {
    letterSpacing: `${letterSpacing}em`,
    wordSpacing: `${wordSpacing}em`,
    lineHeight,
  };

  function onTextChange(next: string) {
    setText(next);
    setLines((prev) => reconcile(next, prev));
  }

  function patchSelected(patch: Partial<HeroTextSegment> | Partial<HeroImageSegment>) {
    if (!selectedId) return;
    setLines((prev) =>
      prev.map((line) =>
        line.map((seg) => (seg.id === selectedId ? ({ ...seg, ...patch } as HeroSegment) : seg)),
      ),
    );
  }

  function insertAfterSelection(seg: HeroSegment) {
    setLines((prev) => {
      const next = prev.map((l) => [...l]);
      for (const line of next) {
        const idx = line.findIndex((s) => s.id === selectedId);
        if (idx >= 0) {
          line.splice(idx + 1, 0, seg);
          return next;
        }
      }
      if (next.length === 0) next.push([seg]);
      else next[next.length - 1].push(seg);
      return next;
    });
  }

  function deleteSelected() {
    if (!selectedId) return;
    setLines((prev) => prev.map((line) => line.filter((s) => s.id !== selectedId)));
    setSelectedId(null);
  }

  /** Nearest word-gap to a pointer, as a {line, index} insertion point. */
  function computeDropTarget(x: number, y: number): { line: number; index: number } | null {
    const container = canvasRef.current;
    if (!container) return null;
    const lineEls = Array.from(container.querySelectorAll<HTMLElement>("[data-line]"));
    if (lineEls.length === 0) return null;

    let lineEl = lineEls.find((el) => {
      const r = el.getBoundingClientRect();
      return y >= r.top && y <= r.bottom;
    });
    if (!lineEl) {
      let best = Infinity;
      for (const el of lineEls) {
        const r = el.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - y);
        if (d < best) {
          best = d;
          lineEl = el;
        }
      }
    }
    if (!lineEl) return null;

    const li = Number(lineEl.getAttribute("data-line"));
    const tokens = Array.from(lineEl.querySelectorAll<HTMLElement>("[data-index]"));
    let index = tokens.length;
    for (const el of tokens) {
      const r = el.getBoundingClientRect();
      if (x < (r.left + r.right) / 2) {
        index = Number(el.getAttribute("data-index"));
        break;
      }
    }
    return { line: li, index };
  }

  function commitMove(segId: string, target: { line: number; index: number } | null) {
    if (!target) return;
    setLines((prev) => {
      let orig: HeroSegment | null = null;
      let origLine = -1;
      let origIndex = -1;
      prev.forEach((line, li) =>
        line.forEach((s, si) => {
          if (s.id === segId) {
            orig = s;
            origLine = li;
            origIndex = si;
          }
        }),
      );
      if (!orig) return prev;

      const tl = target.line;
      let ti = target.index;
      if (!prev[tl]) return prev;
      // Removing an earlier item on the same line shifts the target left by one.
      if (origLine === tl && origIndex < ti) ti -= 1;

      const next = prev.map((line) => line.filter((s) => s.id !== segId));
      next[tl].splice(ti, 0, orig);
      return next;
    });
  }

  /** Pointer-down on an SVG: click selects, drag (past a threshold) repositions. */
  function startImageDrag(e: React.PointerEvent, seg: HeroImageSegment) {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const onMove = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
        dragging = true;
        setDragId(seg.id);
        setSelectedId(seg.id);
      }
      if (dragging) {
        setDragPos({ x: ev.clientX, y: ev.clientY });
        setDropTarget(computeDropTarget(ev.clientX, ev.clientY));
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (dragging) {
        commitMove(seg.id, computeDropTarget(ev.clientX, ev.clientY));
        setDragId(null);
        setDragPos(null);
        setDropTarget(null);
      } else {
        setSelectedId(seg.id);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /** Drag the corner handle to resize the SVG (height in em). */
  function startResize(e: React.PointerEvent, seg: HeroImageSegment) {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startSize = seg.size ?? 1;
    const fontPx = canvasRef.current
      ? parseFloat(getComputedStyle(canvasRef.current).fontSize) || 40
      : 40;

    const onMove = (ev: PointerEvent) => {
      const next = Math.min(3, Math.max(0.3, Math.round((startSize + (ev.clientY - startY) / fontPx) * 20) / 20));
      setLines((prev) => prev.map((line) => line.map((s) => (s.id === seg.id ? { ...s, size: next } : s))));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const draggingSeg =
    dragId != null ? (lines.flat().find((s) => s.id === dragId) as HeroImageSegment | undefined) : undefined;

  function save() {
    setError(null);
    const hasContent = lines.some((l) => l.length > 0);
    const rich: HeroRichTitle = { lines, letterSpacing, wordSpacing, lineHeight };
    start(async () => {
      const res = await setHeroTitleRich(hasContent ? rich : null);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function onFontFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingFont(true);
    try {
      const { url, format } = await uploadFont(file);
      const font: HeroFont = {
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Custom font",
        url,
        format,
      };
      const res = await addHeroFont(font);
      if (res?.error) throw new Error(res.error);
      setFonts((f) => [...f.filter((x) => x.id !== font.id), font]);
      if (textSel) patchSelected({ font: font.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the font.");
    } finally {
      setUploadingFont(false);
      if (fontFileRef.current) fontFileRef.current.value = "";
    }
  }

  async function onSvgFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingSvg(true);
    try {
      const { url } = await uploadSvg(file);
      const seg: HeroImageSegment = {
        id: uid(),
        kind: "image",
        url,
        alt: file.name.replace(/\.svg$/i, "").slice(0, 60),
        size: 1,
      };
      insertAfterSelection(seg);
      setSelectedId(seg.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the SVG.");
    } finally {
      setUploadingSvg(false);
      if (svgFileRef.current) svgFileRef.current.value = "";
    }
  }

  function deleteFont(id: string) {
    start(async () => {
      const res = await removeHeroFont(id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setFonts((f) => f.filter((x) => x.id !== id));
      setLines((prev) =>
        prev.map((line) =>
          line.map((seg) =>
            !isHeroImage(seg) && seg.font === id ? { ...seg, font: undefined } : seg,
          ),
        ),
      );
    });
  }

  const wordSize = textSel?.size ?? 1;
  const imgSize = imgSel?.size ?? 1;
  const imgDy = imgSel?.dy ?? 0;
  const imgGap = imgSel?.gap ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      {/* Custom fonts, injected live so newly uploaded ones render immediately. */}
      <HeroFontFaces fonts={fonts} />

      <p className="text-sm font-medium">Hero headline</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Design it by hand — click a word to restyle it, drag an SVG to move it
        between any two words, resize it from its corner, and tune the spacing.
      </p>

      {/* WYSIWYG canvas */}
      <div
        onClick={() => setSelectedId(null)}
        className="mt-4 cursor-default rounded-xl border border-border bg-background p-6 text-center"
      >
        <div
          ref={canvasRef}
          className="text-4xl font-semibold sm:text-5xl"
          style={{ ...spacingStyle, touchAction: dragId ? "none" : undefined }}
        >
          {lines.map((line, li) => (
            <div key={li} data-line={li}>
              {line.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                <>
                  {line.map((seg, si) => (
                    <span key={seg.id}>
                      {/* drop caret before this token */}
                      {dropTarget && dropTarget.line === li && dropTarget.index === si ? (
                        <span className="mx-0.5 inline-block h-[1em] w-0.5 align-middle bg-[#0D99FF]" />
                      ) : null}
                      {si > 0 ? " " : null}
                      {isHeroImage(seg) ? (
                        <span
                          data-index={si}
                          className={`relative inline-block align-middle ${dragId === seg.id ? "opacity-30" : ""}`}
                        >
                          <button
                            type="button"
                            onPointerDown={(e) => startImageDrag(e, seg)}
                            style={{ touchAction: "none" }}
                            className={`block cursor-grab rounded px-0.5 active:cursor-grabbing ${
                              seg.id === selectedId
                                ? "bg-[#0D99FF]/10 ring-2 ring-[#0D99FF]"
                                : "hover:bg-foreground/5"
                            } ${seg.figma ? "outline outline-2 outline-offset-2 outline-[#0D99FF]" : ""}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={seg.url}
                              alt={seg.alt ?? ""}
                              draggable={false}
                              className="pointer-events-none inline-block select-none align-middle"
                              style={heroImageStyle(seg)}
                            />
                          </button>
                          {/* resize handle (bottom-right), only when selected */}
                          {seg.id === selectedId ? (
                            <span
                              onPointerDown={(e) => startResize(e, seg)}
                              style={{ touchAction: "none" }}
                              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-[#0D99FF] bg-white"
                            />
                          ) : null}
                        </span>
                      ) : (
                        <button
                          type="button"
                          data-index={si}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(seg.id);
                          }}
                          style={segStyle(seg, fonts)}
                          className={`rounded px-0.5 align-middle transition ${
                            seg.id === selectedId
                              ? "bg-[#0D99FF]/10 ring-2 ring-[#0D99FF]"
                              : "hover:bg-foreground/5"
                          } ${seg.figma ? "outline outline-2 outline-offset-2 outline-[#0D99FF]" : ""}`}
                        >
                          {seg.text}
                        </button>
                      )}
                    </span>
                  ))}
                  {/* drop caret at end of line */}
                  {dropTarget && dropTarget.line === li && dropTarget.index === line.length ? (
                    <span className="mx-0.5 inline-block h-[1em] w-0.5 align-middle bg-[#0D99FF]" />
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating clone that follows the cursor while dragging an SVG */}
      {draggingSeg && dragPos ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draggingSeg.url} alt="" style={{ height: 44, width: "auto" }} />
        </div>
      ) : null}

      {/* Insert SVG */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => svgFileRef.current?.click()}
          disabled={uploadingSvg}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          {uploadingSvg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Insert SVG
        </button>
        <span className="text-xs text-muted-foreground">
          Adds it after the selected word (or at the end).
        </span>
        <input
          ref={svgFileRef}
          type="file"
          accept={SVG_ACCEPT}
          onChange={(e) => onSvgFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {/* Per-word toolbar */}
      {textSel ? (
        <div className="mt-3 rounded-xl border border-border bg-background p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Styling <span className="font-medium text-foreground">“{textSel.text}”</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FontPicker
              value={textSel.font ?? "default"}
              onChange={(id) => patchSelected({ font: id === "default" ? undefined : id })}
              fonts={fonts}
            />

            <select
              value={textSel.weight ?? 400}
              onChange={(e) => patchSelected({ weight: Number(e.target.value) })}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-foreground/40"
            >
              {WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => patchSelected({ italic: !textSel.italic })}
              aria-pressed={!!textSel.italic}
              title="Italic"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                textSel.italic
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-foreground/5"
              }`}
            >
              <Italic className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center gap-1 rounded-lg border border-border px-1">
              <button
                type="button"
                title="Smaller"
                onClick={() => patchSelected({ size: Math.max(0.5, Math.round((wordSize - 0.1) * 10) / 10) })}
                className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-foreground/5"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                {wordSize.toFixed(1)}×
              </span>
              <button
                type="button"
                title="Bigger"
                onClick={() => patchSelected({ size: Math.min(2.5, Math.round((wordSize + 0.1) * 10) / 10) })}
                className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-foreground/5"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <label
              title="Color"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 hover:bg-foreground/5"
            >
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ background: textSel.color || "var(--foreground)" }}
              />
              <input
                type="color"
                value={textSel.color || "#000000"}
                onChange={(e) => patchSelected({ color: e.target.value })}
                className="sr-only"
              />
            </label>
            {textSel.color ? (
              <button
                type="button"
                onClick={() => patchSelected({ color: null })}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Reset color
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => patchSelected({ figma: !textSel.figma })}
              aria-pressed={!!textSel.figma}
              title="Figma-selection frame"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition ${
                textSel.figma
                  ? "border-[#0D99FF] bg-[#0D99FF]/10 text-[#0D99FF]"
                  : "border-border hover:bg-foreground/5"
              }`}
            >
              <SquareDashed className="h-4 w-4" />
              Figma
            </button>
          </div>

          {/* Color preview on light + dark backgrounds (the site has both themes). */}
          {textSel.color ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Preview:</span>
              <div className="flex overflow-hidden rounded-lg border border-border">
                <div className="bg-white px-3 py-1.5">
                  <span
                    className="text-lg leading-none"
                    style={{ color: textSel.color, fontFamily: heroFontFamily(textSel.font, fonts), fontWeight: textSel.weight ?? 400, fontStyle: textSel.italic ? "italic" : undefined }}
                  >
                    {textSel.text}
                  </span>
                </div>
                <div className="bg-neutral-950 px-3 py-1.5">
                  <span
                    className="text-lg leading-none"
                    style={{ color: textSel.color, fontFamily: heroFontFamily(textSel.font, fonts), fontWeight: textSel.weight ?? 400, fontStyle: textSel.italic ? "italic" : undefined }}
                  >
                    {textSel.text}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : imgSel ? (
        <div className="mt-3 rounded-xl border border-border bg-background p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Styling the SVG — <span className="text-foreground/70">Vertical</span> nudges it up
            (−) or down (+); <span className="text-foreground/70">Spacing</span> tightens (−) or
            widens the gap to nearby words.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Stepper
              label="Height"
              value={imgSize}
              min={0.3}
              max={3}
              step={0.1}
              decimals={1}
              suffix="×"
              onChange={(v) => patchSelected({ size: v })}
            />
            <Stepper
              label="Vertical"
              value={imgDy}
              min={-1}
              max={1}
              step={0.02}
              decimals={2}
              suffix="em"
              onChange={(v) => patchSelected({ dy: v })}
            />
            <Stepper
              label="Spacing"
              value={imgGap}
              min={-0.5}
              max={1}
              step={0.02}
              decimals={2}
              suffix="em"
              onChange={(v) => patchSelected({ gap: v })}
            />
            <button
              type="button"
              onClick={() => patchSelected({ figma: !imgSel.figma })}
              aria-pressed={!!imgSel.figma}
              title="Figma-selection frame"
              className={`inline-flex h-9 items-center gap-1.5 self-end rounded-lg border px-2.5 text-sm transition ${
                imgSel.figma
                  ? "border-[#0D99FF] bg-[#0D99FF]/10 text-[#0D99FF]"
                  : "border-border hover:bg-foreground/5"
              }`}
            >
              <SquareDashed className="h-4 w-4" />
              Figma
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              title="Remove SVG"
              className="inline-flex h-9 items-center gap-1.5 self-end rounded-lg border border-border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Click a word or SVG above to edit it.
        </p>
      )}

      {/* Spacing — applies to the whole headline */}
      <div className="mt-4 rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Spacing (whole headline)</p>
        <div className="flex flex-wrap items-center gap-4">
          <Stepper label="Letters" value={letterSpacing} min={-0.1} max={0.5} step={0.005} decimals={3} suffix="em" onChange={setLetterSpacing} />
          <Stepper label="Words" value={wordSpacing} min={0} max={2} step={0.05} decimals={2} suffix="em" onChange={setWordSpacing} />
          <Stepper label="Lines" value={lineHeight} min={0.8} max={2.5} step={0.05} decimals={2} onChange={setLineHeight} />
        </div>
      </div>

      {/* Words + line breaks */}
      <div className="mt-3">
        <label htmlFor="hero-words" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Words
        </label>
        <textarea
          id="hero-words"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={2}
          placeholder={DEFAULT_TITLE}
          className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Space separates words, Enter starts a new line. Editing a word keeps its
          styling; retyping it resets to default. SVGs stay where you placed them.
        </p>
      </div>

      {/* Font library */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Your fonts</p>
          <button
            type="button"
            onClick={() => fontFileRef.current?.click()}
            disabled={uploadingFont}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploadingFont ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload font
          </button>
          <input
            ref={fontFileRef}
            type="file"
            accept={FONT_ACCEPT}
            onChange={(e) => onFontFile(e.target.files?.[0])}
            className="hidden"
          />
        </div>
        {fonts.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Upload a .woff2, .woff, .ttf, or .otf file to use your own font per word.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {fonts.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5"
              >
                <span className="text-sm" style={{ fontFamily: `"hf-${f.id}"` }}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => deleteFont(f.id)}
                  title="Remove font"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex justify-end">
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
  );
}
