/* eslint @typescript-eslint/no-var-requires: ["off"] */

// TODO: Drop when Node 18 is EOL: 2025-04-30
if (!globalThis.crypto) {
  // tslint:disable-next-line: no-var-requires
  globalThis.crypto = require("node:crypto").webcrypto;
}

const BASE64_URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function bytesToBase64Url(bytes: Uint8Array): string {
  const len = bytes.length;
  let base64url = "";

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i] & 0xff;
    const b2 = i + 1 < len ? bytes[i + 1] & 0xff : 0;
    const b3 = i + 2 < len ? bytes[i + 2] & 0xff : 0;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 0x03) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 0x0f) << 2) | (b3 >> 6);
    const enc4 = b3 & 0x3f;

    base64url += BASE64_URL_CHARS.charAt(enc1) + BASE64_URL_CHARS.charAt(enc2);
    if (i + 1 < len) {
      base64url += BASE64_URL_CHARS.charAt(enc3);
    }
    if (i + 2 < len) {
      base64url += BASE64_URL_CHARS.charAt(enc4);
    }
  }

  return base64url;
}

export async function sha256(
  source: BufferSource | string
): Promise<Uint8Array> {
  const bytes =
    typeof source === "string" ? new TextEncoder().encode(source) : source;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
