// A API e os assets compartilham a origem em produção. Vite encaminha /api localmente.
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const usuarioLocal = (user) => ({ id: user.id, nome: user.name, email: user.email });

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith('/auth/')) window.dispatchEvent(new Event('sessao-expirada'));
    const error = new Error(data.detalhes || data.erro || data.message || 'Não foi possível concluir a operação.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function acordarServidorApi() {
  // Workers não precisa do ping de cold start que era usado com o Render.
}
export async function sessaoAtualApi() {
  const session = await request('/auth/get-session');
  return session?.user ? usuarioLocal(session.user) : null;
}
export const configuracaoLoginApi = () => request('/config');
export const segurancaContaApi = () => request('/conta/seguranca');
export const configurarSenhaApi = senha => request('/conta/senha', { method: 'POST', body: JSON.stringify({ senha }) });
export async function loginGoogleApi() {
  const data = await request('/auth/sign-in/social', { method: 'POST', body: JSON.stringify({ provider: 'google', callbackURL: window.location.origin, errorCallbackURL: window.location.origin }) });
  if (!data.url || new URL(data.url).origin !== 'https://accounts.google.com') throw new Error('Não foi possível iniciar o acesso com Google.');
  window.location.assign(data.url);
}
export async function loginApi(email, senha) {
  const data = await request('/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email, password: senha }) });
  return { token: 'cookie', usuario: usuarioLocal(data.user) };
}
export async function cadastroApi(nome, email, senha) {
  return request('/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ name: nome, email, password: senha, callbackURL: window.location.origin }) });
}
export async function recuperarSenhaApi(email) {
  return request('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email, redirectTo: window.location.origin }) });
}
export async function redefinirSenhaApi(token, senha) {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword: senha }) });
}
export async function atualizarPerfilApi({ nome, email, senha, senhaAtual }) {
  if (senha) {
    await request('/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword: senha, currentPassword: senhaAtual, revokeOtherSessions: true }) });
    return { mensagem: 'Senha atualizada.' };
  }
  if (nome) await request('/auth/update-user', { method: 'POST', body: JSON.stringify({ name: nome }) });
  if (email) await request('/auth/change-email', { method: 'POST', body: JSON.stringify({ newEmail: email, callbackURL: window.location.origin }) });
  const usuario = await sessaoAtualApi();
  return { mensagem: email ? 'Nome salvo. Confirme a alteração de e-mail na mensagem enviada ao novo endereço.' : 'Perfil atualizado.', usuario };
}
export async function excluirContaApi(senha) {
  return request('/auth/delete-user', { method: 'POST', body: JSON.stringify(senha ? { password: senha } : {}) });
}
export async function logoutApi() {
  return request('/auth/sign-out', { method: 'POST', body: '{}' });
}
export const listarTarefasApi = () => request('/tarefas');
export const criarTarefaApi = tarefa => request('/tarefas', { method: 'POST', body: JSON.stringify(tarefa) });
export const atualizarTarefaApi = (id, dados) => request(`/tarefas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const atualizarStatusApi = (id, status) => request(`/tarefas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const excluirTarefaApi = id => request(`/tarefas/${id}`, { method: 'DELETE' });
export const importarTarefasApi = tarefas => request('/tarefas/importar', { method: 'POST', body: JSON.stringify({ tarefas }) });

// Só há um cache do perfil. A credencial fica no cookie HttpOnly do Better Auth.
export function salvarSessao(token, usuario) {
  localStorage.removeItem('token');
  if (token === 'cookie') localStorage.setItem('usuario', JSON.stringify(usuario));
}
export function obterSessao() {
  try {
    if (localStorage.getItem('token')) { limparSessao(); return { token: null, usuario: null }; }
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    return { token: usuario ? 'cookie' : null, usuario };
  } catch { limparSessao(); return { token: null, usuario: null }; }
}
export function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}
