import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://website-health-checker-seven.vercel.app/",
      lastModified: new Date(),
    },
  ];
}