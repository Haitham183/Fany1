import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRoleCode } from '@prisma/client';

export interface AuthSessionPayload {
  userId: string;
  username: string;
  fullName: string;
  roleCode: UserRoleCode | string;
  schoolId: string | null;
  departmentId: string | null;
  isInternalVerifier: boolean;
  inspectingSchoolId?: string | null; // For Directorate Admin School Inspection Mode
  mustChangePassword?: boolean;
}

const SESSION_COOKIE_NAME = 'egyptian_tech_school_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours working shift

let cachedDevSecret: string | null = null;

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: AUTH_SECRET environment variable is missing in production!');
    }
    if (!cachedDevSecret) {
      cachedDevSecret = `dev_secret_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      console.warn('⚠️ [SECURITY WARNING] AUTH_SECRET is not set in environment. Using ephemeral key.');
    }
    return new TextEncoder().encode(cachedDevSecret);
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates an encrypted/signed session JWT token for HttpOnly cookie storage
 */
export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  const key = getJwtSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

/**
 * Verifies and decodes the session token
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const key = getJwtSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Sets the secure HttpOnly cookie on Next.js responses
 */
export async function setSessionCookie(payload: AuthSessionPayload): Promise<string> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Retrieves the verified session from the incoming request's HttpOnly cookie
 */
export async function getServerSession(): Promise<AuthSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Clears the session HttpOnly cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Non-blocking
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
