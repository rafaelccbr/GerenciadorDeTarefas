import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { autenticar } from '../middlewares/autenticar.js';

/**
 * ============================================================================
 * ROTAS DE AUTENTICAÇÃO (Fastify Plugin)
 * ============================================================================
 * No Fastify, rotas agrupadas são organizadas como funções assíncronas que
 * recebem a instância do `fastify`. Registrado no server.js com prefixo `/auth`.
 */
export async function authRoutes(fastify) {

    /**
     * POST /auth/cadastro
     * ------------------------------------------------------------------------
     * Objetivo: Registrar um novo usuário no Supabase Auth.
     * 
     * Corpo da requisição (request.body):
     * - nome: string (salvo nos metadados do usuário)
     * - email: string
     * - senha: string (mínimo 6 caracteres pelo padrão do Supabase)
     * 
     * Retornos HTTP:
     * - 201 Created: Usuário criado com sucesso
     * - 400 Bad Request: Dados obrigatórios ausentes ou senha fraca
     * - 409 Conflict: E-mail já cadastrado anteriormente
     */
    fastify.post('/cadastro', async (request, reply) => {
        const { nome, email, senha } = request.body || {};

        // Validação básica de entrada de dados
        if (!nome || !email || !senha) {
            return reply.code(400).send({ 
                erro: 'Campos obrigatórios ausentes',
                detalhes: 'Por favor, informe nome, email e senha.' 
            });
        }

        // Chama a API do Supabase para criar o usuário
        const { data, error } = await supabase.auth.signUp({
            email,
            password: senha,
            options: { 
                data: { nome } // Salva o nome em raw_user_meta_data
            }
        });

        // Caso o Supabase retorne erro (ex: formato de e-mail inválido ou senha fraca)
        if (error) {
            return reply.code(400).send({ erro: error.message });
        }

        // No Supabase, quando um e-mail já existe e a confirmação está ativa,
        // o Supabase retorna um usuário com lista de identities vazia para não expor dados
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            return reply.code(409).send({ erro: 'E-mail já cadastrado' });
        }

        // 201 Created indica que o recurso (usuário) foi criado com sucesso no banco
        return reply.code(201).send({
            mensagem: 'Cadastro realizado com sucesso! Verifique seu email se a confirmação estiver ativada.',
            usuario: {
                id: data.user.id,
                nome: data.user.user_metadata?.nome,
                email: data.user.email
            }
        });
    });

    /**
     * POST /auth/login
     * ------------------------------------------------------------------------
     * Objetivo: Autenticar um usuário existente com email e senha.
     * 
     * Corpo da requisição (request.body):
     * - email: string
     * - senha: string
     * 
     * Retornos HTTP:
     * - 200 OK: Credenciais válidas, retorna o token JWT e dados do usuário
     * - 400 Bad Request: Dados incompletos
     * - 401 Unauthorized: Credenciais inválidas (email/senha incorretos)
     */
    fastify.post('/login', async (request, reply) => {
        const { email, senha } = request.body || {};

        if (!email || !senha) {
            return reply.code(400).send({ 
                erro: 'Campos obrigatórios ausentes',
                detalhes: 'Informe email e senha para entrar.' 
            });
        }

        // Tenta autenticar no Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        });

        // Se der erro (ex: credenciais incorretas), retorna 401 Unauthorized
        if (error) {
            return reply.code(401).send({ erro: error.message });
        }

        // 200 OK (default do Fastify)
        // O `access_token` é o JWT que o frontend deve salvar (ex: localStorage)
        // e enviar nas requisições seguintes no header "Authorization: Bearer <token>"
        return reply.send({
            mensagem: 'Login realizado com sucesso',
            token: data.session.access_token,
            usuario: {
                id: data.user.id,
                nome: data.user.user_metadata?.nome,
                email: data.user.email
            }
        });
    });

    /**
     * POST /auth/recuperar-senha
     * ------------------------------------------------------------------------
     * Objetivo: Solicitar redefinição de senha por e-mail no Supabase Auth.
     * 
     * Corpo da requisição (request.body):
     * - email: string
     * 
     * Retornos HTTP:
     * - 200 OK: E-mail de recuperação enviado (ou disparado pelo Supabase)
     * - 400 Bad Request: E-mail não informado ou inválido
     */
    fastify.post('/recuperar-senha', async (request, reply) => {
        const { email } = request.body || {};

        if (!email) {
            return reply.code(400).send({
                erro: 'E-mail obrigatório',
                detalhes: 'Por favor, informe o e-mail cadastrado para recuperar a senha.'
            });
        }

        // Dispara o e-mail oficial do Supabase contendo o link de redefinição de senha
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return reply.code(400).send({
                erro: 'Falha ao solicitar recuperação de senha',
                detalhes: error.message
            });
        }

        return reply.send({
            mensagem: 'Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas!'
        });
    });

    /**
     * PUT /auth/perfil
     * ------------------------------------------------------------------------
     * Objetivo: Atualizar dados cadastrais do próprio usuário logado (nome, e-mail e/ou senha).
     * Rota protegida: Exige Bearer Token JWT via middleware `autenticar`.
     * 
     * Corpo da requisição (request.body):
     * - nome?: string (opcional)
     * - email?: string (opcional)
     * - senha?: string (opcional, mínimo 6 caracteres)
     * 
     * Retornos HTTP:
     * - 200 OK: Dados cadastrais atualizados com sucesso
     * - 400 Bad Request: Nenhum dado informado ou validação falhou
     * - 401/403: Usuário não autenticado
     */
    fastify.put('/perfil', { preHandler: [autenticar] }, async (request, reply) => {
        const { nome, email, senha } = request.body || {};

        // Validação: Ao menos um campo deve ser fornecido para atualização
        if (!nome && !email && !senha) {
            return reply.code(400).send({
                erro: 'Nenhum dado informado',
                detalhes: 'Informe pelo menos um campo para atualizar: nome, email ou senha.'
            });
        }

        if (senha && senha.length < 6) {
            return reply.code(400).send({
                erro: 'Senha fraca',
                detalhes: 'A nova senha deve possuir no mínimo 6 caracteres.'
            });
        }

        // Se tivermos a chave administrativa (SUPABASE_SERVICE_ROLE_KEY), atualizamos via admin
        // Isso garante consistência direta sem depender de contexto de sessão volátil no backend
        let updatedUser = null;

        if (supabaseAdmin) {
            const adminUpdates = {};
            if (nome) adminUpdates.user_metadata = { nome };
            if (email) adminUpdates.email = email;
            if (senha) adminUpdates.password = senha;

            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                request.userId,
                adminUpdates
            );

            if (error) {
                return reply.code(400).send({
                    erro: 'Erro ao atualizar dados do usuário',
                    detalhes: error.message
                });
            }
            updatedUser = data.user;
        } else {
            // Fallback caso a chave administrativa não esteja configurada
            const userUpdates = {};
            if (nome) userUpdates.data = { nome };
            if (email) userUpdates.email = email;
            if (senha) userUpdates.password = senha;

            const { data, error } = await request.supabaseUser.auth.updateUser(userUpdates);

            if (error) {
                return reply.code(400).send({
                    erro: 'Erro ao atualizar dados do usuário',
                    detalhes: error.message
                });
            }
            updatedUser = data.user;
        }

        return reply.send({
            mensagem: 'Dados do perfil atualizados com sucesso!',
            usuario: {
                id: updatedUser.id,
                nome: updatedUser.user_metadata?.nome || nome,
                email: updatedUser.email || email
            }
        });
    });

    /**
     * DELETE /auth/conta
     * ------------------------------------------------------------------------
     * Objetivo: Excluir permanentemente a conta do usuário logado e todos os seus dados.
     * Rota protegida: Exige Bearer Token JWT via middleware `autenticar`.
     * 
     * Fluxo de execução:
     * 1. Remove todas as tarefas vinculadas a `request.userId` na tabela `tarefas`.
     * 2. Remove o registro do usuário na tabela `auth.users` do Supabase via `supabaseAdmin`.
     * 
     * Retornos HTTP:
     * - 200 OK: Conta excluída com sucesso
     * - 500 Internal Server Error: Falha ao remover dados no banco ou no Supabase Auth
     */
    fastify.delete('/conta', { preHandler: [autenticar] }, async (request, reply) => {
        // 1. Deleta todas as tarefas do usuário na tabela do PostgreSQL
        const { error: tarefasError } = await request.supabaseUser
            .from('tarefas')
            .delete()
            .eq('user_id', request.userId);

        if (tarefasError) {
            return reply.code(500).send({
                erro: 'Falha ao remover as tarefas do usuário',
                detalhes: tarefasError.message
            });
        }

        // 2. Deleta o usuário do serviço de autenticação do Supabase (auth.users)
        if (supabaseAdmin) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(request.userId);

            if (authError) {
                return reply.code(500).send({
                    erro: 'Falha ao excluir a conta no Supabase Auth',
                    detalhes: authError.message
                });
            }
        } else {
            return reply.send({
                mensagem: 'Tarefas removidas com sucesso, porém a chave administrativa não estava configurada para apagar auth.users.'
            });
        }

        return reply.send({
            mensagem: 'Conta e todas as tarefas associadas foram excluídas com sucesso permanentemente!'
        });
    });
}
