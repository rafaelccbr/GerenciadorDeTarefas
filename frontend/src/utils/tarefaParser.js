/**
 * ============================================================================
 * UTILITÁRIO DE PARSER DE TAREFAS (TODOIST INLINE TAGS, HORÁRIOS, PRIORIDADES,
 * SUBTAREFAS, RECORRÊNCIA & QUICK ADD)
 * ============================================================================
 * Permite interpretar e compor prioridades (P1-P4), horários de conclusão (@18:30),
 * tags (#Faculdade), etapas/subtarefas (||[{t, d}]) e regras de recorrência (~~daily~~)
 * diretamente a partir do título da tarefa, com 100% de compatibilidade retroativa
 * com o banco Supabase/PostgreSQL sem requerer migrações no banco.
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

export const RECORRENCIA_OPCOES = [
  { id: 'never', label: 'Não repetir' },
  { id: 'daily', label: 'Diariamente' },
  { id: 'weekly', label: 'Semanalmente' },
  { id: 'monthly', label: 'Mensalmente' },
];

/**
 * Extrai o título limpo, prioridade, horário, tags, subtarefas e recorrência a partir do nome salvo.
 */
export function parseTarefaNome(nomeCompleto = '') {
  if (!nomeCompleto) {
    return {
      tituloLimpo: '',
      prioridade: 'p4',
      hora: '',
      tags: [],
      subtarefas: [],
      recorrencia: 'never',
      notas: '',
    };
  }

  let texto = nomeCompleto;
  let subtarefas = [];
  let recorrencia = 'never';
  let prioridade = 'p4';
  let hora = '';
  let notas = '';

  // 0. Extrai Notas / Links embutidos: <<NOTA:encoded>>
  const matchNota = texto.match(/<<NOTA:(.*?)>>/);
  if (matchNota) {
    try {
      notas = decodeURIComponent(matchNota[1]);
    } catch {
      notas = matchNota[1];
    }
    texto = texto.replace(/<<NOTA:(.*?)>>/g, ' ').trim();
  }

  // 1. Extrai subtarefas / checklist embutido: ||[{"t":"...","d":true}]
  const idxSub = texto.indexOf('||');
  if (idxSub !== -1) {
    const jsonStr = texto.substring(idxSub + 2).trim();
    texto = texto.substring(0, idxSub).trim();
    try {
      const arr = JSON.parse(jsonStr);
      if (Array.isArray(arr)) {
        subtarefas = arr.map((item) => ({
          texto: typeof item.t === 'string' ? item.t : '',
          feito: Boolean(item.d),
        })).filter(s => s.texto.trim().length > 0);
      }
    } catch {
      // Ignora erro de JSON malformado
    }
  }

  // 2. Extrai regra de recorrência: ~~(daily|weekly|monthly)~~
  const matchRec = texto.match(/~~([a-zA-Z0-9_-]+)~~/);
  if (matchRec) {
    recorrencia = matchRec[1];
    texto = texto.replace(/~~([a-zA-Z0-9_-]+)~~/g, ' ');
  }

  // 3. Procura padrão de prioridade (!p1, p1, P1, !1, etc.)
  const matchP = texto.match(/(?:^|\s)(?:!|p|P)([1-4])(?:\s|$)/);
  if (matchP) {
    prioridade = 'p' + matchP[1];
    texto = texto.replace(/(?:^|\s)(?:!|p|P)[1-4](?:\s|$)/g, ' ');
  }

  // 4. Procura horário com @ (@14:30 ou @9:00)
  const matchHora = texto.match(/(?:^|\s)@((?:[01]?\d|2[0-3]):[0-5]\d)(?:\s|$)/);
  if (matchHora) {
    let h = matchHora[1];
    if (h.length === 4) h = '0' + h; // ex: 9:30 -> 09:30
    hora = h;
    texto = texto.replace(/(?:^|\s)@(?:[01]?\d|2[0-3]):[0-5]\d(?:\s|$)/g, ' ');
  }

  // 5. Procura tags com formato #Tag ou #nome-da-tag
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
    subtarefas,
    recorrencia,
    notas,
  };
}

/**
 * Monta o nome completo para salvar no banco agregando hora, tags, prioridade, recorrência, notas e subtarefas.
 */
export function montarTarefaNome({
  titulo,
  prioridade = 'p4',
  hora = '',
  tags = [],
  subtarefas = [],
  recorrencia = 'never',
  notas = '',
}) {
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

  if (recorrencia && recorrencia !== 'never') {
    resultado += ` ~~${recorrencia}~~`;
  }

  if (notas && notas.trim()) {
    resultado += ` <<NOTA:${encodeURIComponent(notas.trim())}>>`;
  }

  if (subtarefas && subtarefas.length > 0) {
    const compactas = subtarefas
      .filter((s) => s.texto && s.texto.trim())
      .map((s) => ({ t: s.texto.trim(), d: Boolean(s.feito) }));
    if (compactas.length > 0) {
      resultado += ` ||${JSON.stringify(compactas)}`;
    }
  }

  return resultado.trim();
}

/**
 * Extrai URLs clicáveis e texto limpo de um campo de notas.
 */
export function extrairLinksDeTexto(notas = '') {
  if (!notas) return { links: [], textoObservacao: '' };
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = notas.match(urlRegex) || [];
  const textoObservacao = notas.replace(urlRegex, '').replace(/\s+/g, ' ').trim();
  return { links, textoObservacao };
}

/**
 * Emite um aviso sonoro suave usando Web Audio API (sem necessidade de arquivos MP3 externos).
 */
export function tocarSomAlerta(tipo = 'notificacao') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notasSom = tipo === 'pomodoro' ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];

    notasSom.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.35);
    });
  } catch {
    // Ignora caso o navegador bloqueie áudio sem interação
  }
}

/**
 * Calcula o progresso de uma lista de subtarefas.
 */
export function calcularProgressoSubtarefas(subtarefas = []) {
  if (!subtarefas || subtarefas.length === 0) {
    return { total: 0, feitas: 0, porcentagem: 0 };
  }
  const total = subtarefas.length;
  const feitas = subtarefas.filter((s) => s.feito).length;
  const porcentagem = Math.round((feitas / total) * 100);
  return { total, feitas, porcentagem };
}

/**
 * Calcula a próxima data (YYYY-MM-DD) a partir de uma data e regra de recorrência.
 */
export function calcularProximaData(dataAtualStr, regra) {
  const agora = new Date();
  let base = agora;

  if (dataAtualStr) {
    const [ano, mes, dia] = dataAtualStr.split('T')[0].split('-').map(Number);
    if (!isNaN(ano) && !isNaN(mes) && !isNaN(dia)) {
      base = new Date(ano, mes - 1, dia);
    }
  }

  const proxima = new Date(base.getTime());

  if (regra === 'daily') {
    proxima.setDate(proxima.getDate() + 1);
  } else if (regra === 'weekly') {
    proxima.setDate(proxima.getDate() + 7);
  } else if (regra === 'monthly') {
    proxima.setMonth(proxima.getMonth() + 1);
  } else {
    proxima.setDate(proxima.getDate() + 1);
  }

  const yyyy = proxima.getFullYear();
  const mm = String(proxima.getMonth() + 1).padStart(2, '0');
  const dd = String(proxima.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parser de Criação Rápida (Quick Add em linguagem natural).
 * Interpreta títulos como:
 * "Entregar relatório amanhã @15:00 #Faculdade p1"
 * "Reunião com equipe sexta @09:30 #Trabalho"
 */
export function parseQuickAdd(textoLivre = '') {
  let texto = (textoLivre || '').trim();
  const hoje = new Date();
  
  const formatarDataIso = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  let dataDetectada = formatarDataIso(hoje);
  let prioridade = 'p4';
  let hora = '';
  const tags = [];

  // 1. Prioridades: p1, p2, p3, p4
  const matchP = texto.match(/(?:^|\s)(?:!|p|P)([1-4])(?:\s|$)/);
  if (matchP) {
    prioridade = 'p' + matchP[1];
    texto = texto.replace(/(?:^|\s)(?:!|p|P)[1-4](?:\s|$)/g, ' ');
  }

  // 2. Horário: @14:30 ou @9:00
  const matchHora = texto.match(/(?:^|\s)@((?:[01]?\d|2[0-3]):[0-5]\d)(?:\s|$)/);
  if (matchHora) {
    let h = matchHora[1];
    if (h.length === 4) h = '0' + h;
    hora = h;
    texto = texto.replace(/(?:^|\s)@(?:[01]?\d|2[0-3]):[0-5]\d(?:\s|$)/g, ' ');
  }

  // 3. Tags: #Faculdade
  const tagMatches = texto.match(/#([\wÀ-ÿ-]+)/g);
  if (tagMatches) {
    tagMatches.forEach((t) => {
      const limpa = t.replace('#', '').trim();
      if (limpa && !tags.includes(limpa)) {
        tags.push(limpa);
      }
    });
    texto = texto.replace(/#([\wÀ-ÿ-]+)/g, ' ');
  }

  // 4. Reconhecimento de datas em Português
  const lower = texto.toLowerCase();

  // Amanhã
  if (/\b(amanhã|amanha)\b/i.test(texto)) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 1);
    dataDetectada = formatarDataIso(d);
    texto = texto.replace(/\b(amanhã|amanha)\b/gi, ' ');
  } else if (/\b(hoje)\b/i.test(texto)) {
    dataDetectada = formatarDataIso(hoje);
    texto = texto.replace(/\b(hoje)\b/gi, ' ');
  } else if (/\b(depois de amanhã|depois de amanha)\b/i.test(texto)) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 2);
    dataDetectada = formatarDataIso(d);
    texto = texto.replace(/\b(depois de amanhã|depois de amanha)\b/gi, ' ');
  } else if (/\b(semana que vem|próxima semana|proxima semana)\b/i.test(texto)) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 7);
    dataDetectada = formatarDataIso(d);
    texto = texto.replace(/\b(semana que vem|próxima semana|proxima semana)\b/gi, ' ');
  } else {
    // Dias da semana
    const diasSemana = [
      { nomes: ['domingo'], dia: 0 },
      { nomes: ['segunda', 'segunda-feira'], dia: 1 },
      { nomes: ['terça', 'terca', 'terça-feira', 'terca-feira'], dia: 2 },
      { nomes: ['quarta', 'quarta-feira'], dia: 3 },
      { nomes: ['quinta', 'quinta-feira'], dia: 4 },
      { nomes: ['sexta', 'sexta-feira'], dia: 5 },
      { nomes: ['sábado', 'sabado'], dia: 6 },
    ];

    for (const item of diasSemana) {
      for (const n of item.nomes) {
        const regex = new RegExp(`\\b(${n})\\b`, 'i');
        if (regex.test(texto)) {
          const d = new Date(hoje);
          const hojeDia = hoje.getDay();
          let diasAte = (item.dia - hojeDia + 7) % 7;
          if (diasAte === 0) diasAte = 7; // Próximo daquela semana
          d.setDate(d.getDate() + diasAte);
          dataDetectada = formatarDataIso(d);
          texto = texto.replace(regex, ' ');
          break;
        }
      }
    }
  }

  // Título limpo restante
  const tituloLimpo = texto.replace(/\s+/g, ' ').trim();

  return {
    titulo: tituloLimpo,
    prioridade,
    hora,
    tags,
    dataCome: formatarDataIso(hoje),
    dataTermi: dataDetectada,
  };
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
