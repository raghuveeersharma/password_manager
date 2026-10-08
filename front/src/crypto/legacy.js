// Read-only support for the pre-backend storage format, used only by the
// one-time import. Entries were AES-encrypted (crypto-js) with VITE_SECRET_KEY
// and kept in localStorage. Delete this file once everyone has migrated.
import CryptoJS from "crypto-js";

const secretKey = import.meta.env.VITE_SECRET_KEY;

export const legacyKeyAvailable = Boolean(secretKey);

export function readLegacyItems() {
  try {
    const items = JSON.parse(localStorage.getItem("passwords") || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function decryptLegacy(encrypted) {
  const plain = CryptoJS.AES.decrypt(encrypted, secretKey).toString(
    CryptoJS.enc.Utf8
  );
  if (!plain) throw new Error("Could not decrypt legacy entry");
  return plain;
}

// Keeps only the entries that were not imported; clears everything when none remain.
export function writeLegacyRemainder(remaining) {
  if (remaining.length === 0) {
    localStorage.removeItem("passwords");
    localStorage.removeItem("PassManager");
  } else {
    localStorage.setItem("passwords", JSON.stringify(remaining));
  }
}
