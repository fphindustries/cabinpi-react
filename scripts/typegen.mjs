import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
// Local legacy .env credentials must not affect the versioned deployment types.
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'types'], {
  stdio: 'inherit', env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
});
if (result.status === 0) {
  const file = 'worker-configuration.d.ts';
  writeFileSync(file, readFileSync(file, 'utf8').replace(/[\t ]+$/gm, ''));
}
process.exit(result.status ?? 1);
