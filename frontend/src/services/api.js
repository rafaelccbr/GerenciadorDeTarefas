/**
 * ============================================================================
 * SERVIÇO DE COMUNICAÇÃO COM A API (HTTP CLIENT)
 * ============================================================================
 * Este arquivo centraliza todas as requisições HTTP feitas pelo Frontend React
 * para o Backend Fastify rodando em http://localhost:3000.
 * 
 * Ele cuida automaticamente de:
 * 1. Definir o cabeçalho 'Content-Type: application/json'.
 * 2. Injetar o Token JWT salvo no localStorage no cabeçalho 'Authorization: Bearer <token>'.
 * 3. Tratar erros de resposta e expor mensagens amigáveis para a interface.
 */

// Detecta dinamicamente o IP ou domínio de onde a aplicação foi aberta,
// permitindo que outros computadores na mesma rede acessem a API sem erros.
const API_URL = import.meta.env.VITE_API_URL || (
    typeof window !== 'undefined'
        ? `http://${window.location.hostname}:3000`
        : 'http://localhost:3000'
);

/**
 * Função utilitária genérica para disparo de requisições fetch.
 * 
 * @param {string} endpoint - Caminho da rota (ex: '/auth/login' ou '/tarefas')
 * @param {object} options - Opções do fetch (method, body, headers)
 * @returns {Promise<any>} - Resposta em formato JSON
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    // Cabeçalhos padrões para requisições JSON
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Se o usuário já estiver logado, injetamos o token no header Authorization
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    // Se a resposta não for bem-sucedida (status fora da faixa 200-299)
    if (!response.ok) {
        const mensagemErro = data.detalhes || data.erro || data.mensagem || data.message || 'Erro inesperado na requisição';
        const erro = new Error(mensagemErro);
        erro.status = response.status;
        erro.detalhes = data;
        throw erro;
    }

    return data;
}

// ============================================================================
// SERVIÇOS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Realiza o login com email e senha.
 * Retorna o token JWT e os dados do usuário.
 */
export async function loginApi(email, senha) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
    });
}

/**
 * Realiza o cadastro de um novo usuário.
 * Retorna mensagem de sucesso e dados do usuário cadastrado.
 */
export async function cadastroApi(nome, email, senha) {
    return request('/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha })
    });
}

/**
 * Solicita envio de email para recuperação de senha (Esqueceu a senha).
 * @param {string} email
 */
export async function recuperarSenhaApi(email) {
    return request('/auth/recuperar-senha', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

/**
 * Atualiza os dados de cadastro do usuário logado (nome, email e/ou senha).
 * @param {object} dados - { nome, email, senha }
 */
export async function atualizarPerfilApi(dados) {
    return request('/auth/perfil', {
        method: 'PUT',
        body: JSON.stringify(dados)
    });
}

/**
 * Exclui permanentemente a conta do usuário logado e todas as suas tarefas.
 */
export async function excluirContaApi() {
    return request('/auth/conta', {
        method: 'DELETE'
    });
}

// ============================================================================
// SERVIÇOS DO CRUD DE TAREFAS
// ============================================================================

/**
 * Lista todas as tarefas do usuário autenticado.
 */
export async function listarTarefasApi() {
    return request('/tarefas', {
        method: 'GET'
    });
}

/**
 * Cria uma nova tarefa.
 * @param {object} tarefa - { nome, data_come, data_termi, status }
 */
export async function criarTarefaApi(tarefa) {
    return request('/tarefas', {
        method: 'POST',
        body: JSON.stringify(tarefa)
    });
}

/**
 * Atualiza todos os campos de uma tarefa existente.
 * @param {number|string} id - ID da tarefa
 * @param {object} dados - { nome, data_come, data_termi, status }
 */
export async function atualizarTarefaApi(id, dados) {
    return request(`/tarefas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    });
}

/**
 * Atualiza rapidamente apenas o status da tarefa ('pendente' | 'em_andamento' | 'concluido').
 * @param {number|string} id - ID da tarefa
 * @param {string} status - Novo status
 */
export async function atualizarStatusApi(id, status) {
    return request(`/tarefas/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
}

/**
 * Exclui uma tarefa pelo seu ID.
 * @param {number|string} id - ID da tarefa
 */
export async function excluirTarefaApi(id) {
    return request(`/tarefas/${id}`, {
        method: 'DELETE'
    });
}

// ============================================================================
// GERENCIAMENTO DA SESSÃO LOCAL (localStorage)
// ============================================================================

/**
 * Salva o token JWT e os dados do usuário na memória do navegador.
 */
export function salvarSessao(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

/**
 * Recupera o token e os dados do usuário da memória do navegador.
 */
export function obterSessao() {
    const token = localStorage.getItem('token');
    const usuarioString = localStorage.getItem('usuario');
    const usuario = usuarioString ? JSON.parse(usuarioString) : null;
    return { token, usuario };
}

/**
 * Limpa a sessão ao deslogar.
 */
export function limparSessao() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
}

