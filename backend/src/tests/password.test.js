import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('conta autenticada sem senha pode criar uma credencial própria', { skip: !process.env.TEST_BASE_URL }, async () => {
  const origin = process.env.TEST_BASE_URL;
  assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
  const password = 'SenhaPropria!934';
  let cookie = '';
  const call = async (path, body) => {
    const response = await fetch(origin + '/api' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) cookie = cookies.map(value => value.split(';')[0]).join('; ');
    return { status: response.status, data: await response.json() };
  };
  const email = `sem-senha-${Date.now()}@example.test`;
  assert.equal((await call('/auth/sign-up/email', { name: 'Conta temporária sem senha', email, password })).status, 200);
  const login = await call('/auth/sign-in/email', { email, password });
  assert.equal(login.status, 200);
  const id = login.data.user.id;
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  try {
    // Uma conta sem credencial simula o estado após o acesso social.
    // Este teste não simula nem certifica uma troca de tokens com o Google.
    execFileSync(process.execPath, [
      root + 'backend/node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'organizador-tarefas', '--local',
      '--command', `DELETE FROM account WHERE userId = '${id}' AND providerId = 'credential'`,
    ], { cwd: root, env: { ...process.env, WRANGLER_LOG_PATH: root + '/.wrangler/logs' }, stdio: 'pipe' });
    assert.equal((await call('/conta/seguranca')).data.senhaConfigurada, false);
    const created = await call('/conta/senha', { senha: password });
    assert.equal(created.status, 200, JSON.stringify(created.data));
    assert.equal((await call('/conta/seguranca')).data.senhaConfigurada, true);
    assert.equal((await call('/conta/senha', { senha: 'OutraSenha!234' })).status, 409);
    await call('/auth/sign-out', {});
    cookie = '';
    assert.equal((await call('/auth/sign-in/email', { email, password })).status, 200);
  } finally {
    assert.equal((await call('/auth/delete-user', { password })).status, 200);
  }
});
