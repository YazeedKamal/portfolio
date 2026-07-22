"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/", label: "Work" },
  { href: "/play", label: "Play" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/work");
  return pathname.startsWith(href);
}

export function DynamicIsland({ avatarUrl }: { avatarUrl?: string | null }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  // Hide the public navbar inside the admin area.
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        layout
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass pointer-events-auto flex items-center gap-1 rounded-full py-1.5 pl-4 pr-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      >
        <Link
          href="/"
          className="mr-1 flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-foreground text-[11px] font-bold text-background">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              "Y"
            )}
          </span>
          <span className="hidden sm:inline">Yazeed</span>
        </Link>

        <div
          className="flex items-center"
          onMouseLeave={() => setHovered(null)}
        >
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                className="relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
              >
                {hovered === link.href && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 rounded-full bg-foreground/5"
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    active ? "text-foreground" : "text-foreground/55 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute -bottom-0.5 left-1/2 z-10 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mx-1 h-4 w-px bg-border-strong/60" />
        <ThemeToggle />
      </motion.nav>
    </div>
  );
}
