import { Reveal } from "@/components/ui/Reveal";
import { AutoVideo } from "@/components/ui/AutoVideo";
import { BlockIcon } from "@/components/icon-library";
import { infoColsClass } from "@/lib/info-columns";
import { sanitizeRichText } from "@/lib/sanitize-html";
import type { BlockAlign, ColumnContent, ContentBlock, Media } from "@/lib/types";

// Shared classes for rendered rich-text bodies (bold / italic / underline /
// link). Links get an underline so they read as links on the page.
const RICH_TEXT = "[&_a]:underline [&_a]:underline-offset-2";

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

function MediaView({ media, aspect }: { media: Media; aspect?: string }) {
  // An embed (HTML animation) has no natural height, so it always needs an
  // aspect-ratio — fall back to 16:9 when the user hasn't resized it.
  const effectiveAspect = aspect ?? (media.kind === "embed" ? "16 / 9" : undefined);
  const fill = effectiveAspect ? "h-full " : "";
  return (
    <figure className="w-full">
      <div
        className="overflow-hidden rounded-3xl border border-border bg-card"
        style={effectiveAspect ? { aspectRatio: effectiveAspect } : undefined}
      >
        {media.kind === "embed" ? (
          <iframe
            // Inline `srcDoc` renders the markup as live HTML; `src` is only a
            // fallback for older embeds saved as a URL.
            {...(media.html ? { srcDoc: media.html } : { src: media.url })}
            title={media.caption ?? "Animation"}
            loading="lazy"
            sandbox="allow-scripts allow-pointer-lock"
            className={`${fill}w-full`}
          />
        ) : media.kind === "video" ? (
          <AutoVideo src={media.url} className={`${fill}w-full object-cover`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt={media.caption ?? ""}
            loading="lazy"
            decoding="async"
            className={`${fill}w-full object-cover`}
          />
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

function TextView({
  heading,
  body,
  reserveHeading = false,
}: {
  heading?: string;
  body: string;
  // Keep the heading's height even when empty, so a title-less column still
  // lines up with sibling columns that do have a title (row layout only).
  reserveHeading?: boolean;
}) {
  return (
    <div>
      {heading ? (
        <h2 className="mb-3 text-base font-semibold tracking-tight sm:text-lg">{heading}</h2>
      ) : reserveHeading ? (
        <h2 aria-hidden className="mb-3 hidden text-base font-semibold tracking-tight sm:text-lg @2xl:block">
          &nbsp;
        </h2>
      ) : null}
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base ${RICH_TEXT}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
      />
    </div>
  );
}

function ColumnContentView({
  content,
  reserveHeading,
}: {
  content: ColumnContent;
  reserveHeading?: boolean;
}) {
  return content.kind === "media" ? (
    <MediaView media={content.media} aspect={content.aspect} />
  ) : (
    <TextView heading={content.heading} body={content.body} reserveHeading={reserveHeading} />
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
            <h2 className="mb-4 text-base font-semibold tracking-tight sm:text-lg">{block.heading}</h2>
          )}
          <p
            className={`whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base ${RICH_TEXT}`}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.body) }}
          />
        </div>
      );
    }

    case "media": {
      const { box } = alignClasses(block.align);
      return (
        <div className={box} style={{ width: `${block.width ?? 100}%` }}>
          <MediaView media={block.media} aspect={block.aspect} />
        </div>
      );
    }

    case "columns": {
      // If any column has a title, reserve the title's height in the others so
      // their bodies stay aligned across the row.
      const anyHeading = block.columns.some(
        (c) => c.content.kind === "text" && (c.content.heading ?? "").trim() !== "",
      );
      return (
        <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start @2xl:gap-8">
          {block.columns.map((col, ci) => (
            <div
              key={ci}
              // Full-width when stacked (narrow container); a proportional
              // flex-grow weight (freeform, never overflows) when laid out as a
              // row — width `50/50` = equal, `60/40` = 60% vs 40%, etc.
              style={{ ["--col-g" as string]: `${col.width}` }}
              className="w-full min-w-0 @2xl:w-auto @2xl:basis-0 @2xl:grow-[var(--col-g)]"
            >
              <ColumnContentView content={col.content} reserveHeading={anyHeading} />
            </div>
          ))}
        </div>
      );
    }

    case "info":
      return (
        <dl className={`grid grid-cols-1 gap-x-10 gap-y-7 ${infoColsClass(block.columns)}`}>
          {block.items.map((item, i) => (
            <div key={i}>
              <dt className="flex items-center gap-2">
                <BlockIcon name={item.icon} className="h-5 w-5 shrink-0 text-foreground/70" />
                <span className="text-base font-semibold tracking-tight sm:text-lg">{item.title}</span>
              </dt>
              {item.body && (
                <dd
                  className={`mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/70 sm:text-base ${RICH_TEXT}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.body) }}
                />
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
              loading="lazy"
              decoding="async"
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
              <img
                src={img.url}
                alt={img.caption ?? ""}
                loading="lazy"
                decoding="async"
                className="w-full object-cover"
              />
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
