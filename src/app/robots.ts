import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shadify.in";

  // Prevent preview deployments or test environments from indexing
  if (isVercelPreview || baseUrl.includes("vercel.app")) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy", "/refunds"],
        disallow: ["/api/", "/admin/", "/staff/", "/auth/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
