import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ProjectList } from "@/components/admin/ProjectList";
import { NewProjectButton } from "@/components/admin/NewProjectButton";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Project } from "@/lib/types";

export const revalidate = 0;

export default async function AdminProjectsPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("order_index", { ascending: true });
  const projects = (data ?? []) as Project[];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <AdminNav />

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag to reorder. Toggle publish to show on your site.
          </p>
        </div>
        <NewProjectButton />
      </div>

      <div className="mt-6">
        <ProjectList initialProjects={projects} />
      </div>
    </main>
  );
}

function SetupNotice() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-24">
      <div className="rounded-3xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Finish your Supabase setup
        </h1>
        <p className="mt-2 text-muted-foreground">
          The admin needs a backend. Once you connect Supabase, sign-in, uploads,
          and reordering all light up here.
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
          <li>Create a free project at supabase.com.</li>
          <li>
            Run <code className="rounded bg-foreground/10 px-1.5 py-0.5">supabase/migrations/0001_init.sql</code>{" "}
            in the SQL editor.
          </li>
          <li>Add an admin user under Authentication → Users.</li>
          <li>
            Copy your URL + anon key into{" "}
            <code className="rounded bg-foreground/10 px-1.5 py-0.5">.env.local</code>{" "}
            and restart the dev server.
          </li>
        </ol>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-foreground/5"
        >
          Back to site
        </Link>
      </div>
    </main>
  );
}
