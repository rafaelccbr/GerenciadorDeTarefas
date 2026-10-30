// Exportação somente de leitura. Não altera usuários, tarefas ou configuração no Supabase.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, 'backend/.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
let userId = process.env.SUPABASE_USER_ID;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env antigo. Nenhuma chave é enviada ao frontend.');
  process.exit(1);
}
if (!userId) {
  const email = process.env.SUPABASE_USER_EMAIL?.toLowerCase();
  for (let page = 1; ; page++) {
    const res = await fetch(new URL(`/auth/v1/admin/users?page=${page}&per_page=${email ? 100 : 2}`, SUPABASE_URL), { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
    if (!res.ok) throw new Error(`Não foi possível identificar a conta (HTTP ${res.status}). Defina SUPABASE_USER_ID no backend/.env.`);
    const data = await res.json();
    if (!email) {
      if (data.users?.length !== 1) throw new Error('Há zero ou mais de uma conta. Defina SUPABASE_USER_EMAIL ou SUPABASE_USER_ID no backend/.env.');
      userId = data.users[0].id; break;
    }
    const match = data.users?.find(user => user.email?.toLowerCase() === email);
    if (match) { userId = match.id; break; }
    if (!data.users || data.users.length < 100) throw new Error('Conta não encontrada com o e-mail informado.');
  }
}
const tasks = [];
for (let offset = 0; ; offset += 500) {
  const url = new URL('/rest/v1/tarefas', SUPABASE_URL);
  url.searchParams.set('select', '*');
  url.searchParams.set('user_id', `eq.${userId}`);
  url.searchParams.set('order', 'id.asc');
  url.searchParams.set('limit', '500');
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!res.ok) throw new Error(`A exportação falhou (HTTP ${res.status}). Nenhum backup completo foi gerado.`);
  const page = await res.json();
  if (!Array.isArray(page)) throw new Error('Resposta de exportação inesperada.');
  tasks.push(...page);
  if (page.length < 500) break;
}
const backupDir = resolve(root, 'backups');
mkdirSync(backupDir, { recursive: true });
const path = resolve(backupDir, `tarefas-supabase-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(path, JSON.stringify({ formato: 'organizador-tarefas-v1', exportado_em: new Date().toISOString(), tarefas: tasks }, null, 2), { flag: 'wx' });
console.log(`Backup completo: ${tasks.length} tarefas. Arquivo salvo em ${path}`);
