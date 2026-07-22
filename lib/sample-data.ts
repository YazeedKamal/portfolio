import type { Project, Testimonial } from "@/lib/types";

/**
 * Fallback content shown before Supabase is configured, so the site is fully
 * viewable out of the box. Once env vars are set, real data takes over.
 */
export const sampleProjects: Project[] = [
  {
    id: "sample-1",
    slug: "aurora-banking",
    title: "Aurora — Banking Reimagined",
    subtitle: "A calm, trustworthy mobile banking experience.",
    cover_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80",
    order_index: 0,
    published: true,
    created_at: new Date(0).toISOString(),
    content: [
      {
        type: "text",
        heading: "Overview",
        body: "Aurora rethinks everyday banking around clarity and calm. The product strips away noise so people can act with confidence — every screen answers one question and gets out of the way.",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80",
        caption: "Home dashboard — balance-first, distraction-free.",
      },
      {
        type: "text",
        heading: "Outcome",
        body: "Task completion up 32%, support tickets down 21% in the first quarter after launch.",
      },
    ],
  },
  {
    id: "sample-2",
    slug: "lumen-design-system",
    title: "Lumen Design System",
    subtitle: "Scalable design language for a fast-growing product suite.",
    cover_url:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80",
    order_index: 1,
    published: true,
    created_at: new Date(0).toISOString(),
    content: [
      {
        type: "text",
        heading: "The problem",
        body: "Five teams, five visual languages. Lumen unifies them into one accessible, themeable system — tokens, components, and guidelines that scale.",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1600&q=80",
        caption: "Component library overview.",
      },
    ],
  },
  {
    id: "sample-3",
    slug: "nomad-travel",
    title: "Nomad — Travel Companion",
    subtitle: "Planning trips should feel like the trip itself.",
    cover_url:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80",
    order_index: 2,
    published: true,
    created_at: new Date(0).toISOString(),
    content: [
      {
        type: "text",
        heading: "Concept",
        body: "An itinerary that breathes — flexible, visual, and joyful to build. Nomad turns trip planning from a spreadsheet into a canvas.",
      },
    ],
  },
];

export const sampleTestimonials: Testimonial[] = [
  {
    id: "t-1",
    name: "Sarah Chen",
    role: "VP Product, Northwind",
    avatar_url: null,
    quote:
      "One of the sharpest product thinkers I've worked with. Ships taste and rigor in equal measure.",
    order_index: 0,
  },
  {
    id: "t-2",
    name: "Miguel Torres",
    role: "Founder, Layer",
    avatar_url: null,
    quote:
      "Turned a vague idea into a product our users genuinely love. A rare blend of craft and speed.",
    order_index: 1,
  },
  {
    id: "t-3",
    name: "Aisha Rahman",
    role: "Design Director, Vela",
    avatar_url: null,
    quote:
      "Every detail considered, nothing precious. Exactly the kind of designer teams fight to keep.",
    order_index: 2,
  },
];
