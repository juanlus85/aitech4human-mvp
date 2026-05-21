/**
 * Storage adapter — dual mode:
 *  • When BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY are set → Manus S3 (original behaviour)
 *  • Otherwise → local filesystem under <uploadDir>/  served at /uploads/
 *
 * The public URL format is:
 *  - Manus:  /manus-storage/<key>
 *  - Local:  /uploads/<key>
 */

import { ENV } from "./_core/env";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function isForgeAvailable(): boolean {
  return !!(ENV.forgeApiUrl && ENV.forgeApiKey);
}

// ─── local storage ──────────────────────────────────────────────────────────

/**
 * Resolve the uploads directory.
 * In production (dist/index.js) __dirname is dist/, so we go up one level.
 * In development (tsx watch) import.meta.dirname is server/_core/, so we go up two levels.
 * We use process.cwd() which is always the project root in both cases.
 */
function getUploadDir(): string {
  const dir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType: string,
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, key.replace(/\//g, "_"));
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);
  await fs.promises.writeFile(filePath, buf);
  // The URL uses the flat filename (slashes replaced with underscores)
  const fileName = key.replace(/\//g, "_");
  return { key, url: `/uploads/${fileName}` };
}

// ─── Manus S3 storage (original) ────────────────────────────────────────────

async function forgePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const forgeKey = ENV.forgeApiKey;
  const key = appendHashSuffix(normalizeKey(relKey));

  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  if (isForgeAvailable()) {
    return forgePut(relKey, data, contentType);
  }
  return localPut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (isForgeAvailable()) {
    return { key, url: `/manus-storage/${key}` };
  }
  const fileName = key.replace(/\//g, "_");
  return { key, url: `/uploads/${fileName}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  if (!isForgeAvailable()) {
    const key = normalizeKey(relKey);
    return `/uploads/${key.replace(/\//g, "_")}`;
  }

  const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const forgeKey = ENV.forgeApiKey;
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
