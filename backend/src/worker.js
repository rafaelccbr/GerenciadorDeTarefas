import { createAuth, isLocalDevelopment } from './auth.js';

const statuses = new Set(['pendente', 'em_andamento', 'concluido']);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateTask(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Informe uma tarefa em formato JSON.');
  const values = {};
  if (!partial || 'nome' in body) {
    if (typeof body.nome !== 'string' || !body.nome.trim() || body.nome.length > 20000) throw new Error('Informe um título válido, de até 20.000 caracteres.');
    values.nome = body.nome.trim();
  }
  for (const field of ['data_come', 'data_termi']) {
    if (!partial || field in body) {
      if (!validDate(body[field])) throw new Error('Informe datas válidas no formato AAAA-MM-DD.');
      values[field] = body[field];
    }
  }
  if (!partial || 'status' in body) {
    values.status = body.status ?? 'pendente';
    if (!statuses.has(values.status)) throw new Error('Status de tarefa inválido.');
  }
  if (values.data_come && values.data_termi && values.data_termi < values.data_come) throw new Error('O prazo não pode ser anterior ao início.');
  if (!Object.keys(values).length) throw new Error('Nenhum campo de tarefa informado.');
  return values;
}

async function api(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');
  if (path === '/api' && request.method === 'GET') return json({ status: 'ok' });
  if (path === '/api/config' && request.method === 'GET') return json({
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    cadastroEmail: isLocalDevelopment(request, env) || !!(env.BREVO_API_KEY && env.MAIL_FROM),
    recuperacaoEmail: !!(env.BREVO_API_KEY && env.MAIL_FROM),
  });
  if (!env.DB || !env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) return json({ erro: 'Configure o banco D1 e BETTER_AUTH_SECRET antes de usar a API.' }, 503);
  const auth = createAuth(request, env);
  if (path.startsWith('/api/auth/')) {
    if (path === '/api/auth/sign-up/email' && !isLocalDevelopment(request, env) && (!env.BREVO_API_KEY || !env.MAIL_FROM)) return json({ erro: 'O envio de e-mails ainda não foi configurado.' }, 503);
    return auth.handler(request);
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ erro: 'Sua sessão expirou. Entre novamente.' }, 401);
  const userId = session.user.id;
  if (!session.user.emailVerified && !isLocalDevelopment(request, env)) return json({ erro: 'Confirme seu e-mail para acessar suas tarefas.' }, 403);
  if (path === '/api/conta/seguranca' && request.method === 'GET') {
    const credential = await env.DB.prepare("SELECT id FROM account WHERE userId = ? AND providerId = 'credential' AND password IS NOT NULL").bind(userId).first();
    return json({ senhaConfigurada: !!credential, emailAlteravel: !!(env.BREVO_API_KEY && env.MAIL_FROM) });
  }
  if (path === '/api/conta/senha' && request.method === 'POST') {
    const credential = await env.DB.prepare("SELECT id FROM account WHERE userId = ? AND providerId = 'credential' AND password IS NOT NULL").bind(userId).first();
    if (credential) return json({ erro: 'Você já possui uma senha. Informe a senha atual para alterá-la.' }, 409);
    const body = await request.json();
    if (!body || typeof body.senha !== 'string') return json({ erro: 'Informe uma senha válida.' }, 400);
    await auth.api.setPassword({ body: { newPassword: body.senha }, headers: request.headers });
    return json({ mensagem: 'Senha criada. Você pode entrar com Google ou com seu e-mail e senha.' });
  }
  if (path === '/api/tarefas' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, created_at, nome, data_come, data_termi, status, user_id FROM tarefas WHERE user_id = ? ORDER BY created_at DESC, id DESC').bind(userId).all();
    return json(results);
  }
  if (path === '/api/tarefas/importar' && request.method === 'POST') {
    const body = await request.json();
    if (!body || !Array.isArray(body.tarefas) || body.tarefas.length > 500) return json({ erro: 'Importe um backup JSON com até 500 tarefas por vez.' }, 400);
    // Validate the complete batch before writing. Ownership is always the current session.
    const tasks = body.tarefas.map(t => ({
      ...validateTask(t), importKey: `backup:${String(t.user_id || '')}:${String(t.id || '')}`,
      createdAt: t.created_at && !Number.isNaN(Date.parse(t.created_at)) ? new Date(t.created_at).toISOString() : new Date().toISOString(),
    }));
    if (body.tarefas.some(t => !t.id || !t.user_id)) return json({ erro: 'O backup precisa conter os IDs originais das tarefas e do usuário.' }, 400);
    let imported = 0;
    for (let i = 0; i < tasks.length; i += 50) {
      const batch = tasks.slice(i, i + 50).map(t => env.DB.prepare('INSERT INTO tarefas (nome, data_come, data_termi, status, user_id, import_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, import_key) DO NOTHING').bind(t.nome, t.data_come, t.data_termi, t.status, userId, t.importKey, t.createdAt));
      for (const result of await env.DB.batch(batch)) imported += result.meta.changes;
    }
    return json({ mensagem: 'Backup importado.', importadas: imported, ignoradas: tasks.length - imported });
  }
  if (path === '/api/tarefas' && request.method === 'POST') {
    const task = validateTask(await request.json());
    const tarefa = await env.DB.prepare('INSERT INTO tarefas (nome, data_come, data_termi, status, user_id) VALUES (?, ?, ?, ?, ?) RETURNING *').bind(task.nome, task.data_come, task.data_termi, task.status, userId).first();
    return json({ mensagem: 'Tarefa criada.', tarefa }, 201);
  }
  const match = path.match(/^\/api\/tarefas\/(\d+)(\/status)?$/);
  if (match) {
    const id = Number(match[1]);
    const original = await env.DB.prepare('SELECT * FROM tarefas WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!original) return json({ erro: 'Tarefa não encontrada.' }, 404);
    if (!match[2] && request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM tarefas WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return json({ mensagem: 'Tarefa excluída.' });
    }
    if ((!match[2] && request.method === 'PUT') || (match[2] && request.method === 'PATCH')) {
      const body = await request.json();
      const update = match[2] ? { status: body.status } : body;
      if (match[2] && !statuses.has(body.status)) return json({ erro: 'Status de tarefa inválido.' }, 400);
      const task = validateTask({ ...original, ...validateTask(update, true) });
      const tarefa = await env.DB.prepare('UPDATE tarefas SET nome = ?, data_come = ?, data_termi = ?, status = ? WHERE id = ? AND user_id = ? RETURNING *').bind(task.nome, task.data_come, task.data_termi, task.status, id, userId).first();
      return json({ mensagem: 'Tarefa atualizada.', tarefa });
    }
  }
  return json({ erro: 'Rota não encontrada.' }, 404);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path !== '/api' && !path.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const allowed = [env.APP_URL || new URL(request.url).origin];
        if (isLocalDevelopment(request, env)) allowed.push('http://localhost:8787', 'http://127.0.0.1:8787', 'http://localhost:5173', 'http://127.0.0.1:5173');
        const origin = request.headers.get('origin');
        if ((origin && !allowed.includes(origin)) || !request.headers.get('content-type')?.includes('application/json')) return json({ erro: 'Origem ou formato de requisição inválido.' }, 403);
      }
      const contentLength = Number(request.headers.get('content-length') || 0);
      if (contentLength > 2_000_000) return json({ erro: 'O arquivo excede o limite de 2 MB.' }, 413);
      return await api(request, env);
    } catch (error) {
      if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500) return json({ erro: error.body?.message || 'Não foi possível validar a operação. Entre novamente e tente outra vez.' }, error.statusCode);
      if (error instanceof SyntaxError || error.message?.startsWith('Informe ') || error.message?.startsWith('O prazo') || error.message?.startsWith('Status ') || error.message?.startsWith('Nenhum ')) return json({ erro: error.message }, 400);
      console.error('Falha na API:', error.message);
      return json({ erro: 'Não foi possível concluir a operação. Tente novamente.' }, 500);
    }
  },
};
