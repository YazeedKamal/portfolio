/**
 * Renders one or more schema.org objects as a JSON-LD `<script>` for search
 * engines and AI crawlers. Server component — safe to drop into any page tree.
 * `<` is escaped so serialized content can never break out of the script tag.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
