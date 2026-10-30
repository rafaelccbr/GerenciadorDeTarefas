import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const child = spawn(process.execPath, [join(root, 'backend/node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || join(root, '.wrangler/logs') },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
