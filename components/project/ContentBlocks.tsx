import { Reveal } from "@/components/ui/Reveal";
import type { ContentBlock } from "@/lib/types";

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks?.length) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-20">
      {blocks.map((block, i) => (
        <Reveal key={i}>
          <Block block={block} />
        </Reveal>
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div>
          {block.heading && (
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {block.heading}
            </h2>
          )}
          <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80">
            {block.body}
          </p>
        </div>
      );

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
