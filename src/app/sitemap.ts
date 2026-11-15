import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/check", priority: 0.9 },
  { path: "/practice", priority: 0.7 },
  { path: "/about", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: new URL(p.path, siteUrl).toString(), priority: p.priority }));
}
