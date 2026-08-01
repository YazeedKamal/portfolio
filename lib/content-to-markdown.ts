import type { ContentBlock, Media, Project } from "@/lib/types";

/**
 * Serializes a project's structured `ContentBlock[]` (`lib/types.ts`) into clean
 * markdown so AI agents/crawlers can read a case study without wading through the
 * interactive UI. Powers `/work/<slug>.md` and the `/llms.txt` index.
 *
 * Rich-text bodies contain the small tag allowlist produced by the admin editor
 * (b/strong, i/em, u, a, br, p, div, span — see `lib/sanitize-html.ts`); those
 * are converted to markdown, everything else is stripped.
 */

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/** Inline rich-text HTML → markdown (keeps bold/italic/links, drops the rest). */
function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let s = html;

  // Links → [label](href)
  s = s.replace(
    /<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, dq, sq, inner) => {
      const href = ((dq ?? sq ?? "") as string).trim();
      const label = decodeEntities(stripTags(inner)).trim();
      return href ? `[${label}](${href})` : label;
    },
  );

  s = s.replace(/<\/?(?:b|strong)\b[^>]*>/gi, "**");
  s = s.replace(/<\/?(?:i|em)\b[^>]*>/gi, "_");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(?:p|div)>/gi, "\n\n");
  s = s.replace(/<(?:p|div)\b[^>]*>/gi, "");
  s = stripTags(s); // u, span, and anything else
  s = decodeEntities(s);

  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Rich-text HTML → single-line plain text (for descriptions/summaries). */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  const s = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div)>/gi, " ");
  return decodeEntities(stripTags(s)).replace(/\s+/g, " ").trim();
}

function mediaMarkdown(media: Media): string {
  if (media.kind === "embed") {
    return media.caption
      ? `_[interactive embed: ${media.caption}]_`
      : "_[interactive embed]_";
  }
  if (media.kind === "video") {
    return `[▶ video${media.caption ? `: ${media.caption}` : ""}](${media.url})`;
  }
  const alt = (media.caption ?? "").replace(/[[\]]/g, "");
  return `![${alt}](${media.url})`;
}

/** A project's content blocks as a markdown body. */
export function contentBlocksToMarkdown(blocks: ContentBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks ?? []) {
    switch (block.type) {
      case "text": {
        if (block.heading) parts.push(`## ${htmlToPlainText(block.heading)}`);
        const body = htmlToMarkdown(block.body);
        if (body) parts.push(body);
        break;
      }
      case "media": {
        parts.push(mediaMarkdown(block.media));
        break;
      }
      case "columns": {
        for (const col of block.columns) {
          const c = col.content;
          if (c.kind === "text") {
            if (c.heading) parts.push(`## ${htmlToPlainText(c.heading)}`);
            const body = htmlToMarkdown(c.body);
            if (body) parts.push(body);
          } else {
            parts.push(mediaMarkdown(c.media));
          }
        }
        break;
      }
      case "info": {
        const lines = block.items.map(
          (it) => `- **${htmlToPlainText(it.title)}** — ${htmlToPlainText(it.body)}`,
        );
        if (lines.length) parts.push(lines.join("\n"));
        break;
      }
      case "divider":
        parts.push("---");
        break;
      // ---- Legacy blocks (already-saved projects) ----
      case "image": {
        const alt = (block.caption ?? "").replace(/[[\]]/g, "");
        parts.push(`![${alt}](${block.url})`);
        break;
      }
      case "gallery": {
        for (const img of block.images) {
          const alt = (img.caption ?? "").replace(/[[\]]/g, "");
          parts.push(`![${alt}](${img.url})`);
        }
        break;
      }
    }
  }

  return parts.join("\n\n");
}

/** A short, single-line plain-text summary of a project (for meta descriptions
 *  and the llms.txt index) — its subtitle, else the first text block. */
export function projectSummary(
  project: Pick<Project, "subtitle" | "content">,
  maxLen = 160,
): string {
  let raw = project.subtitle ?? "";

  if (!raw.trim()) {
    for (const b of project.content ?? []) {
      if (b.type === "text" && b.body) {
        raw = b.body;
        break;
      }
      if (b.type === "columns") {
        const t = b.columns.find(
          (c) => c.content.kind === "text" && c.content.body,
        );
        if (t && t.content.kind === "text") {
          raw = t.content.body;
          break;
        }
      }
    }
  }

  const text = htmlToPlainText(raw);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).replace(/\s+\S*$/, "").trimEnd() + "…";
}

/** A full standalone markdown document for one project. */
export function projectToMarkdown(
  project: Pick<Project, "title" | "subtitle" | "content">,
): string {
  const header = [`# ${project.title}`];
  if (project.subtitle) header.push(`> ${project.subtitle}`);
  const body = contentBlocksToMarkdown(project.content ?? []);
  return `${[header.join("\n\n"), body].filter(Boolean).join("\n\n")}\n`;
}
