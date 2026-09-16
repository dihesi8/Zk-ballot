// pkgs/shared/src/utils.ts

/**
 * Generates a buffer of cryptographically secure random bytes.
 * Used to generate a fresh secret key for a new admin/voter identity.
 */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};
