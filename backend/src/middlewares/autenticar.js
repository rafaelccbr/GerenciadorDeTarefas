import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import 'dotenv/config';

/**
 * ============================================================================
 * MIDDLEWARE DE AUTENTICAÇÃO (preHandler Hook)
 * ============================================================================
 * No Fastify, funções de middleware podem rodar antes dos handlers de rota (preHandler).
 * 
 * Este middleware tem 3 responsabilidades fundamentais:
 * 1. Extrair e validar o Token JWT enviado no cabeçalho `Authorization: Bearer <token>`.
 * 2. Garantir que o usuário existe e que seu e-mail foi verificado no Supabase.
 * 3. Injetar na requisição (`request`):
 *    - `request.userId`: O UUID do usuário logado.
 *    - `request.supabaseUser`: Uma instância do cliente Supabase configurada com o
 *       Bearer token do próprio usuário. Isso faz com que as políticas de RLS
 *       (Row Level Security) do PostgreSQL saibam quem é o usuário (`auth.uid()`).
 */
export async function autenticar(request, reply) {
    // 1. Obtém o cabeçalho Authorization da requisição
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return reply.code(401).send({ 
            erro: 'Acesso não autorizado',
            detalhes: 'Cabeçalho Authorization não informado. Formato esperado: Bearer <seu_token_jwt>' 
        });
    }

    // 2. Remove o prefixo 'Bearer ' para obter apenas a string do token JWT
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // 3. Valida o token contra a API do Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return reply.code(401).send({ 
            erro: 'Token inválido ou expirado',
            detalhes: error?.message || 'Sessão expirada. Faça login novamente.' 
        });
    }

    // 4. Verifica se o e-mail já foi confirmado (requisito de segurança)
    if (!data.user.email_confirmed_at) {
        return reply.code(403).send({ 
            erro: 'E-mail não verificado',
            detalhes: 'Por favor, confirme seu e-mail antes de acessar este recurso, ou desative a confirmação no painel do Supabase.' 
        });
    }

    // 5. Injeta o ID do usuário na requisição para ser usado nas rotas
    request.userId = data.user.id;

    // 6. Cria um client Supabase contextualizado com o token do usuário.
    // Assim, todas as queries feitas através de `request.supabaseUser` respeitam as RLS policies!
    request.supabaseUser = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        }
    );
}
