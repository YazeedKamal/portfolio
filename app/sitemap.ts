import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// Re-generate hourly so newly published projects appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: absoluteUrl(`/work/${p.slug}`),
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...projectEntries,
  ];
}
