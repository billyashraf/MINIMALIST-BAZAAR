import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products"],
        disallow: ["/dashboard/", "/api/", "/checkout/", "/orders/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
