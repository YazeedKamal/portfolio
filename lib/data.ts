import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sampleProjects, sampleTestimonials } from "@/lib/sample-data";
import type { Project, Testimonial } from "@/lib/types";

/** Published projects for the home grid (falls back to sample data). */
export async function getPublishedProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return sampleProjects;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("order_index", { ascending: true });

  if (error || !data) return sampleProjects;
  return data as Project[];
}

/** A single published project by slug (null if not found). */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return sampleProjects.find((p) => p.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Project;
}

/** Site-wide settings; falls back to built-in defaults when unset. */
export async function getSiteSettings(): Promise<{
  available_for_work: boolean;
  avatar_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_highlight: string | null;
}> {
  const fallback = {
    available_for_work: true,
    avatar_url: null,
    hero_title: null,
    hero_subtitle: null,
    hero_highlight: null,
  };
  if (!isSupabaseConfigured) return fallback;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("available_for_work, avatar_url, hero_title, hero_subtitle, hero_highlight")
    .eq("id", "main")
    .maybeSingle();

  if (error || !data) return fallback;
  return data;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return sampleTestimonials;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("order_index", { ascending: true });

  if (error || !data) return sampleTestimonials;
  return data as Testimonial[];
}
