"use client";

import { useState, useTransition } from "react";
import { setAvailability } from "@/app/admin/actions";

/** Admin switch for the hero's "Available for new work" badge. */
export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next); // optimistic
    start(async () => {
      const res = await setAvailability(next);
      if (res?.error) setOn(!next); // revert on failure
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
      <div>
        <p className="text-sm font-medium">Available for new work</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Shows the green availability badge on your homepage hero.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Toggle availability badge"
        disabled={pending}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
          on ? "bg-emerald-500" : "bg-foreground/15"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            on ? "left-[calc(100%-1.625rem)]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
