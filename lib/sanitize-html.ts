import DOMPurify from "isomorphic-dompurify";

// Force every link to open safely in a new tab. Registered once at module load.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow");
  }
});

/**
 * Sanitize the inline rich text produced by the admin editor (bold / italic /
 * underline / link) before rendering it with `dangerouslySetInnerHTML`.
 * Only a tiny formatting whitelist survives; links are limited to safe
 * protocols so a `javascript:` URL can never execute.
 */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "a", "br", "div", "p", "span"],
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/)/i,
  });
}
