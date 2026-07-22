"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { signOut } from "@/app/admin/actions";

const tabs = [
  { href: "/admin", label: "Projects" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/projects");
  }
  return pathname.startsWith(href);
}

/** Shared admin header: tab switcher + theme toggle + site/sign-out actions. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            title="View site"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative rounded-full px-5 py-2 text-sm font-medium"
            >
              {active && (
                <motion.span
                  layoutId="admin-tab"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  active ? "text-background" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
