import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * ============================================================================
 * CLIENTE GERAL DO SUPABASE (ANON CLIENT)
 * ============================================================================
 * Este cliente utiliza a SUPABASE_URL e a SUPABASE_ANON_KEY carregadas do .env.
 * 
 * Uso principal:
 * 1. Operações públicas que não necessitam de contexto de usuário autenticado
 *    (como criar conta `signUp` ou realizar login `signInWithPassword`).
 * 2. Operações de infraestrutura da autenticação.
 * 
 * NOTA: Para operações em tabelas protegidas por RLS (Row Level Security),
 * utilizamos um cliente com o token do usuário injetado (veja o middleware `autenticar.js`).
 */
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * ============================================================================
 * CLIENTE ADMINISTRATIVO DO SUPABASE (SERVICE ROLE)
 * ============================================================================
 * Utilizado exclusivamente em operações administrativas de backend que exigem
 * privilégios de superusuário (como excluir permanentemente contas no auth.users).
 * NUNCA deve ser exposto ao frontend!
 */
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

