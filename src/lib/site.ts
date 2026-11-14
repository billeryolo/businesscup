/** The public address of the site, for links in previews, the sitemap and robots.txt. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
);

export const siteName = "ReadCheck";
export const siteTitle = "ReadCheck — a 1-minute reading check for kids";
export const siteDescription =
  "Your child reads aloud for one minute. ReadCheck compares the result with national reading norms, shows the mistake patterns, and gives you a 10-minute daily plan.";
