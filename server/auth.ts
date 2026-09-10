import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { HttpError } from './http';

export interface RequestData extends Record<string, unknown> {
  identity?: JWTPayload;
}

// Cache public verification keys only, never request or user data.
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function authenticate(request: Request, env: Env): Promise<JWTPayload | undefined> {
  const hostname = new URL(request.url).hostname;
  // Local emulation uses local D1/R2 storage and has no Access proxy.
  if (['localhost', '127.0.0.1', '[::1]'].includes(hostname)) return undefined;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new HttpError(503, 'Authentication is not configured');
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new HttpError(401, 'Sign in through Cloudflare Access');
  let keys = keySets.get(env.ACCESS_TEAM_DOMAIN);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`));
    keySets.set(env.ACCESS_TEAM_DOMAIN, keys);
  }
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp'],
    });
    if (typeof payload.email !== 'string' || !payload.email) {
      throw new HttpError(401, 'Your Access user identity is unavailable. Sign in again.');
    }
    return payload;
  } catch {
    throw new HttpError(401, 'Your session is invalid or expired. Sign in again.');
  }
}
