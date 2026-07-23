import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SpotlightManager } from "@/components/admin/SpotlightManager";
import { normalizeSpotlightLayout } from "@/lib/spotlight-layout";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SpotlightItem } from "@/lib/types";

export const revalidate = 0;

export default async function AdminSpotlightPage() {
  if (!isSupabaseConfigured) redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spotlight_items")
    .select("*")
    .order("order_index", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
      <AdminNav />
      <SpotlightManager
        initialItems={(data ?? []).map((item, index) => ({
          ...item,
          layout: normalizeSpotlightLayout(item.layout, index),
        })) as SpotlightItem[]}
        setupError={error?.message ?? null}
      />
    </main>
  );
}
