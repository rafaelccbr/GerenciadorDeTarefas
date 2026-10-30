import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTask } from '../worker.js';

const task = { nome: 'Estudar limites', data_come: '2026-10-29', data_termi: '2026-10-30', status: 'pendente' };
test('valida datas reais, inclusive meses e anos bissextos', () => {
  assert.throws(() => validateTask({ ...task, data_come: '2026-02-30' }));
  assert.throws(() => validateTask({ ...task, data_come: '2026-13-01' }));
  assert.doesNotThrow(() => validateTask({ ...task, data_come: '2024-02-29' }));
});
test('recusa status desconhecido, título vazio e prazo anterior ao início', () => {
  assert.throws(() => validateTask(null));
  assert.throws(() => validateTask([]));
  assert.throws(() => validateTask({ ...task, status: 'outro' }));
  assert.throws(() => validateTask({ ...task, nome: '   ' }));
  assert.throws(() => validateTask({ ...task, data_termi: '2026-01-01' }));
});
test('aceita atualização parcial sem permitir alterar proprietário ou identificador', () => {
  assert.deepEqual(validateTask({ status: 'concluido', user_id: 'outro', id: 99 }, true), { status: 'concluido' });
  assert.throws(() => validateTask({ user_id: 'outro' }, true));
});

test('integração: sessões, isolamento entre contas e importação sem duplicação', { skip: !process.env.TEST_BASE_URL }, async () => {
  const base = process.env.TEST_BASE_URL;
  assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/); // Never create test accounts in production.
  const password = 'TesteSeguro!934';
  const cookies = ['', ''];
  const call = async (owner, path, method = 'GET', body) => {
    const res = await fetch(base + '/api' + path, {
      method, headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookies[owner] },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const setCookies = res.headers.getSetCookie();
    if (setCookies.length) cookies[owner] = setCookies.map(c => c.split(';')[0]).join('; ');
    return { status: res.status, body: await res.json() };
  };
  for (let i = 0; i < 2; i++) {
    const email = `qa-${Date.now()}-${i}@example.test`;
    const signup = await call(i, '/auth/sign-up/email', 'POST', { name: 'Conta de teste', email, password });
    assert.equal(signup.status, 200, JSON.stringify(signup.body));
    const login = await call(i, '/auth/sign-in/email', 'POST', { email, password });
    assert.equal(login.status, 200, JSON.stringify(login.body));
    assert.ok(cookies[i].includes('session_token'));
  }
  try {
    const create = await call(0, '/tarefas', 'POST', task);
    assert.equal(create.status, 201);
    const id = create.body.tarefa.id;
    assert.deepEqual((await call(1, '/tarefas')).body, []);
    assert.equal((await call(1, `/tarefas/${id}`, 'PUT', { nome: 'Tentativa' })).status, 404);
    assert.equal((await call(1, `/tarefas/${id}`, 'DELETE')).status, 404);
    assert.equal((await call(0, `/tarefas/${id}/status`, 'PATCH', { status: 'concluido' })).body.tarefa.status, 'concluido');
    assert.equal((await call(0, '/tarefas', 'POST', { ...task, user_id: 'fraude' })).body.tarefa.user_id, create.body.tarefa.user_id);
    const backup = { tarefas: [{ ...task, id: 47, user_id: 'original-supabase', nome: 'Preservar #Faculdade [notas]' }] };
    assert.equal((await call(0, '/tarefas/importar', 'POST', backup)).body.importadas, 1);
    assert.equal((await call(0, '/tarefas/importar', 'POST', backup)).body.importadas, 0);
    const invalid = await call(0, '/tarefas/importar', 'POST', { tarefas: [backup.tarefas[0], { ...task, nome: '', id: 48, user_id: 'original' }] });
    assert.equal(invalid.status, 400);
    assert.equal((await call(0, '/tarefas')).body.length, 3);
    assert.equal((await call(0, `/tarefas/${id}/status`, 'PATCH', {})).status, 400);
  } finally {
    for (let i = 0; i < 2; i++) {
      const deleted = await call(i, '/auth/delete-user', 'POST', { password });
      assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
      assert.equal((await call(i, '/tarefas')).status, 401);
    }
  }
});
