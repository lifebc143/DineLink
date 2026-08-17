export type InAppBrowser = "line" | "facebook" | null;

export function detectInAppBrowser(userAgent: string): InAppBrowser {
  const value = userAgent.toLowerCase();
  if (value.includes("line/")) return "line";
  if (value.includes("fban") || value.includes("fbav") || value.includes("facebook")) return "facebook";
  return null;
}

export function isIOS(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function loginRedirectHref(origin?: string, returnTo?: string) {
  const params = new URLSearchParams();
  if (origin) params.set("origin", origin);
  if (returnTo === "/?tab=create") params.set("returnTo", returnTo);
  const query = params.toString();
  return `/api/auth/login${query ? `?${query}` : ""}`;
}
