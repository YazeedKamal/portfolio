"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Canvas = dynamic(
  () => import("@/components/play/Canvas").then((m) => m.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading canvas…</p>
        </div>
      </div>
    ),
  },
);

export default function PlayPage() {
  return <Canvas />;
}
