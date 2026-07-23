"use client";

import {
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, Loader2, Monitor, Move, RotateCw, Save, Smartphone } from "lucide-react";
import { saveSpotlightLayouts } from "@/app/admin/actions";
import { spotlightShapes } from "@/lib/spotlight-layout";
import type {
  SpotlightItem,
  SpotlightLayout,
  SpotlightPlacement,
} from "@/lib/types";

type Device = "desktop" | "mobile";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mediaShape(placement: SpotlightPlacement) {
  switch (placement.shape) {
    case "landscape":
      return "aspect-[4/3] rounded-2xl";
    case "square":
      return "aspect-square rounded-2xl";
    case "circle":
      return "aspect-square rounded-full";
    case "polaroid":
      return "aspect-[4/5] rounded-sm bg-white p-1.5 pb-5 shadow-xl";
    default:
      return "aspect-[4/5] rounded-2xl";
  }
}

export function SpotlightLayoutEditor({
  items,
  onSaved,
}: {
  items: SpotlightItem[];
  onSaved: (layouts: Record<string, SpotlightLayout>) => void;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [layouts, setLayouts] = useState<Record<string, SpotlightLayout>>(
    Object.fromEntries(items.map((item) => [item.id, item.layout])),
  );
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedPlacement = selected ? layouts[selected.id]?.[device] : null;

  function updatePlacement(id: string, next: Partial<SpotlightPlacement>) {
    setLayouts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [device]: { ...current[id][device], ...next },
      },
    }));
    setDirty(true);
    setSaved(false);
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    const placement = layouts[id][device];
    setSelectedId(id);
    dragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      originX: placement.x,
      originY: placement.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = dragRef.current;
    const stage = stageRef.current;
    if (!active || !stage) return;
    const bounds = stage.getBoundingClientRect();
    const placement = layouts[active.id][device];
    const x = active.originX + ((event.clientX - active.startX) / bounds.width) * 100;
    const y = active.originY + ((event.clientY - active.startY) / bounds.height) * 100;
    updatePlacement(active.id, {
      x: clamp(x, -4, 100 - placement.width + 4),
      y: clamp(y, -5, 92),
    });
  }

  function stopDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveSpotlightLayouts(
        items.map((item) => ({ id: item.id, layout: layouts[item.id] })),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setSaved(true);
      onSaved(layouts);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  if (!items.length) return null;

  return (
    <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h3 className="font-semibold tracking-tight">Design the layout</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Drag media on the canvas, then tune its size, angle and shape.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                device === "desktop"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Web
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                device === "mobile"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {pending ? "Saving…" : saved ? "Saved" : "Save layout"}
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_230px]">
        <div className="overflow-auto bg-[#151518] p-4 sm:p-6">
          <div
            ref={stageRef}
            className={`relative mx-auto overflow-hidden bg-[#050506] text-white shadow-2xl ${
              device === "desktop"
                ? "aspect-video w-full min-w-[620px]"
                : "aspect-[9/16] max-h-[720px] w-full max-w-[405px]"
            }`}
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)",
              backgroundSize: device === "desktop" ? "32px 32px" : "24px 24px",
            }}
          >
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center text-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
                  Photos · films · memories
                </p>
                <p
                  className={`mt-2 font-semibold tracking-[-0.075em] ${
                    device === "desktop" ? "text-6xl" : "text-4xl"
                  }`}
                >
                  Spotlight
                </p>
                <p className="mt-2 text-[10px] text-white/40">
                  Moments worth keeping.
                </p>
              </div>
            </div>

            {items.map((item, index) => {
              const placement = layouts[item.id][device];
              const active = item.id === selected?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={(event) => startDrag(event, item.id)}
                  onPointerMove={drag}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  className={`absolute cursor-grab touch-none select-none overflow-hidden shadow-2xl transition-shadow active:cursor-grabbing ${mediaShape(
                    placement,
                  )} ${active ? "ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-black" : ""}`}
                  style={{
                    left: `${placement.x}%`,
                    top: `${placement.y}%`,
                    width: `${placement.width}%`,
                    transform: `rotate(${placement.rotation}deg)`,
                    zIndex: active ? 40 : 10 + index,
                  }}
                  aria-label={`Move ${item.title || `item ${index + 1}`}`}
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      muted
                      playsInline
                      className="pointer-events-none h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media_url}
                      alt=""
                      draggable={false}
                      className="pointer-events-none h-full w-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="border-t border-border p-5 lg:border-l lg:border-t-0">
          {selected && selectedPlacement ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Selected
                </p>
                <p className="mt-1 truncate text-sm font-medium">
                  {selected.title || "Untitled media"}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Move className="h-3.5 w-3.5" />
                    Size
                  </span>
                  <span>{Math.round(selectedPlacement.width)}%</span>
                </div>
                <input
                  type="range"
                  min={device === "desktop" ? 8 : 18}
                  max={device === "desktop" ? 34 : 68}
                  step={1}
                  value={selectedPlacement.width}
                  onChange={(event) =>
                    updatePlacement(selected.id, {
                      width: Number(event.target.value),
                    })
                  }
                  className="w-full accent-foreground"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <RotateCw className="h-3.5 w-3.5" />
                    Rotation
                  </span>
                  <span>{Math.round(selectedPlacement.rotation)}°</span>
                </div>
                <input
                  type="range"
                  min={-18}
                  max={18}
                  step={1}
                  value={selectedPlacement.rotation}
                  onChange={(event) =>
                    updatePlacement(selected.id, {
                      rotation: Number(event.target.value),
                    })
                  }
                  className="w-full accent-foreground"
                />
              </div>

              <div>
                <p className="mb-2 text-xs text-muted-foreground">Shape</p>
                <div className="grid grid-cols-2 gap-2">
                  {spotlightShapes.map((shape) => (
                    <button
                      key={shape.value}
                      type="button"
                      onClick={() =>
                        updatePlacement(selected.id, { shape: shape.value })
                      }
                      className={`rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                        selectedPlacement.shape === shape.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/30"
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Switch between Web and Mobile to create a separate composition for each.
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-t border-border bg-red-500/10 px-5 py-3 text-sm text-red-500"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
