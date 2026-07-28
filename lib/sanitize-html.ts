// Lightweight, dependency-free sanitizer for the inline rich text (bold /
// italic / underline / link) produced by the admin editor, run before rendering
// it with `dangerouslySetInnerHTML`.
//
// It intentionally avoids DOMPurify/jsdom: those pull a browser DOM into the
// server bundle and fail on serverless production runtimes. This is pure string
// processing, so it behaves identically on the server, the client and the edge.
//
// The content is authored only by the authenticated site owner, so this just
// needs to neutralise the real footguns: script/style elements, every
// attribute (event handlers, inline styles…), disallowed tags, and unsafe link
// protocols such as `javascript:`.

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "br", "div", "p", "span"]);
const SAFE_HREF = /^(?:https?:|mailto:|tel:|\/)/i;

export function sanitizeRichText(html: string): string {
  if (!html) return "";

  // Drop <script>/<style> elements including their contents.
  let out = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");

  // Rewrite every remaining tag: keep only the allowlist, strip ALL attributes,
  // and validate link hrefs. Anything else has its tag removed (text kept).
  out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_match, slash, name, attrs) => {
    const tag = (name as string).toLowerCase();
    const closing = slash === "/";

    if (tag === "a") {
      if (closing) return "</a>";
      const m = (attrs as string).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
      const href = (m ? (m[1] ?? m[2] ?? m[3] ?? "") : "").trim();
      if (SAFE_HREF.test(href)) {
        const safe = href
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer nofollow">`;
      }
      return "<a>";
    }

    if (ALLOWED_TAGS.has(tag)) return closing ? `</${tag}>` : `<${tag}>`;

    // Disallowed element (img, iframe, svg, …): drop the tag, keep its text.
    return "";
  });

  return out;
}
