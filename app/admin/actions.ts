"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ContentBlock } from "@/lib/types";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function signIn(_prev: unknown, formData: FormData) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase isn't configured yet. Add your keys to .env.local." };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProject() {
  const supabase = await createClient();

  // Place the new draft at the top.
  const { data: existing } = await supabase
    .from("projects")
    .select("order_index")
    .order("order_index", { ascending: true })
    .limit(1);
  const minOrder = existing?.[0]?.order_index ?? 0;

  const stamp = Math.floor(Date.now() / 1000);
  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug: `untitled-${stamp}`,
      title: "Untitled project",
      subtitle: "",
      cover_url: null,
      order_index: minOrder - 1,
      published: false,
      content: [],
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create project");

  revalidatePath("/admin");
  redirect(`/admin/projects/${data.id}`);
}

export async function updateProject(
  id: string,
  payload: {
    title: string;
    subtitle: string;
    slug: string;
    cover_url: string | null;
    content: ContentBlock[];
    published: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      title: payload.title,
      subtitle: payload.subtitle,
      slug: slugify(payload.slug || payload.title) || `project-${id.slice(0, 6)}`,
      cover_url: payload.cover_url,
      content: payload.content,
      published: payload.published,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setPublished(id: string, published: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setAvailability(available: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", available_for_work: available, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function setHeroText(title: string, subtitle: string, highlight: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    // Empty inputs fall back to the built-in default copy.
    hero_title: title.trim() || null,
    hero_subtitle: subtitle.trim() || null,
    // Word/phrase inside the title that gets the Figma-selection effect.
    hero_highlight: highlight.trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setAvatar(url: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", avatar_url: url, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderProjects(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("projects").update({ order_index: index }).eq("id", id),
    ),
  );
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
