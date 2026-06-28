// AES-256-GCM Encryption for chat messages
// Messages are encrypted client-side before storage in Supabase.
// Key is derived from both participants' Clerk IDs via PBKDF2.

const SALT = 'vichaar-setu-chat-v1'; // Application-level salt
const ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Derive a deterministic AES-256 key from two Clerk user IDs.
 * IDs are sorted so the same key is produced regardless of who initiates.
 */
export async function deriveKey(clerkIdA: string, clerkIdB: string): Promise<CryptoKey> {
  const sortedIds = [clerkIdA, clerkIdB].sort().join(':');
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sortedIds),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext message using AES-256-GCM.
 * Returns a string in format: base64(iv):base64(ciphertext)
 */
export async function encryptMessage(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  const ivBase64 = arrayBufferToBase64(iv);
  const ctBase64 = arrayBufferToBase64(new Uint8Array(ciphertext));

  return `${ivBase64}:${ctBase64}`;
}

/**
 * Decrypt an encrypted message string (format: base64(iv):base64(ciphertext)).
 * Returns the original plaintext.
 */
export async function decryptMessage(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const [ivBase64, ctBase64] = encryptedData.split(':');
    if (!ivBase64 || !ctBase64) {
      // Not encrypted or malformed — return as-is (graceful fallback)
      return encryptedData;
    }

    const iv = base64ToArrayBuffer(ivBase64);
    const ciphertext = base64ToArrayBuffer(ctBase64);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (e) {
    console.warn('Decryption failed, returning raw content:', e);
    // Graceful fallback for unencrypted legacy messages
    return encryptedData;
  }
}

// ========== Base64 Helpers ==========

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
