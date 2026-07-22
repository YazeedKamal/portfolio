"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { deleteProject, reorderProjects, setPublished } from "@/app/admin/actions";
import type { Project } from "@/lib/types";

export function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const next = arrayMove(projects, oldIndex, newIndex);
    setProjects(next);
    reorderProjects(next.map((p) => p.id));
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border py-20 text-center text-muted-foreground">
        No projects yet. Create your first one above.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <Row
              key={project.id}
              project={project}
              onDeleted={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))}
              onToggle={(id, published) =>
                setProjects((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, published } : p)),
                )
              }
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Row({
  project,
  onDeleted,
  onToggle,
}: {
  project: Project;
  onDeleted: (id: string) => void;
  onToggle: (id: string, published: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });
  const [pending, start] = useTransition();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab touch-none rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/5 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{project.title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              project.published
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-foreground/10 text-muted-foreground"
            }`}
          >
            {project.published ? "Published" : "Draft"}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">/{project.slug}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setPublished(project.id, !project.published);
              onToggle(project.id, !project.published);
            })
          }
          title={project.published ? "Unpublish" : "Publish"}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {project.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link
          href={`/admin/projects/${project.id}`}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Delete "${project.title}"? This can't be undone.`)) return;
            start(async () => {
              await deleteProject(project.id);
              onDeleted(project.id);
            });
          }}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
