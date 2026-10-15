import type { MetadataRoute } from "next";

const PUBLIC_PAGES = [
  "",
  "/features",
  "/how-it-works",
  "/security",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/sign-in",
  "/sign-up",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Only public pages are indexed — /app/* is excluded by robots.txt
  // and by middleware auth, so private documents never leak into search.
  return PUBLIC_PAGES.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
