"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import type { FooterLogo } from "@/lib/types";

/** Height of the physics canvas area. */
const HEIGHT = 260;
/** Radius (px) of the mouse repulsion field. */
const REPEL_RADIUS = 150;
/** Push strength — scaled by body mass so everything accelerates evenly. */
const REPEL_FORCE = 0.0022;
/** At/above this canvas width, elements show at their admin size. */
const BASE_WIDTH = 1024;
/** Never shrink elements below this fraction on very narrow screens. */
const MIN_SCALE = 0.4;
/** Element size multiplier for the current canvas width — so logos shrink on
 *  small screens and always keep room to move (never enlarged past 1×). */
const scaleForWidth = (w: number) =>
  Math.max(MIN_SCALE, Math.min(1, w / BASE_WIDTH));

type Palette = { badge: string; badgeStroke: string };

/** Theme-aware chip colour drawn behind badged logos. */
function palette(dark: boolean): Palette {
  const base = dark ? "245, 245, 245" : "10, 10, 10";
  return {
    badge: dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.04)",
    badgeStroke: `rgba(${base}, 0.16)`,
  };
}

/** Preload an image and resolve its natural dimensions. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Per-logo data we stash on the Matter body for custom rendering. */
type LogoPlugin = {
  img: HTMLImageElement;
  shape: FooterLogo["shape"];
  size: number;
  w: number;
  h: number;
};

export function FooterPhysics({ logos = [] }: { logos?: FooterLogo[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect users who prefer reduced motion — skip the whole simulation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Nothing to show until the user uploads logos.
    if (logos.length === 0) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Body,
      Events,
      Common,
    } = Matter;

    const height = HEIGHT;
    const dpr = window.devicePixelRatio || 1;
    const isDark = () => document.documentElement.classList.contains("dark");

    let started = false;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    // ---- Scene builder (runs once we have a real width) ---------------------
    const init = (initialWidth: number) => {
      let width = initialWidth;

      const engine = Engine.create();
      engine.gravity.y = 0.9;
      // Steadier stacking/resting than the defaults (6) — feels more solid.
      engine.positionIterations = 8;
      engine.velocityIterations = 8;

      const render = Render.create({
        element: container,
        engine,
        options: {
          width,
          height,
          background: "transparent",
          wireframes: false,
          pixelRatio: dpr,
        },
      });

      // Invisible walls keep the logos inside the footer — no drawn edges.
      const T = 200; // wall thickness
      const wallOpts: Matter.IChamferableBodyDefinition = {
        isStatic: true,
        render: { visible: false },
      };
      let walls: Matter.Body[] = [];
      const buildWalls = () => {
        if (walls.length) Composite.remove(engine.world, walls);
        walls = [
          Bodies.rectangle(width / 2, height + T / 2, width + T * 2, T, wallOpts),
          Bodies.rectangle(width / 2, -height - T / 2, width + T * 2, T, wallOpts),
          Bodies.rectangle(-T / 2, height / 2, T, height * 3, wallOpts),
          Bodies.rectangle(width + T / 2, height / 2, T, height * 3, wallOpts),
        ];
        Composite.add(engine.world, walls);
      };
      buildWalls();

      let pal = palette(isDark());
      const rand = (min: number, max: number) => Common.random(min, max);

      // Responsive size multiplier — shrinks elements on narrow screens.
      let scale = scaleForWidth(width);

      // Logos are custom-drawn each frame (badge chip + image on top).
      const logoBodies: Matter.Body[] = [];

      const makeLogo = (logo: FooterLogo, img: HTMLImageElement) => {
        const size = (logo.size || 46) * scale;
        const aspect =
          img.naturalWidth && img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : 1;
        // Bounds for the "free" shape (keep the logo's aspect ratio).
        const w = aspect >= 1 ? size : size * aspect;
        const h = aspect >= 1 ? size / aspect : size;

        const x = rand(40, Math.max(41, width - 40));
        const y = rand(20, height - 40);
        const common: Matter.IBodyDefinition = {
          restitution: 0.35, // moderate bounce — a soft settle, not rubbery
          friction: 0.1,
          frictionStatic: 0.5,
          frictionAir: 0.01, // less floaty: fall and settle naturally
          render: { visible: false },
        };
        let body: Matter.Body;
        if (logo.shape === "circle") {
          body = Bodies.circle(x, y, size / 2, common);
        } else if (logo.shape === "square") {
          body = Bodies.rectangle(x, y, size, size, {
            ...common,
            chamfer: { radius: size * 0.2 },
          });
        } else {
          body = Bodies.rectangle(x, y, w, h, {
            ...common,
            chamfer: { radius: Math.min(w, h) * 0.12 },
          });
        }
        body.plugin = { img, shape: logo.shape, size, w, h } satisfies LogoPlugin;
        Body.setAngle(body, rand(-0.4, 0.4));
        return body;
      };

      // ---- Spawn each logo `count` times (loaded async) ---------------------
      logos.forEach((logo) => {
        loadImage(logo.url)
          .then((img) => {
            if (cancelled) return;
            const count = Math.min(20, Math.max(1, Math.round(logo.count) || 1));
            const batch: Matter.Body[] = [];
            for (let i = 0; i < count; i++) {
              const body = makeLogo(logo, img);
              batch.push(body);
              logoBodies.push(body);
            }
            Composite.add(engine.world, batch);
          })
          .catch(() => {
            /* bad/broken logo data — skip silently */
          });
      });

      // ---- Custom render pass: draw badge + logo image on top ---------------
      const onAfterRender = () => {
        const ctx = render.context;
        for (const body of logoBodies) {
          const p = body.plugin as LogoPlugin;
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);

          let boxW = p.w;
          let boxH = p.h;
          if (p.shape !== "free") {
            const s = p.size;
            ctx.beginPath();
            if (p.shape === "circle") {
              ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            } else {
              ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.2);
            }
            ctx.fillStyle = pal.badge;
            ctx.fill();
            ctx.lineWidth = 1.25;
            ctx.strokeStyle = pal.badgeStroke;
            ctx.stroke();

            const inner = s * 0.56; // logo fits within ~56% of the chip
            const aspect = p.w / p.h || 1;
            boxW = aspect >= 1 ? inner : inner * aspect;
            boxH = aspect >= 1 ? inner / aspect : inner;
          }
          ctx.drawImage(p.img, -boxW / 2, -boxH / 2, boxW, boxH);
          ctx.restore();
        }
      };
      Events.on(render, "afterRender", onAfterRender);

      // ---- Mouse repulsion: the moving cursor pushes logos away -------------
      const pointer = { x: 0, y: 0, active: false };
      const onMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      };
      const onLeave = () => {
        pointer.active = false;
      };
      // Plain pointer listeners (no preventDefault) — mobile scroll is untouched.
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerleave", onLeave);

      const onBeforeUpdate = () => {
        if (!pointer.active) return;
        const radius = REPEL_RADIUS * scale; // proportional on small screens
        for (const body of logoBodies) {
          const dx = body.position.x - pointer.x;
          const dy = body.position.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          if (dist < radius) {
            const strength = 1 - dist / radius;
            const f = REPEL_FORCE * body.mass * strength;
            Body.applyForce(body, body.position, {
              x: (dx / dist) * f,
              y: (dy / dist) * f,
            });
          }
        }
      };
      Events.on(engine, "beforeUpdate", onBeforeUpdate);

      // ---- Recolour chips on theme toggle -----------------------------------
      const themeObserver = new MutationObserver(() => {
        pal = palette(isDark());
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // ---- Apply a new width (bitmap + CSS + bounds + walls) ----------------
      const applyWidth = (next: number) => {
        if (next <= 0 || next === width) return;
        width = next;

        // Re-scale existing elements to the new width (resize / orientation).
        const nextScale = scaleForWidth(width);
        if (nextScale !== scale) {
          const factor = nextScale / scale;
          for (const body of logoBodies) {
            Body.scale(body, factor, factor);
            const p = body.plugin as LogoPlugin;
            p.size *= factor;
            p.w *= factor;
            p.h *= factor;
          }
          scale = nextScale;
        }

        render.canvas.width = width * dpr;
        render.canvas.height = height * dpr;
        render.canvas.style.width = `${width}px`;
        render.canvas.style.height = `${height}px`;
        render.options.width = width;
        render.options.height = height;
        render.bounds.max.x = width;
        render.bounds.max.y = height;
        buildWalls();
      };

      const runner = Runner.create();
      Runner.run(runner, engine);
      Render.run(render);

      cleanup = () => {
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerleave", onLeave);
        themeObserver.disconnect();
        Events.off(render, "afterRender", onAfterRender);
        Events.off(engine, "beforeUpdate", onBeforeUpdate);
        Render.stop(render);
        Runner.stop(runner);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        render.canvas.remove();
        render.textures = {};
      };

      return applyWidth;
    };

    // ---- Kick off once the container has a real width -----------------------
    let applyWidth: ((w: number) => void) | null = null;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (!started) {
        if (w > 0) {
          started = true;
          applyWidth = init(w);
        }
      } else {
        applyWidth?.(w);
      }
    });
    ro.observe(container);

    // Fast path: width already known synchronously.
    const initialWidth = container.clientWidth;
    if (!started && initialWidth > 0) {
      started = true;
      applyWidth = init(initialWidth);
    }

    return () => {
      cancelled = true;
      ro.disconnect();
      cleanup?.();
    };
  }, [logos]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative w-full cursor-default select-none overflow-hidden"
      style={{ height: HEIGHT }}
    />
  );
}
