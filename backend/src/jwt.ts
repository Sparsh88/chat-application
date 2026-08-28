import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'letsconnect_lifetime_jwt_secret_2026_key';
// Default to 10 years (3650 days: 10 * 365 * 24 * 60 * 60 seconds)
const LIFETIME_EXPIRY_SECONDS = 10 * 365 * 24 * 60 * 60;

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generates a standard HS256 JWT Token with a 10-year (3,650 days) lifetime expiration.
 * Ensures sessions stay permanently active across college years, placement drives, and recruiter demos.
 */
export function generateLifetimeToken(payload: { id: string; email: string; name: string; role: string }): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    iat: nowInSeconds,
    exp: nowInSeconds + LIFETIME_EXPIRY_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * Verifies standard HS256 JWT Token
 */
export function verifyLifetimeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowInSeconds) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
