/**
 * ============================================================================
 * UTILITÁRIO DE PARSER DE TAREFAS (TODOIST INLINE TAGS, HORÁRIOS & PRIORIDADES)
 * ============================================================================
 * Permite interpretar e compor prioridades (P1, P2, P3, P4), horários de conclusão
 * (@18:30) e tags (#Faculdade, etc.) diretamente a partir do título da tarefa,
 * com 100% de compatibilidade retroativa com o Supabase/PostgreSQL.
 */

export const PRIORIDADES = {
  p1: {
    id: 'p1',
    rotulo: 'P1',
    nome: 'Alta Prioridade',
    corDark: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
    corClaro: 'text-rose-600 bg-rose-50 border-rose-200',
    iconeCor: 'text-rose-500',
  },
  p2: {
    id: 'p2',
    rotulo: 'P2',
    nome: 'Média Prioridade',
    corDark: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
    corClaro: 'text-amber-600 bg-amber-50 border-amber-200',
    iconeCor: 'text-amber-500',
  },
  p3: {
    id: 'p3',
    rotulo: 'P3',
    nome: 'Baixa Prioridade',
    corDark: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
    corClaro: 'text-blue-600 bg-blue-50 border-blue-200',
    iconeCor: 'text-blue-500',
  },
  p4: {
    id: 'p4',
    rotulo: 'P4',
    nome: 'Normal',
    corDark: 'text-zinc-400 bg-white/5 border-white/10',
    corClaro: 'text-gray-500 bg-gray-100 border-gray-200',
    iconeCor: 'text-gray-400',
  },
};

export const TAGS_SUGERIDAS = [
  'Faculdade',
  'Trabalho',
  'Pessoal',
  'Estudos',
  'Saúde',
  'Finanças'
];

/**
 * Extrai o título limpo, prioridade, horário e lista de tags a partir do nome completo salvo.
 */
export function parseTarefaNome(nomeCompleto = '') {
  if (!nomeCompleto) {
    return { tituloLimpo: '', prioridade: 'p4', hora: '', tags: [] };
  }

  let texto = nomeCompleto;
  let prioridade = 'p4';
  let hora = '';

  // Procura padrão de prioridade (!p1, p1, P1, !1, etc.)
  const matchP = texto.match(/(?:^|\s)(?:!|p|P)([1-4])(?:\s|$)/);
  if (matchP) {
    prioridade = 'p' + matchP[1];
    texto = texto.replace(/(?:^|\s)(?:!|p|P)[1-4](?:\s|$)/g, ' ');
  }

  // Procura horário com @ (@14:30 ou @9:00) ou solto se tiver formato HH:mm
  const matchHora = texto.match(/(?:^|\s)@((?:[01]?\d|2[0-3]):[0-5]\d)(?:\s|$)/);
  if (matchHora) {
    let h = matchHora[1];
    if (h.length === 4) h = '0' + h; // ex: 9:30 -> 09:30
    hora = h;
    texto = texto.replace(/(?:^|\s)@(text|d|\:|[01]?\d|2[0-3]):[0-5]\d(?:\s|$)/g, ' ');
    texto = texto.replace(/(?:^|\s)@(?:[01]?\d|2[0-3]):[0-5]\d(?:\s|$)/g, ' ');
  }

  // Procura tags com formato #Tag ou #nome-da-tag
  const tags = [];
  const tagMatches = texto.match(/#([\wÀ-ÿ-]+)/g);
  if (tagMatches) {
    tagMatches.forEach((tag) => {
      const tagLimpa = tag.replace('#', '').trim();
      if (tagLimpa && !tags.includes(tagLimpa)) {
        tags.push(tagLimpa);
      }
    });
    texto = texto.replace(/#([\wÀ-ÿ-]+)/g, ' ');
  }

  // Remove espaços duplicados e bordas
  const tituloLimpo = texto.replace(/\s+/g, ' ').trim();

  return {
    tituloLimpo: tituloLimpo || nomeCompleto,
    prioridade,
    hora,
    tags,
  };
}

/**
 * Monta o nome completo para salvar no banco agregando hora, tags e prioridade.
 */
export function montarTarefaNome({ titulo, prioridade = 'p4', hora = '', tags = [] }) {
  let resultado = (titulo || '').trim();

  if (hora && hora.trim()) {
    const horaLimpa = hora.trim().replace(/^@/, '');
    resultado += ` @${horaLimpa}`;
  }

  if (tags && tags.length > 0) {
    const tagsUnicas = [...new Set(tags.map((t) => t.trim().replace(/^#/, '')))].filter(Boolean);
    if (tagsUnicas.length > 0) {
      resultado += ' ' + tagsUnicas.map((t) => `#${t}`).join(' ');
    }
  }

  if (prioridade && prioridade !== 'p4') {
    resultado += ` ${prioridade.toLowerCase()}`;
  }

  return resultado.trim();
}

/**
 * Alerta inteligente de prazo levando em conta a data e o horário limite configurado.
 */
export function verificarPrazoInteligente(dataTerminoStr, status, horaStr = '') {
  if (!dataTerminoStr || status === 'concluido') return null;

  const [ano, mes, dia] = dataTerminoStr.split('T')[0].split('-').map(Number);
  
  let hora = 23;
  let minuto = 59;
  let segundo = 59;

  if (horaStr && horaStr.includes(':')) {
    const [h, m] = horaStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hora = h;
      minuto = m;
      segundo = 0;
    }
  }

  const dataTermino = new Date(ano, mes - 1, dia, hora, minuto, segundo);
  const agora = new Date();

  // Se a data/hora já passou do momento atual
  if (dataTermino < agora) {
    return 'atrasada';
  }

  // Verifica se o prazo vence hoje
  const hojeFinal = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);

  if (dataTermino >= hojeInicio && dataTermino <= hojeFinal) {
    return 'hoje';
  }

  return 'ok';
}

/**
 * Retorna classes de estilo para tags de forma determinística por hash de texto.
 */
export function obterCorTag(tag, ehDark) {
  const cores = [
    {
      dark: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      claro: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      dark: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      claro: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      dark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      claro: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      dark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      claro: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      dark: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      claro: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      dark: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      claro: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    },
    {
      dark: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      claro: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
  ];

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % cores.length;
  return ehDark ? cores[index].dark : cores[index].claro;
}
