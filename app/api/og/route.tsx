import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Branded 1200×630 social preview card. Referenced explicitly from page metadata
// (`?title=…&subtitle=…`) so pages can fall back to it when they have no cover
// image of their own. See `app/layout.tsx`, `app/about/page.tsx`,
// `app/work/[slug]/page.tsx`.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function clamp(value: string | null, max: number): string {
  if (!value) return "";
  const v = value.trim();
  return v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clamp(searchParams.get("title"), 90) || SITE.name;
  const subtitle = clamp(searchParams.get("subtitle"), 140) || SITE.role;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #fafafa 0%, #f0f0f3 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 600,
            color: "#111111",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#111111",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 18,
              fontSize: 24,
            }}
          >
            Y
          </div>
          {SITE.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#0a0a0a",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 28,
                fontSize: 34,
                lineHeight: 1.3,
                color: "#555555",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#888888" }}>
          {SITE.role}
        </div>
      </div>
    ),
    { ...size },
  );
}
