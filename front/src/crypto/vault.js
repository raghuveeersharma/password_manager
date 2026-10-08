// Client-side key derivation and encryption (Web Crypto). The master password
// and the encryption key never leave the browser; the server only ever sees
// the derived auth key and AES-GCM ciphertext.
//
//   master password --PBKDF2-SHA256(salt, iterations)--> master key
//   master key --HKDF("passop-auth-v1")--> auth key  (sent to the server)
//   master key --HKDF("passop-enc-v1")---> AES-256-GCM key (memory only)

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const KDF_PARAMS = { algorithm: "pbkdf2-sha256", iterations: 600000 };

export const toBase64 = (bytes) => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

export const fromBase64 = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const generateSalt = () =>
  toBase64(crypto.getRandomValues(new Uint8Array(16)));

const hkdfParams = (info) => ({
  name: "HKDF",
  hash: "SHA-256",
  salt: new Uint8Array(),
  info: encoder.encode(info),
});

// Returns { authKey: base64 string, encKey: non-extractable CryptoKey }.
export async function deriveKeys(masterPassword, salt, params) {
  if (params.algorithm !== KDF_PARAMS.algorithm) {
    throw new Error("Unsupported key derivation algorithm");
  }
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const masterBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      // The salt is treated as an opaque string, so a malformed (or fake) salt can't throw.
      salt: encoder.encode(salt),
      iterations: params.iterations,
    },
    passwordKey,
    256
  );
  const hkdfKey = await crypto.subtle.importKey("raw", masterBits, "HKDF", false, [
    "deriveBits",
    "deriveKey",
  ]);
  const authBits = await crypto.subtle.deriveBits(
    hkdfParams("passop-auth-v1"),
    hkdfKey,
    256
  );
  const encKey = await crypto.subtle.deriveKey(
    hkdfParams("passop-enc-v1"),
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return { authKey: toBase64(new Uint8Array(authBits)), encKey };
}

// A fresh random 12-byte IV is generated for every encryption.
export async function encrypt(encKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encKey,
    encoder.encode(plaintext)
  );
  return {
    password_ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
  };
}

// Throws if the key is wrong or the data was tampered with (GCM auth failure).
export async function decrypt(encKey, ciphertext, iv) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    encKey,
    fromBase64(ciphertext)
  );
  return decoder.decode(plain);
}
