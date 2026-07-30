"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ContentBlock,
  FooterLogo,
  HeroFont,
  HeroRichTitle,
  Testimonial,
} from "@/lib/types";

type TestimonialInput = {
  name: string;
  role: string;
  avatar_url: string | null;
  quote: string;
};

function cleanTestimonial(input: TestimonialInput) {
  return {
    name: input.name.trim().slice(0, 120),
    role: input.role.trim().slice(0, 160) || null,
    avatar_url: input.avatar_url?.trim() || null,
    quote: input.quote.trim().slice(0, 2000),
  };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your admin session has expired. Sign in again." } as const;
  return { supabase } as const;
}

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
      card_url: null,
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
    card_url: string | null;
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
      card_url: payload.card_url,
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
    // Empty title/highlight fall back to the built-in default copy.
    hero_title: title.trim() || null,
    // Description: keep an explicit empty string (`""`) when cleared so the
    // homepage hides it — only a never-set `null` falls back to the default.
    hero_subtitle: subtitle.trim(),
    // Word/phrase inside the title that gets the Figma-selection effect.
    hero_highlight: highlight.trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setHeroTitleRich(rich: HeroRichTitle | null) {
  const supabase = await createClient();
  // Keep the plain `hero_title` in sync (fallback + any plain-text consumers):
  // the flattened words of the design, or leave untouched when clearing rich.
  const plain =
    rich && rich.lines.length > 0
      ? rich.lines
          .map((l) => l.filter((s) => s.kind !== "image").map((s) => (s as { text: string }).text).join(" "))
          .join("\n")
          .trim()
      : null;
  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    // null = fall back to the plain `hero_title` string / built-in default.
    hero_title_rich: rich,
    ...(plain ? { hero_title: plain } : {}),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setHeroSubtitle(subtitle: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    // Explicit empty string hides the description; only a never-set null falls
    // back to the built-in default copy (matches the homepage `??` logic).
    hero_subtitle: subtitle.trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function addHeroFont(font: HeroFont) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("hero_fonts")
    .eq("id", "main")
    .maybeSingle();
  const existing = (data?.hero_fonts as HeroFont[] | null) ?? [];
  const next = [...existing.filter((f) => f.id !== font.id), font];
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", hero_fonts: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, fonts: next };
}

export async function removeHeroFont(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("hero_fonts")
    .eq("id", "main")
    .maybeSingle();
  const existing = (data?.hero_fonts as HeroFont[] | null) ?? [];
  const next = existing.filter((f) => f.id !== id);
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", hero_fonts: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, fonts: next };
}

/** Clamp an incoming footer-logo record to safe, stored values. */
function cleanFooterLogo(input: FooterLogo): FooterLogo {
  const shape =
    input.shape === "circle" || input.shape === "square" ? input.shape : "free";
  return {
    id: input.id,
    url: input.url,
    size: Math.min(96, Math.max(20, Math.round(input.size) || 46)),
    shape,
    count: Math.min(20, Math.max(1, Math.round(input.count) || 3)),
    label: input.label?.trim().slice(0, 60) || undefined,
  };
}

export async function addFooterLogo(logo: FooterLogo) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("footer_logos")
    .eq("id", "main")
    .maybeSingle();
  const existing = (data?.footer_logos as FooterLogo[] | null) ?? [];
  const next = [...existing, cleanFooterLogo(logo)];
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", footer_logos: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, logos: next };
}

export async function updateFooterLogo(id: string, patch: Partial<FooterLogo>) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("footer_logos")
    .eq("id", "main")
    .maybeSingle();
  const existing = (data?.footer_logos as FooterLogo[] | null) ?? [];
  const next = existing.map((l) =>
    l.id === id ? cleanFooterLogo({ ...l, ...patch, id: l.id, url: l.url }) : l,
  );
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", footer_logos: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, logos: next };
}

export async function removeFooterLogo(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("footer_logos")
    .eq("id", "main")
    .maybeSingle();
  const existing = (data?.footer_logos as FooterLogo[] | null) ?? [];
  const next = existing.filter((l) => l.id !== id);
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", footer_logos: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, logos: next };
}

export async function setAboutSection(input: {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: "main",
    // Empty fields fall back to the built-in default copy on the homepage
    // (matches the `??` logic in the About component). Keep them as null so the
    // defaults show, rather than rendering blank.
    about_eyebrow: input.eyebrow.trim().slice(0, 60) || null,
    about_title: input.title.trim().slice(0, 200) || null,
    about_body: input.body.trim().slice(0, 2000) || null,
    about_image_url: input.imageUrl?.trim() || null,
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

export async function createTestimonial(input: TestimonialInput) {
  const values = cleanTestimonial(input);
  if (!values.name || !values.quote) {
    return { error: "Name and testimonial text are required." };
  }

  const auth = await authenticatedClient();
  if ("error" in auth) return { error: auth.error };

  const { data: existing } = await auth.supabase
    .from("testimonials")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);
  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await auth.supabase
    .from("testimonials")
    .insert({ ...values, order_index: orderIndex })
    .select("*")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not add testimonial." };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { data: data as Testimonial };
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const values = cleanTestimonial(input);
  if (!id || !values.name || !values.quote) {
    return { error: "Name and testimonial text are required." };
  }

  const auth = await authenticatedClient();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("testimonials")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not save testimonial." };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { data: data as Testimonial };
}

export async function deleteTestimonial(id: string) {
  if (!id) return { error: "Testimonial not found." };

  const auth = await authenticatedClient();
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase.from("testimonials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { ok: true };
}
