import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id password hashing parameters according to OWASP guidelines:
 * - Type: Argon2id (hybrid robust against side-channel and GPU cracking)
 * - Memory cost: 19456 KiB (19 MiB)
 * - Time cost (iterations): 2
 * - Parallelism: 1
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 3) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 3 أحرف');
  }
  return hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  if (!plainPassword || !passwordHash) return false;
  try {
    return await verify(passwordHash, plainPassword, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
