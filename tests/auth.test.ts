import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { generateKeyPair, SignJWT, exportJWK } from 'jose';
import { authenticate } from '../server/auth';

const env = { ACCESS_TEAM_DOMAIN: 'https://fphi.cloudflareaccess.com', ACCESS_AUD: 'e22e46957017da28ea77fb8f6f70af8665e36d1340841c9ce925103e36c4b46c' } as Env;
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
  keys = await generateKeyPair('RS256');
  const key = { ...await exportJWK(keys.publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ keys: [key] })));
});
afterAll(() => vi.unstubAllGlobals());

async function token(audience = env.ACCESS_AUD, expires = '2h', issuer = env.ACCESS_TEAM_DOMAIN) {
  return new SignJWT({ email: 'test@example.com' }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expires).sign(keys.privateKey);
}
const request = (jwt?: string) => new Request('https://cabinpi-react.pages.dev/api/photos', {
  headers: { 'cf-access-authenticated-user-email': 'forged@example.com', ...(jwt ? { 'cf-access-jwt-assertion': jwt } : {}) },
});

describe('Access verification', () => {
  it('rejects forged identity headers on the default Pages hostname', async () => {
    await expect(authenticate(request(), env)).rejects.toMatchObject({ status: 401 });
  });
  it('verifies signed user identities', async () => {
    expect(await authenticate(request(await token()), env)).toMatchObject({ email: 'test@example.com' });
  });
  it('rejects an incorrect audience, expiry, issuer or signature', async () => {
    await expect(authenticate(request(await token('wrong' as typeof env.ACCESS_AUD)), env)).rejects.toMatchObject({ status: 401 });
    await expect(authenticate(request(await token(env.ACCESS_AUD, '-1h')), env)).rejects.toMatchObject({ status: 401 });
    await expect(authenticate(request(await token(env.ACCESS_AUD, '1h', 'https://wrong.example' as typeof env.ACCESS_TEAM_DOMAIN)), env)).rejects.toMatchObject({ status: 401 });
    const valid = await token();
    const [header, payload, signature] = valid.split('.');
    const tampered = `${header}.${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
    await expect(authenticate(request(tampered), env)).rejects.toMatchObject({ status: 401 });
  });
  it('rejects service tokens because the API is user-facing and read-only', async () => {
    const jwt = await new SignJWT({ common_name: 'sensor-device' }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).setIssuedAt().setExpirationTime('1h').sign(keys.privateKey);
    await expect(authenticate(request(jwt), env)).rejects.toMatchObject({ status: 401 });
  });
  it('requires an expiry even on a correctly signed token', async () => {
    const jwt = await new SignJWT({ email: 'test@example.com' }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).sign(keys.privateKey);
    await expect(authenticate(request(jwt), env)).rejects.toMatchObject({ status: 401 });
  });
});
