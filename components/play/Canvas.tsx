"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor, type TLAssetStore } from "tldraw";
import "tldraw/tldraw.css";
import { Check, Loader2, Save } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Canvas() {
  const editorRef = useRef<Editor | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // Upload dropped/pasted images to Supabase Storage so they persist as URLs,
  // preserving their natural dimensions. Falls back to a data URL if offline.
  const assets = useMemo<TLAssetStore>(
    () => ({
      async upload(_asset, file) {
        if (isSupabaseConfigured) {
          try {
            const supabase = createClient();
            const ext = file.name.split(".").pop() ?? "png";
            const path = `play/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage
              .from("project-images")
              .upload(path, file, { cacheControl: "3600", upsert: false });
            if (!error) {
              const { data } = supabase.storage.from("project-images").getPublicUrl(path);
              return { src: data.publicUrl };
            }
          } catch {
            // fall through to data URL
          }
        }
        return { src: await fileToDataUrl(file) };
      },
      resolve(asset) {
        return asset.props.src;
      },
    }),
    [],
  );

  // Determine admin status (only an authenticated user can save the shared canvas).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsAdmin(!!data.user));
  }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    if (!isSupabaseConfigured) return;

    // Load the shared canvas saved by the admin, if it exists.
    const supabase = createClient();
    supabase
      .from("play_canvas")
      .select("snapshot")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.snapshot) {
          try {
            loadSnapshot(editor.store, data.snapshot as Parameters<typeof loadSnapshot>[1]);
          } catch {
            // ignore malformed snapshot
          }
        }
      });
  }, []);

  const saveCanvas = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setSaveState("saving");
    const snapshot = getSnapshot(editor.store);
    const supabase = createClient();
    await supabase
      .from("play_canvas")
      .upsert({ id: "main", snapshot, updated_at: new Date().toISOString() });
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  return (
    <div className="fixed inset-0 top-0">
      <Tldraw
        persistenceKey="portfolio-play"
        assets={assets}
        onMount={handleMount}
      />

      {isAdmin && (
        <button
          type="button"
          onClick={saveCanvas}
          disabled={saveState === "saving"}
          className="glass absolute bottom-4 right-4 z-[999] inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
        >
          {saveState === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveState === "saved" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved for everyone"
              : "Save canvas"}
        </button>
      )}
    </div>
  );
}
