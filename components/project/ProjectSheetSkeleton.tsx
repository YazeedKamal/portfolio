/**
 * Loading placeholder shown inside the project sheet while the case study is
 * fetched. Mirrors the real layout: cover (16:9) + title + subtitle, then a
 * few content lines and an image block. Theme-adaptive via `bg-foreground`.
 */
export function ProjectSheetSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full">
        {/* Cover */}
        <div className="aspect-[16/9] w-full rounded-[2rem] bg-foreground/[0.06]" />
        {/* Title */}
        <div className="mt-12 h-9 w-2/3 rounded-2xl bg-foreground/[0.06] sm:h-12" />
        {/* Subtitle */}
        <div className="mt-5 h-6 w-1/2 rounded-xl bg-foreground/[0.06]" />
      </div>

      <div className="flex w-full flex-col gap-4 pt-10">
        <div className="h-5 w-full rounded-lg bg-foreground/[0.06]" />
        <div className="h-5 w-11/12 rounded-lg bg-foreground/[0.06]" />
        <div className="h-5 w-4/5 rounded-lg bg-foreground/[0.06]" />
        <div className="mt-8 h-64 w-full rounded-3xl bg-foreground/[0.06]" />
      </div>
    </div>
  );
}
