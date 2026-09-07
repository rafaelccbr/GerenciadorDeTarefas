import { autenticar } from '../middlewares/autenticar.js';

/**
 * ============================================================================
 * ROTAS DE TAREFAS (CRUD COMPLETO)
 * ============================================================================
 * Este arquivo define todas as rotas do recurso "tarefas".
 * 
 * Estrutura da tabela `tarefas` no Supabase:
 * - id: int8 (chave primária auto-incrementada)
 * - created_at: timestamptz (data/hora de criação automática)
 * - nome: text (título/nome descritivo da tarefa)
 * - data_come: date (data de início da tarefa, ex: '2026-09-07')
 * - data_termi: date (data de término/prazo, ex: '2026-09-15')
 * - status: status_tipo (enum: 'pendente' | 'em_andamento' | 'concluido')
 * - user_id: uuid (chave estrangeira referenciando o usuário autenticado)
 */
export async function tarefasRoutes(fastify) {

    // ========================================================================
    // HOOK DE AUTENTICAÇÃO (preHandler)
    // ========================================================================
    // Ao registrar o hook `preHandler` aqui no escopo deste plugin, TODAS as rotas
    // declaradas neste arquivo exigirão que o usuário envie um Token JWT válido.
    // O middleware `autenticar` injeta automaticamente `request.userId` e `request.supabaseUser`.
    fastify.addHook('preHandler', autenticar);

    // Lista de status permitidos pelo ENUM `status_tipo` do PostgreSQL
    const STATUS_PERMITIDOS = ['pendente', 'em_andamento', 'concluido'];

    /**
     * ------------------------------------------------------------------------
     * 1. LISTAR TAREFAS
     * GET /tarefas
     * ------------------------------------------------------------------------
     * Objetivo: Buscar todas as tarefas cadastradas pelo usuário logado.
     * Retornos HTTP:
     * - 200 OK: Lista de tarefas retornada com sucesso (array, mesmo que vazio).
     * - 500 Internal Server Error: Falha inesperada ao consultar o Supabase.
     */
    fastify.get('/', async (request, reply) => {
        // Usamos `request.supabaseUser` que possui o token do usuário injetado.
        // O Supabase aplica as regras de Row Level Security (RLS) automaticamente.
        const { data: tarefas, error } = await request.supabaseUser
            .from('tarefas')
            .select('*')
            .eq('user_id', request.userId) // Garante explicitamente a filtragem pelo usuário
            .order('created_at', { ascending: false }); // Ordena das mais recentes para as mais antigas

        if (error) {
            return reply.code(500).send({
                erro: 'Erro ao buscar tarefas',
                detalhes: error.message
            });
        }

        return reply.send(tarefas);
    });

    /**
     * ------------------------------------------------------------------------
     * 2. CRIAR UMA NOVA TAREFA
     * POST /tarefas
     * ------------------------------------------------------------------------
     * Objetivo: Cadastrar uma nova tarefa vinculada ao usuário autenticado.
     * 
     * Corpo esperado (request.body):
     * {
     *   "nome": "Estudar Fastify",
     *   "data_come": "2026-09-07",
     *   "data_termi": "2026-09-10",
     *   "status": "pendente" // opcional, default: "pendente"
     * }
     * 
     * Retornos HTTP:
     * - 201 Created: Tarefa inserida com sucesso no banco.
     * - 400 Bad Request: Dados obrigatórios ausentes ou status inválido.
     * - 500 Internal Server Error: Erro de inserção no Supabase.
     */
    fastify.post('/', async (request, reply) => {
        const { nome, data_come, data_termi, status } = request.body || {};

        // Validação dos campos obrigatórios (conforme restrição NOT NULL do banco)
        if (!nome || !data_come || !data_termi) {
            return reply.code(400).send({
                erro: 'Campos obrigatórios ausentes',
                detalhes: 'É obrigatório fornecer: nome, data_come (início) e data_termi (término).'
            });
        }

        // Define status padrão como 'pendente' caso não seja enviado
        const statusFinal = status || 'pendente';

        // Valida se o status enviado pertence aos valores do ENUM
        if (!STATUS_PERMITIDOS.includes(statusFinal)) {
            return reply.code(400).send({
                erro: 'Status inválido',
                detalhes: `O status deve ser um dos seguintes valores: ${STATUS_PERMITIDOS.join(', ')}`
            });
        }

        // Insere a nova tarefa associada ao ID do usuário autenticado
        const { data: novaTarefa, error } = await request.supabaseUser
            .from('tarefas')
            .insert([{
                nome,
                data_come,
                data_termi,
                status: statusFinal,
                user_id: request.userId
            }])
            .select() // O `.select()` faz o Supabase retornar o registro recém-criado (com o id gerado)
            .single(); // Retorna o objeto diretamente em vez de um array

        if (error) {
            return reply.code(500).send({
                erro: 'Erro ao criar tarefa',
                detalhes: error.message
            });
        }

        // 201 Created é a resposta padrão para criação bem-sucedida de novos recursos
        return reply.code(201).send({
            mensagem: 'Tarefa criada com sucesso!',
            tarefa: novaTarefa
        });
    });

    /**
     * ------------------------------------------------------------------------
     * 3. ATUALIZAR TAREFA COMPLETA
     * PUT /tarefas/:id
     * ------------------------------------------------------------------------
     * Objetivo: Atualizar os dados de uma tarefa existente.
     * 
     * Parâmetros de rota (request.params):
     * - id: identificador numérico da tarefa (int8)
     * 
     * Retornos HTTP:
     * - 200 OK: Tarefa atualizada com sucesso.
     * - 400 Bad Request: Status inválido enviado no corpo.
     * - 404 Not Found: Tarefa não encontrada ou não pertence ao usuário logado.
     * - 500 Internal Server Error: Erro de execução no Supabase.
     */
    fastify.put('/:id', async (request, reply) => {
        const { id } = request.params;
        const { nome, data_come, data_termi, status } = request.body || {};

        // Se o status for informado na atualização, valida se é válido
        if (status && !STATUS_PERMITIDOS.includes(status)) {
            return reply.code(400).send({
                erro: 'Status inválido',
                detalhes: `O status deve ser: ${STATUS_PERMITIDOS.join(', ')}`
            });
        }

        // Monta o objeto com os campos que foram enviados
        const dadosAtualizados = {};
        if (nome !== undefined) dadosAtualizados.nome = nome;
        if (data_come !== undefined) dadosAtualizados.data_come = data_come;
        if (data_termi !== undefined) dadosAtualizados.data_termi = data_termi;
        if (status !== undefined) dadosAtualizados.status = status;

        if (Object.keys(dadosAtualizados).length === 0) {
            return reply.code(400).send({
                erro: 'Nenhum dado informado para atualização'
            });
        }

        // Atualiza a tarefa no Supabase garantindo que ela pertence ao usuário (`user_id`)
        const { data: tarefaAtualizada, error } = await request.supabaseUser
            .from('tarefas')
            .update(dadosAtualizados)
            .eq('id', id)
            .eq('user_id', request.userId)
            .select()
            .single();

        if (error) {
            // Código PGRST116 no PostgREST significa que nenhuma linha foi encontrada
            if (error.code === 'PGRST116') {
                return reply.code(404).send({
                    erro: 'Tarefa não encontrada',
                    detalhes: 'A tarefa informada não existe ou você não possui permissão para editá-la.'
                });
            }
            return reply.code(500).send({
                erro: 'Erro ao atualizar tarefa',
                detalhes: error.message
            });
        }

        return reply.send({
            mensagem: 'Tarefa atualizada com sucesso!',
            tarefa: tarefaAtualizada
        });
    });

    /**
     * ------------------------------------------------------------------------
     * 4. ATUALIZAR APENAS O STATUS DA TAREFA
     * PATCH /tarefas/:id/status
     * ------------------------------------------------------------------------
     * Objetivo: Mudar rapidamente o status (ex: de 'pendente' para 'concluido' ou 'em_andamento').
     * O verbo PATCH é semanticamente ideal para atualizações parciais de recursos.
     * 
     * Retornos HTTP:
     * - 200 OK: Status atualizado com sucesso.
     * - 400 Bad Request: Status inválido ou ausente.
     * - 404 Not Found: Tarefa não encontrada.
     */
    fastify.patch('/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body || {};

        if (!status || !STATUS_PERMITIDOS.includes(status)) {
            return reply.code(400).send({
                erro: 'Status inválido ou ausente',
                detalhes: `Informe um status válido: ${STATUS_PERMITIDOS.join(', ')}`
            });
        }

        const { data: tarefaAtualizada, error } = await request.supabaseUser
            .from('tarefas')
            .update({ status })
            .eq('id', id)
            .eq('user_id', request.userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return reply.code(404).send({
                    erro: 'Tarefa não encontrada'
                });
            }
            return reply.code(500).send({
                erro: 'Erro ao atualizar status',
                detalhes: error.message
            });
        }

        return reply.send({
            mensagem: `Status da tarefa alterado para "${status}" com sucesso!`,
            tarefa: tarefaAtualizada
        });
    });

    /**
     * ------------------------------------------------------------------------
     * 5. EXCLUIR TAREFA
     * DELETE /tarefas/:id
     * ------------------------------------------------------------------------
     * Objetivo: Remover permanentemente uma tarefa do banco de dados.
     * 
     * Retornos HTTP:
     * - 200 OK: Tarefa removida com sucesso.
     * - 404 Not Found: Tarefa não encontrada para exclusão.
     * - 500 Internal Server Error: Falha no Supabase.
     */
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;

        const { data, error } = await request.supabaseUser
            .from('tarefas')
            .delete()
            .eq('id', id)
            .eq('user_id', request.userId)
            .select();

        if (error) {
            return reply.code(500).send({
                erro: 'Erro ao excluir tarefa',
                detalhes: error.message
            });
        }

        // Se o array retornado for vazio, nenhuma tarefa correspondia àquele ID e user_id
        if (!data || data.length === 0) {
            return reply.code(404).send({
                erro: 'Tarefa não encontrada',
                detalhes: 'Nenhuma tarefa encontrada com o ID informado para o seu usuário.'
            });
        }

        return reply.send({
            mensagem: 'Tarefa excluída com sucesso!',
            idExcluido: id
        });
    });
}
