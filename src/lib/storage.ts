/** Minimal Next.js S3 helper adapted from the platform storage contract. */
function getStorageConfig() {
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!forgeUrl || !forgeKey) throw new Error("Built-in storage credentials are unavailable");
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function uniqueKey(relKey: string) {
  const key = relKey.replace(/^\/+/, "");
  const dot = key.lastIndexOf(".");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return dot < 0 ? `${key}_${suffix}` : `${key.slice(0, dot)}_${suffix}${key.slice(dot)}`;
}

export async function storagePut(relKey: string, data: string | Uint8Array | ArrayBuffer, contentType = "application/json") {
  const { forgeUrl, forgeKey } = getStorageConfig();
  const key = uniqueKey(relKey);
  const endpoint = new URL("v1/storage/presign/put", `${forgeUrl}/`);
  endpoint.searchParams.set("path", key);
  const presign = await fetch(endpoint, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!presign.ok) throw new Error(`Storage presign failed (${presign.status})`);
  const { url } = await presign.json() as { url?: string };
  if (!url) throw new Error("Storage returned an empty upload URL");
  const uploaded = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: data as unknown as BodyInit });
  if (!uploaded.ok) throw new Error(`Storage upload failed (${uploaded.status})`);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(key: string) {
  const { forgeUrl, forgeKey } = getStorageConfig();
  const endpoint = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  endpoint.searchParams.set("path", key.replace(/^\/+/, ""));
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!response.ok) throw new Error(`Storage download presign failed (${response.status})`);
  const { url } = await response.json() as { url?: string };
  if (!url) throw new Error("Storage returned an empty download URL");
  return url;
}
