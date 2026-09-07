import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { tarefasRoutes } from './routes/tarefas.js';

/**
 * ============================================================================
 * SERVIDOR PRINCIPAL (Fastify)
 * ============================================================================
 * O Fastify é um framework web de alta performance para Node.js.
 * logger: true habilita o log automático detalhado de todas as requisições recebidas.
 */
const fastify = Fastify({ 
    logger: true 
});

/**
 * ----------------------------------------------------------------------------
 * 1. CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing)
 * ----------------------------------------------------------------------------
 * O CORS é um mecanismo de segurança dos navegadores que impede requisições
 * feitas por um domínio/porta diferente da API (ex: React em http://localhost:5173
 * chamando a API em http://localhost:3000).
 * 
 * Com `origin: true`, permitimos requisições vindas do nosso frontend no Vite.
 */
await fastify.register(cors, {
    origin: true, // Permite qualquer origem local de desenvolvimento (ex: Vite na 5173)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

/**
 * ----------------------------------------------------------------------------
 * 2. REGISTRO DE ROTAS
 * ----------------------------------------------------------------------------
 * No Fastify, rotas são modularizadas como plugins e registradas via `fastify.register`.
 * 
 * - `/auth`: Rotas de cadastro e login de usuários (/auth/cadastro, /auth/login)
 * - `/tarefas`: CRUD completo protegido por autenticação (/tarefas, /tarefas/:id, etc.)
 */
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(tarefasRoutes, { prefix: '/tarefas' });

/**
 * ----------------------------------------------------------------------------
 * 3. INICIALIZAÇÃO DO SERVIDOR
 * ----------------------------------------------------------------------------
 * Escuta requisições na porta 3000.
 * `host: '0.0.0.0'` garante que o servidor aceite conexões locais e de rede.
 */
const PORT = Number(process.env.PORT) || 3000;

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 Servidor backend rodando com sucesso em: ${address}`);
});
