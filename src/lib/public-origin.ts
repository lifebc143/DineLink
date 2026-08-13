export function getPublicOrigin(headers: Headers, fallbackOrigin: string) {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host")?.trim();
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (!forwardedHost) return fallbackOrigin;
  const protocol = forwardedProto || (forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${forwardedHost}`;
}
