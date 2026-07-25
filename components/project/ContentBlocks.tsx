import { Reveal } from "@/components/ui/Reveal";
import { BlockIcon } from "@/components/icon-library";
import { infoColsClass } from "@/lib/info-columns";
import type { BlockAlign, ColumnContent, ContentBlock, Media } from "@/lib/types";

export function ContentBlocks({
  blocks,
  reveal = true,
  padded = true,
}: {
  blocks: ContentBlock[];
  /** Scroll-triggered fade-in. Disable inside the bottom sheet, where the
   *  content scrolls in its own container and `whileInView` (window-based)
   *  wouldn't fire for blocks below the fold. */
  reveal?: boolean;
  /** Own outer padding + centering. Disable in the sheet, which supplies its
   *  own 24px padding and left-aligns the column under the hero. */
  padded?: boolean;
}) {
  if (!blocks?.length) return null;

  return (
    // `@container` so multi-column sections respond to the CONTENT column width
    // (accurate for real mobile/desktop AND the builder's device toggle).
    <div
      className={
        padded
          ? "mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-20 @container"
          : "flex w-full flex-col gap-16 pt-10 @container"
      }
    >
      {blocks.map((block, i) =>
        reveal ? (
          <Reveal key={i}>
            <BlockView block={block} />
          </Reveal>
        ) : (
          <div key={i}>
            <BlockView block={block} />
          </div>
        ),
      )}
    </div>
  );
}

/** Horizontal-align helpers for a width-constrained block. */
function alignClasses(align: BlockAlign | undefined) {
  const a = align ?? "left";
  return {
    box: a === "center" ? "mx-auto" : a === "right" ? "ml-auto" : "mr-auto",
    text: a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left",
  };
}

function MediaView({ media }: { media: Media }) {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {media.kind === "video" ? (
          <video
            src={media.url}
            muted
            loop
            autoPlay
            playsInline
            className="w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.caption ?? ""} className="w-full object-cover" />
        )}
      </div>
      {media.caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}

function TextView({ heading, body }: { heading?: string; body: string }) {
  return (
    <div>
      {heading && (
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">{heading}</h2>
      )}
      <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80">
        {body}
      </p>
    </div>
  );
}

function ColumnContentView({ content }: { content: ColumnContent }) {
  return content.kind === "media" ? (
    <MediaView media={content.media} />
  ) : (
    <TextView heading={content.heading} body={content.body} />
  );
}

/** Renders a single content block. Exported so the admin builder preview reuses
 *  the exact same visuals as the public page/sheet. */
export function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text": {
      const { box, text } = alignClasses(block.align);
      return (
        <div className={`${box} ${text}`} style={{ width: `${block.width ?? 100}%` }}>
          {block.heading && (
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">{block.heading}</h2>
          )}
          <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80">
            {block.body}
          </p>
        </div>
      );
    }

    case "media": {
      const { box } = alignClasses(block.align);
      return (
        <div className={box} style={{ width: `${block.width ?? 100}%` }}>
          <MediaView media={block.media} />
        </div>
      );
    }

    case "columns":
      return (
        <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-center @2xl:gap-8">
          {block.columns.map((col, ci) => (
            <div
              key={ci}
              // Full-width when stacked (narrow container); a proportional
              // flex-grow weight (freeform, never overflows) when laid out as a
              // row — width `50/50` = equal, `60/40` = 60% vs 40%, etc.
              style={{ ["--col-g" as string]: `${col.width}` }}
              className="w-full min-w-0 @2xl:w-auto @2xl:basis-0 @2xl:grow-[var(--col-g)]"
            >
              <ColumnContentView content={col.content} />
            </div>
          ))}
        </div>
      );

    case "info":
      return (
        <dl className={`grid grid-cols-1 gap-x-10 gap-y-7 ${infoColsClass(block.columns)}`}>
          {block.items.map((item, i) => (
            <div key={i}>
              <dt className="flex items-center gap-2">
                <BlockIcon name={item.icon} className="h-5 w-5 shrink-0 text-foreground/70" />
                <span className="text-lg font-semibold tracking-tight">{item.title}</span>
              </dt>
              {item.body && (
                <dd className="mt-1 whitespace-pre-line leading-relaxed text-foreground/70">
                  {item.body}
                </dd>
              )}
            </div>
          ))}
        </dl>
      );

    case "divider":
      return <hr className="border-t border-border" />;

    // ---- Legacy blocks (already-saved projects) ----
    case "image":
      return (
        <figure>
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.url}
              alt={block.caption ?? ""}
              className="w-full"
              style={
                block.width && block.height
                  ? { aspectRatio: `${block.width} / ${block.height}` }
                  : undefined
              }
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "gallery":
      return (
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          {block.images.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? ""} className="w-full object-cover" />
              {img.caption && (
                <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      );

    default:
      return null;
  }
}
