"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { createProject } from "@/app/admin/actions";

export function NewProjectButton() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => createProject())}
      className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <Plus className="h-4 w-4" />
      {pending ? "Creating…" : "New project"}
    </button>
  );
}
