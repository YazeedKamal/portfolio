import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ProjectBuilder } from "@/components/admin/ProjectBuilder";
import { getOtherProjects } from "@/lib/data";
import type { Project } from "@/lib/types";

export const revalidate = 0;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const project = data as Project;
  const others = await getOtherProjects(project.slug);

  return <ProjectBuilder project={project} otherProjects={others} />;
}
