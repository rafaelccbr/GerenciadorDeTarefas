import { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  PlusCircle,
  SquarePen,
  Trash2,
  Settings,
  Search,
  X,
  Check,
  AlertCircle,
  Clock,
  LayoutList,
  Kanban,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Flag,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Repeat,
  ListChecks,
  CheckSquare,
  Square,
  Flame,
  BarChart3,
  Bell,
  BellRing,
  ExternalLink,
  GripVertical
} from 'lucide-react';
import { dataLocalIso } from '../utils/datas.js';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/theme.js';
import { Marca } from './Marca.jsx';
import { Tecla } from './Tecla.jsx';
import { SeletorTema } from './SeletorTema.jsx';
import {
  importarTarefasApi,
  listarTarefasApi,
  atualizarStatusApi,
  excluirTarefaApi,
  criarTarefaApi,
  atualizarTarefaApi
} from '../services/api.js';
import { ModalTarefa } from './ModalTarefa.jsx';
import { WidgetPomodoro } from './WidgetPomodoro.jsx';
import { ModalEstatisticas } from './ModalEstatisticas.jsx';
import {
  parseTarefaNome,
  montarTarefaNome,
  PRIORIDADES,
  obterCorTag,
  verificarPrazoInteligente,
  parseQuickAdd,
  calcularProximaData,
  calcularProgressoSubtarefas,
  extrairLinksDeTexto,
  tocarSomAlerta
} from '../utils/tarefaParser.js';

/**
 * ============================================================================
 * TELA PRINCIPAL (DASHBOARD COMPLETO ESTILO TODOIST PRO)
 * ============================================================================
 * Recursos Todoist + Pro:
 * 1.  Visões de Foco: "Hoje", "Próximos 7 Dias" e filtros por status
 * 2.  Quick Add: Criação em 1 linha com linguagem natural (@hora, #tags, p1, amanhã)
 * 3.  Gamificação: Confetes ao concluir tarefa e celebração aos 100% de produtividade
 * 4.  Ordenação Inteligente: Por Prioridade, Prazo, Alfabética e Recentes
 * 5.  Subtarefas / Mini-Checklist interativo com progresso
 * 6.  Tarefas Recorrentes (Rotinas automáticas com reagendamento)
 * 7.  Exportação de Relatórios: PDF formatado e Planilha Excel (.XLSX)
 * 8.  Timer Pomodoro Integrado (Modo Foco vinculado à tarefa)
 * 9.  Drag & Drop nativo no Quadro Kanban
 * 10.  Painel de Estatísticas e Gráficos (Dashboard Analytics)
 * 11.  Notificações Nativas do Navegador + Alerta Sonoro de Horário (@HH:mm)
 * 12.  Notas Rápidas e Links Clicáveis nas Tarefas
 */
export function ListaTarefas({ usuario, aoDeslogar, aoAbrirConta }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Modo de visualização: 'tabela' | 'kanban'
  const [modoVisualizacao, setModoVisualizacao] = useState(() => {
    return localStorage.getItem('gerenciador_modo_visualizacao') || 'tabela';
  });

  const trocarModoVisualizacao = (novoModo) => {
    setModoVisualizacao(novoModo);
    localStorage.setItem('gerenciador_modo_visualizacao', novoModo);
  };

  // Ordenação: 'padrao' | 'prioridade' | 'prazo' | 'alfabetica' | 'recentes'
  const [ordenacao, setOrdenacao] = useState(() => {
    return localStorage.getItem('gerenciador_ordenacao') || 'padrao';
  });

  const trocarOrdenacao = (novaOrd) => {
    setOrdenacao(novaOrd);
    localStorage.setItem('gerenciador_ordenacao', novaOrd);
  };

  // Controle de Busca e Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'hoje' | '7dias' | 'pendente' | 'em_andamento' | 'concluido'
  const inputBuscaRef = useRef(null);

  // Quick Add State
  const [quickAddTexto, setQuickAddTexto] = useState('');
  const [criandoQuick, setCriandoQuick] = useState(false);

  // Menu de Exportação
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const exportarRef = useRef(null);
  const importarRef = useRef(null);
  const [avisoBackup, setAvisoBackup] = useState('');
  const [importando, setImportando] = useState(false);
  function exportarBackup() {
    const blob = new Blob([JSON.stringify({ formato: 'organizador-tarefas-v1', tarefas }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'tarefas-' + dataLocalIso() + '.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenuExportarAberto(false);
  }
  async function importarBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvisoBackup(''); setImportando(true); setMenuExportarAberto(false);
    try {
      if (file.size > 2_000_000) throw new Error('O backup deve ter até 2 MB.');
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.tarefas)) throw new Error('Escolha um backup JSON de tarefas.');
      let imported = 0;
      for (let i = 0; i < backup.tarefas.length; i += 500) {
        const result = await importarTarefasApi(backup.tarefas.slice(i, i + 500)); imported += result.importadas;
      }
      setAvisoBackup(imported + ' tarefas importadas. Tarefas já importadas foram preservadas sem duplicação.');
    } catch (error) { setAvisoBackup('Importação interrompida: ' + error.message + ' Você pode reenviar o backup sem duplicar as tarefas já importadas.'); }
    finally {
      try { setTarefas(await listarTarefasApi()); } catch { setErro('Não foi possível atualizar a lista. Recarregue para conferir a importação.'); }
      setImportando(false);
    }
  }

  // Tarefas com checklist expandido (IDs)
  const [etapasExpandidas, setEtapasExpandidas] = useState(new Set());

  // Controle do Modal de Criação/Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
  const [statusInicialParaNova, setStatusInicialParaNova] = useState('pendente');

  //  Controle do Timer Pomodoro Flutuante
  const [tarefaPomodoroAtiva, setTarefaPomodoroAtiva] = useState(null);

  //  Controle do Modal de Estatísticas (Analytics)
  const [modalEstatisticasAberto, setModalEstatisticasAberto] = useState(false);

  //  Controle de Drag & Drop no Quadro Kanban
  const [tarefaArrastada, setTarefaArrastada] = useState(null);
  const [colunaAlvoDrag, setColunaAlvoDrag] = useState(null);

  //  Controle de Alertas e Notificações Nativas do Navegador
  const [alertasAtivos, setAlertasAtivos] = useState(() => {
    return localStorage.getItem('gerenciador_alertas_ativos') === 'true';
  });
  const tarefasNotificadasRef = useRef(new Set());

  const alternarAlertasNativos = async () => {
    if (!alertasAtivos) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setAlertasAtivos(true);
          localStorage.setItem('gerenciador_alertas_ativos', 'true');
          tocarSomAlerta('notificacao');
          try {
            new Notification(' Alertas de Horário Ativados!', {
              body: 'Você será avisado quando uma tarefa agendada (@HH:mm) estiver próxima do horário.',
            });
          } catch {
            // Ignora
          }
        } else {
          alert('Permissão de notificação negada no navegador. Habilite nas configurações do site para receber alertas.');
        }
      } else {
        setAlertasAtivos(true);
        localStorage.setItem('gerenciador_alertas_ativos', 'true');
        tocarSomAlerta('notificacao');
      }
    } else {
      setAlertasAtivos(false);
      localStorage.setItem('gerenciador_alertas_ativos', 'false');
    }
  };

  // Monitora a cada 30 segundos tarefas agendadas para hoje com @HH:mm (avisa faltando <= 5 min)
  useEffect(() => {
    if (!alertasAtivos || tarefas.length === 0) return;

    const verificarHorariosTarefas = () => {
      const agora = new Date();
      const hojeIso = dataLocalIso(agora);
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

      tarefas.forEach((t) => {
        if (t.status === 'concluido') return;
        const dataTermi = t.data_termi?.split('T')[0];
        if (dataTermi !== hojeIso) return;

        const { tituloLimpo, hora } = parseTarefaNome(t.nome);
        if (!hora) return;

        const [hh, mm] = hora.split(':').map(Number);
        if (isNaN(hh) || isNaN(mm)) return;

        const minutosTarefa = hh * 60 + mm;
        const diff = minutosTarefa - minutosAgora;

        // Dispara se faltar entre 0 e 5 minutos e ainda não tiver notificado nesta sessão
        const chaveNotif = `${t.id}-${hojeIso}-${hora}`;
        if (diff >= 0 && diff <= 5 && !tarefasNotificadasRef.current.has(chaveNotif)) {
          tarefasNotificadasRef.current.add(chaveNotif);
          tocarSomAlerta('notificacao');

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ Prazo Próximo (${hora}): ${tituloLimpo}`, {
                body: diff === 0
                  ? `Sua tarefa "${tituloLimpo}" está agendada para agora (${hora})!`
                  : `Faltam ${diff} min para o horário agendado (${hora}) da tarefa "${tituloLimpo}".`,
              });
            } catch {
              // Ignora
            }
          }
        }
      });
    };

    verificarHorariosTarefas();
    const timer = setInterval(verificarHorariosTarefas, 30000);
    return () => clearInterval(timer);
  }, [alertasAtivos, tarefas]);

  // Abre o modal para cadastro de nova tarefa
  const handleNovoCadastro = (statusPadrao = 'pendente') => {
    setTarefaEmEdicao(null);
    setStatusInicialParaNova(statusPadrao);
    setModalAberto(true);
  };

  // Carrega as tarefas do usuário autenticado ao montar a tela
  useEffect(() => {
    let ativo = true;

    listarTarefasApi()
      .then((lista) => {
        if (ativo) {
          setTarefas(lista);
          setCarregando(false);
        }
      })
      .catch((err) => {
        if (ativo) {
          setErro(err.message || 'Falha ao buscar tarefas do servidor.');
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Fecha menu de exportar ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (exportarRef.current && !exportarRef.current.contains(e.target)) {
        setMenuExportarAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Atalhos Globais de Teclado (N = Criar, / = Buscar, ESC = Fechar/Limpar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const ehInput = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (document.querySelector('.dialog-surface')) return;

      if (e.key === 'Escape') {
        if (modalAberto) {
          setModalAberto(false);
          setTarefaEmEdicao(null);
        } else if (modalEstatisticasAberto) {
          setModalEstatisticasAberto(false);
        } else if (termoBusca) {
          setTermoBusca('');
        }
        setMenuExportarAberto(false);
        return;
      }

      if (!ehInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleNovoCadastro('pendente');
        } else if (e.key === '/') {
          e.preventDefault();
          inputBuscaRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAberto, modalEstatisticasAberto, termoBusca]);

  // Efeitos de Gamificação (Confetes)
  const dispararConfetes = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignora erro caso canvas-confetti falhe
    }
  };

  const dispararCelebracaoCompleta = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#c69af6', '#d5b1ff', '#7938b0'],
      });
    } catch {
      // Ignora erro
    }
  };

  // Formata datas ISO (YYYY-MM-DD) para exibição brasileira (DD/MM/AAAA)
  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não definida';
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  // Mapeamento de texto dos status
  const rotuloStatus = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    concluido: 'Concluído'
  };

  // Trata recorrência ao concluir tarefa
  const processarRecorrenciaSeHouver = async (tarefa) => {
    const { recorrencia, subtarefas, tituloLimpo, prioridade, hora, tags, notas } = parseTarefaNome(tarefa.nome);
    if (recorrencia && recorrencia !== 'never') {
      const proximaData = calcularProximaData(tarefa.data_termi, recorrencia);
      const subtarefasResetadas = subtarefas.map(s => ({ ...s, feito: false }));
      const novoNome = montarTarefaNome({
        titulo: tituloLimpo,
        prioridade,
        hora,
        tags,
        recorrencia,
        subtarefas: subtarefasResetadas,
        notas
      });

      try {
        const res = await criarTarefaApi({
          nome: novoNome,
          data_come: proximaData,
          data_termi: proximaData,
          status: 'pendente'
        });
        if (res?.tarefa) {
          setTarefas((atuais) => [res.tarefa, ...atuais]);
        }
      } catch (err) {
        console.error('Erro ao agendar próxima repetição:', err);
      }
    }
  };

  // Alterna o status da tarefa em ciclo ao clicar no badge
  const alternarProximoStatus = async (tarefa) => {
    const proximaOrdem = {
      pendente: 'em_andamento',
      em_andamento: 'concluido',
      concluido: 'pendente'
    };
    const novoStatus = proximaOrdem[tarefa.status] || 'pendente';
    const statusAnterior = tarefa.status;

    if (novoStatus === 'concluido') {
      dispararConfetes();
      processarRecorrenciaSeHouver(tarefa);
    }

    setTarefas((atuais) =>
      atuais.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
    );

    try {
      await atualizarStatusApi(tarefa.id, novoStatus);
    } catch (err) {
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === tarefa.id ? { ...t, status: statusAnterior } : t))
      );
      alert(`Falha ao salvar alteração de status: ${err.message}`);
    }
  };

  // Conclusão rápida estilo Todoist através do checkbox circular
  const alternarConclusaoRapida = async (tarefa) => {
    const novoStatus = tarefa.status === 'concluido' ? 'pendente' : 'concluido';
    const statusAnterior = tarefa.status;

    if (novoStatus === 'concluido') {
      dispararConfetes();
      processarRecorrenciaSeHouver(tarefa);
    }

    setTarefas((atuais) =>
      atuais.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
    );

    try {
      await atualizarStatusApi(tarefa.id, novoStatus);
    } catch (err) {
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === tarefa.id ? { ...t, status: statusAnterior } : t))
      );
      alert(`Falha ao alterar status: ${err.message}`);
    }
  };

  // Mover tarefa diretamente para um status específico (Kanban)
  const moverStatus = async (tarefa, novoStatus) => {
    const statusAnterior = tarefa.status;
    if (statusAnterior === novoStatus) return;

    if (novoStatus === 'concluido') {
      dispararConfetes();
      processarRecorrenciaSeHouver(tarefa);
    }

    setTarefas((atuais) =>
      atuais.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
    );

    try {
      await atualizarStatusApi(tarefa.id, novoStatus);
    } catch (err) {
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === tarefa.id ? { ...t, status: statusAnterior } : t))
      );
      alert(`Falha ao alterar status: ${err.message}`);
    }
  };

  //  Handlers de Drag & Drop para o Quadro Kanban
  const handleDragStart = (e, tarefa) => {
    setTarefaArrastada(tarefa);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(tarefa.id));
    } catch {
      // Ignora
    }
  };

  const handleDragEnd = () => {
    setTarefaArrastada(null);
    setColunaAlvoDrag(null);
  };

  const handleDragOverColuna = (e, colunaId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colunaAlvoDrag !== colunaId) {
      setColunaAlvoDrag(colunaId);
    }
  };

  const handleDragLeaveColuna = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setColunaAlvoDrag(null);
    }
  };

  const handleDropColuna = (e, colunaId) => {
    e.preventDefault();
    setColunaAlvoDrag(null);
    if (tarefaArrastada && tarefaArrastada.status !== colunaId) {
      moverStatus(tarefaArrastada, colunaId);
    }
    setTarefaArrastada(null);
  };

  // Alterna o checklist de uma subtarefa diretamente na listagem
  const alternarSubtarefaDireta = async (tarefa, indexEtapa) => {
    const parsed = parseTarefaNome(tarefa.nome);
    const novasSubtarefas = parsed.subtarefas.map((s, idx) =>
      idx === indexEtapa ? { ...s, feito: !s.feito } : s
    );

    const novoNome = montarTarefaNome({
      titulo: parsed.tituloLimpo,
      prioridade: parsed.prioridade,
      hora: parsed.hora,
      tags: parsed.tags,
      subtarefas: novasSubtarefas,
      recorrencia: parsed.recorrencia,
      notas: parsed.notas,
    });

    setTarefas((atuais) =>
      atuais.map((t) => (t.id === tarefa.id ? { ...t, nome: novoNome } : t))
    );

    try {
      await atualizarTarefaApi(tarefa.id, {
        nome: novoNome,
        data_come: tarefa.data_come,
        data_termi: tarefa.data_termi,
        status: tarefa.status,
      });
    } catch (err) {
      console.error('Falha ao atualizar etapa:', err);
    }
  };

  // Alternar abertura das etapas de uma tarefa
  const alternarEtapasExpandidas = (tarefaId) => {
    setEtapasExpandidas((prev) => {
      const novo = new Set(prev);
      if (novo.has(tarefaId)) {
        novo.delete(tarefaId);
      } else {
        novo.add(tarefaId);
      }
      return novo;
    });
  };

  // Criação Rápida em 1 Linha (Quick Add)
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddTexto.trim() || criandoQuick) return;

    setCriandoQuick(true);
    const { titulo, prioridade, hora, tags, dataCome, dataTermi } = parseQuickAdd(quickAddTexto);

    if (!titulo) {
      setCriandoQuick(false);
      return;
    }

    const nomeComposto = montarTarefaNome({
      titulo,
      prioridade,
      hora,
      tags,
    });

    try {
      const res = await criarTarefaApi({
        nome: nomeComposto,
        data_come: dataCome,
        data_termi: dataTermi,
        status: 'pendente',
      });
      setTarefas((atuais) => [res.tarefa, ...atuais]);
      setQuickAddTexto('');
    } catch (err) {
      alert(`Falha ao criar tarefa rápida: ${err.message}`);
    } finally {
      setCriandoQuick(false);
    }
  };

  // Abre o modal em modo de edição
  const handleEditar = (tarefa) => {
    setTarefaEmEdicao(tarefa);
    setModalAberto(true);
  };

  // Exclui a tarefa com confirmação
  const handleExcluir = async (id, nome) => {
    const { tituloLimpo } = parseTarefaNome(nome);
    if (!window.confirm(`Tem certeza que deseja excluir a tarefa "${tituloLimpo}"?`)) {
      return;
    }

    const tarefasAnteriores = tarefas;
    setTarefas((atuais) => atuais.filter((t) => t.id !== id));

    try {
      await excluirTarefaApi(id);
    } catch (err) {
      setTarefas(tarefasAnteriores);
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // Salva no backend (Criar ou Editar via Modal)
  const handleSalvarTarefa = async (dadosTarefa) => {
    if (dadosTarefa.id) {
      const res = await atualizarTarefaApi(dadosTarefa.id, {
        nome: dadosTarefa.nome,
        data_come: dadosTarefa.data_come,
        data_termi: dadosTarefa.data_termi,
        status: dadosTarefa.status,
      });
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === dadosTarefa.id ? res.tarefa : t))
      );
    } else {
      const res = await criarTarefaApi({
        nome: dadosTarefa.nome,
        data_come: dadosTarefa.data_come,
        data_termi: dadosTarefa.data_termi,
        status: dadosTarefa.status,
      });
      setTarefas((atuais) => [res.tarefa, ...atuais]);
    }
    setModalAberto(false);
    setTarefaEmEdicao(null);
  };

  // Exportar Planilha Excel nativa (.xlsx) com estilização executiva (cores, cabeçalho, bordas e badges)
  const exportarCsv = async (listaParaExportar) => {
    setMenuExportarAberto(false);
    if (!listaParaExportar || listaParaExportar.length === 0) {
      alert('Não há tarefas para exportar com os filtros atuais.');
      return;
    }

    try {
      const { default: XLSX } = await import('xlsx-js-style');
      const rotuloRecorrencia = {
        daily: 'Diariamente',
        weekly: 'Semanalmente',
        monthly: 'Mensalmente',
        never: 'Não',
      };

      const rotuloPrio = {
        p1: 'P1 — Urgente',
        p2: 'P2 — Alta',
        p3: 'P3 — Média',
        p4: 'P4 — Normal',
      };

      const cabecalhos = [
        'Título da Tarefa',
        'Início',
        'Término',
        'Horário',
        'Status',
        'Prioridade',
        'Tags / Categorias',
        'Recorrência',
        'Progresso Etapas',
        'Notas / Links',
      ];

      const linhasDados = listaParaExportar.map((t) => {
        const { tituloLimpo, prioridade, hora, tags, recorrencia, subtarefas, notas } = parseTarefaNome(t.nome);
        const prog = calcularProgressoSubtarefas(subtarefas);
        const etapasStr = subtarefas.length > 0 ? `${prog.feitas}/${prog.total} (${prog.porcentagem}%)` : 'Sem etapas';
        const tagsStr = (tags && tags.length > 0) ? tags.map((tg) => `#${tg}`).join(' ') : '-';
        const recStr = rotuloRecorrencia[recorrencia] || 'Não';
        const prioKey = (prioridade || 'p4').toLowerCase();

        return [
          tituloLimpo || 'Sem título',
          formatarData(t.data_come),
          formatarData(t.data_termi),
          hora || '-',
          rotuloStatus[t.status] || t.status,
          rotuloPrio[prioKey] || prioKey.toUpperCase(),
          tagsStr,
          recStr,
          etapasStr,
          notas ? notas.replace(/\s+/g, ' ').trim() : '-',
        ];
      });

      const dataHoje = new Date().toLocaleDateString('pt-BR');
      const linhaTitulo = ['RELATÓRIO EXECUTIVO DE TAREFAS — ORGANIZADOR DE TAREFAS PRO'];
      const linhaSubtitulo = [
        `Usuário: ${usuario?.nome || 'Usuário'}   |   Gerado em: ${dataHoje}   |   Tarefas Exportadas: ${listaParaExportar.length}   |   Produtividade Geral: ${porcentagem}%`,
      ];
      const linhaVazia = [''];

      // Monta matriz completa (AOA)
      const matrizPlanilha = [
        linhaTitulo,
        linhaSubtitulo,
        linhaVazia,
        cabecalhos,
        ...linhasDados,
      ];

      const ws = XLSX.utils.aoa_to_sheet(matrizPlanilha);

      // Mescla o Banner de Título (A1:J1) e Subtítulo (A2:J2)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: cabecalhos.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: cabecalhos.length - 1 } },
      ];

      // Bordas padrão suaves para células
      const bordaSuave = {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
      };

      // 1. Estilo do Banner Principal (Linha 1 -> r=0)
      for (let c = 0; c < cabecalhos.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = {
          fill: { fgColor: { rgb: '4C1D95' } },
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }

      // 2. Estilo do Subtítulo de Métricas (Linha 2 -> r=1)
      for (let c = 0; c < cabecalhos.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: 1, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = {
          fill: { fgColor: { rgb: 'EDE9FE' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '5B21B6' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: bordaSuave,
        };
      }

      // 3. Estilo dos Cabeçalhos da Tabela (Linha 4 -> r=3)
      for (let c = 0; c < cabecalhos.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: 3, c });
        if (ws[ref]) {
          ws[ref].s = {
            fill: { fgColor: { rgb: '6D28D9' } },
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: c === 0 || c === 9 ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '4C1D95' } },
              bottom: { style: 'medium', color: { rgb: '4C1D95' } },
              left: { style: 'thin', color: { rgb: '7C3AED' } },
              right: { style: 'thin', color: { rgb: '7C3AED' } },
            },
          };
        }
      }

      // 4. Estilo das Linhas de Dados (r >= 4) com efeito Zebrado e Cores Semânticas
      linhasDados.forEach((linha, idxLinha) => {
        const r = idxLinha + 4;
        const ehPar = idxLinha % 2 === 0;
        const corFundoZebra = ehPar ? 'FFFFFF' : 'F8F5FF';
        const statusValor = linha[4];
        const prioValor = linha[5];

        for (let c = 0; c < cabecalhos.length; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (!ws[ref]) continue;

          let fillRgb = corFundoZebra;
          let fontRgb = '1F2937';
          let isBold = c === 0;
          let alignH = c === 0 || c === 6 || c === 9 ? 'left' : 'center';

          // Coluna Status (c === 4): Verde para Concluído, Roxo para Em andamento, Âmbar para Pendente
          if (c === 4) {
            isBold = true;
            if (statusValor === 'Concluído') {
              fillRgb = 'D1FAE5';
              fontRgb = '065F46';
            } else if (statusValor === 'Em andamento') {
              fillRgb = 'EDE9FE';
              fontRgb = '5B21B6';
            } else {
              fillRgb = 'FEF3C7';
              fontRgb = '92400E';
            }
          }

          // Coluna Prioridade (c === 5): Vermelho P1, Laranja P2, Azul P3, Cinza P4
          if (c === 5) {
            isBold = true;
            if (prioValor.startsWith('P1')) {
              fillRgb = 'FEE2E2';
              fontRgb = '991B1B';
            } else if (prioValor.startsWith('P2')) {
              fillRgb = 'FFEDD5';
              fontRgb = '9A3412';
            } else if (prioValor.startsWith('P3')) {
              fillRgb = 'DBEAFE';
              fontRgb = '1E40AF';
            } else {
              fontRgb = '6B7280';
              isBold = false;
            }
          }

          // Coluna Tags (c === 6): Destaque Roxo quando tem tag
          if (c === 6 && linha[6] !== '-') {
            fontRgb = '6D28D9';
            isBold = true;
          }

          ws[ref].s = {
            fill: { fgColor: { rgb: fillRgb } },
            font: { name: 'Calibri', sz: 10, bold: isBold, color: { rgb: fontRgb } },
            alignment: { horizontal: alignH, vertical: 'center' },
            border: bordaSuave,
          };
        }
      });

      // 5. Altura das linhas (!rows) para visual espaçoso e executivo
      ws['!rows'] = [
        { hpt: 32 }, // Linha 1: Banner Principal
        { hpt: 22 }, // Linha 2: Subtítulo de resumo
        { hpt: 10 }, // Linha 3: Espaço
        { hpt: 26 }, // Linha 4: Cabeçalhos da Tabela
        ...linhasDados.map(() => ({ hpt: 22 })),
      ];

      // 6. Largura automática de cada coluna (!cols) com margem de segurança
      ws['!cols'] = cabecalhos.map((cab, colIdx) => {
        const maiorTexto = linhasDados.reduce((max, linha) => {
          const valorStr = String(linha[colIdx] || '');
          return Math.max(max, valorStr.length);
        }, cab.length);
        return { wch: Math.min(Math.max(maiorTexto + 6, 16), 55) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Tarefas');
      XLSX.writeFile(wb, `relatorio_tarefas_${dataLocalIso()}.xlsx`);
    } catch (e) {
      console.error('Erro ao exportar planilha Excel:', e);
      alert(`Falha ao exportar Excel: ${e.message}`);
    }
  };

  // Exportar PDF Executivo (A4 Paisagem com Banner, Cards de KPI, Barra de Progresso e Cores por Status/Prioridade)
  const exportarPdf = async (listaParaExportar) => {
    setMenuExportarAberto(false);
    if (!listaParaExportar || listaParaExportar.length === 0) {
      alert('Não há tarefas para exportar com os filtros atuais.');
      return;
    }

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Banner Superior Roxo Escuro (#4C1D95 -> RGB 76, 29, 149)
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Linha de destaque Violeta Neon abaixo do banner
      doc.setFillColor(168, 85, 247);
      doc.rect(0, 24, pageWidth, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO EXECUTIVO DE TAREFAS — ORGANIZADOR PRO', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(233, 213, 255);
      const dataHoraAgora = new Date().toLocaleString('pt-BR');
      doc.text(`Usuário: ${usuario?.nome || 'Usuário'}   |   Emitido em: ${dataHoraAgora}`, 14, 18.5);

      // 2. Cálculos para os 4 Cards de KPI da lista exportada
      const qtdTotal = listaParaExportar.length;
      const qtdConcluidas = listaParaExportar.filter((t) => t.status === 'concluido').length;
      const qtdAndamento = listaParaExportar.filter((t) => t.status === 'em_andamento').length;
      const qtdPendentes = listaParaExportar.filter((t) => t.status === 'pendente').length;
      const taxaLista = qtdTotal > 0 ? Math.round((qtdConcluidas / qtdTotal) * 100) : 0;

      const kpis = [
        { titulo: 'TOTAL LISTADO', valor: `${qtdTotal} tarefas`, bg: [243, 232, 255], borda: [192, 132, 252], txt: [88, 28, 135] },
        { titulo: 'CONCLUÍDAS', valor: `${qtdConcluidas} (${taxaLista}%)`, bg: [209, 250, 229], borda: [52, 211, 153], txt: [6, 95, 70] },
        { titulo: 'EM ANDAMENTO', valor: `${qtdAndamento} tarefas`, bg: [237, 233, 254], borda: [167, 139, 250], txt: [91, 33, 182] },
        { titulo: 'PENDENTES', valor: `${qtdPendentes} tarefas`, bg: [254, 243, 199], borda: [251, 191, 36], txt: [146, 64, 14] },
      ];

      const margemX = 14;
      const gapCard = 5;
      const larguraCard = (pageWidth - margemX * 2 - gapCard * 3) / 4;
      const yCards = 30;

      kpis.forEach((kpi, i) => {
        const x = margemX + i * (larguraCard + gapCard);
        doc.setFillColor(...kpi.bg);
        doc.setDrawColor(...kpi.borda);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, yCards, larguraCard, 15, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...kpi.txt);
        doc.text(kpi.titulo, x + 4, yCards + 5.5);

        doc.setFontSize(11);
        doc.text(kpi.valor, x + 4, yCards + 12);
      });

      // 3. Barra Visual de Progresso no PDF
      const yBarra = 49;
      const larguraTotalBarra = pageWidth - margemX * 2;
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(margemX, yBarra, larguraTotalBarra, 3, 1.5, 1.5, 'F');
      if (taxaLista > 0) {
        doc.setFillColor(16, 185, 129);
        doc.roundedRect(margemX, yBarra, (larguraTotalBarra * taxaLista) / 100, 3, 1.5, 1.5, 'F');
      }

      // 4. Tabela Estilizada com Cores Semânticas por Célula
      const rotuloPrioPdf = {
        p1: 'P1 - Urgente',
        p2: 'P2 - Alta',
        p3: 'P3 - Média',
        p4: 'P4 - Normal',
      };

      const head = [['#', 'Título da Tarefa', 'Início', 'Prazo / Hora', 'Status', 'Prioridade', 'Tags', 'Etapas', 'Notas / Links']];
      const body = listaParaExportar.map((t, idx) => {
        const { tituloLimpo, prioridade, hora, tags, subtarefas, notas } = parseTarefaNome(t.nome);
        const prog = calcularProgressoSubtarefas(subtarefas);
        const etapasTxt = subtarefas.length > 0 ? `${prog.feitas}/${prog.total} (${prog.porcentagem}%)` : '-';
        const prioKey = (prioridade || 'p4').toLowerCase();

        return [
          String(idx + 1),
          tituloLimpo || 'Sem título',
          formatarData(t.data_come),
          formatarData(t.data_termi) + (hora ? ` às ${hora}` : ''),
          rotuloStatus[t.status] || t.status,
          rotuloPrioPdf[prioKey] || prioKey.toUpperCase(),
          (tags && tags.length > 0) ? tags.map((tg) => `#${tg}`).join(' ') : '-',
          etapasTxt,
          notas ? notas.replace(/\s+/g, ' ').trim() : '-',
        ];
      });

      const autoTableFunc = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc.autoTable);
      if (typeof autoTableFunc === 'function') {
        autoTableFunc(doc, {
          startY: 55,
          head,
          body,
          theme: 'grid',
          headStyles: {
            fillColor: [109, 40, 217],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'center',
            cellPadding: 3,
          },
          alternateRowStyles: {
            fillColor: [248, 245, 255],
          },
          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [31, 41, 55],
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
            valign: 'middle',
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { fontStyle: 'bold', cellWidth: 62 },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 32 },
            4: { halign: 'center', fontStyle: 'bold', cellWidth: 28 },
            5: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
            6: { textColor: [109, 40, 217], fontStyle: 'bold', cellWidth: 32 },
            7: { halign: 'center', cellWidth: 22 },
            8: { cellWidth: 'auto' },
          },
          didParseCell: (data) => {
            if (data.section === 'body') {
              // Coluna Status (index 4)
              if (data.column.index === 4) {
                const val = data.cell.raw;
                if (val === 'Concluído') {
                  data.cell.styles.fillColor = [209, 250, 229];
                  data.cell.styles.textColor = [6, 95, 70];
                } else if (val === 'Em andamento') {
                  data.cell.styles.fillColor = [237, 233, 254];
                  data.cell.styles.textColor = [91, 33, 182];
                } else {
                  data.cell.styles.fillColor = [254, 243, 199];
                  data.cell.styles.textColor = [146, 64, 14];
                }
              }
              // Coluna Prioridade (index 5)
              if (data.column.index === 5) {
                const val = String(data.cell.raw || '');
                if (val.startsWith('P1')) {
                  data.cell.styles.fillColor = [254, 226, 226];
                  data.cell.styles.textColor = [153, 27, 27];
                } else if (val.startsWith('P2')) {
                  data.cell.styles.fillColor = [255, 237, 213];
                  data.cell.styles.textColor = [154, 52, 18];
                } else if (val.startsWith('P3')) {
                  data.cell.styles.fillColor = [219, 234, 254];
                  data.cell.styles.textColor = [30, 64, 175];
                } else {
                  data.cell.styles.textColor = [107, 114, 128];
                  data.cell.styles.fontStyle = 'normal';
                }
              }
            }
          },
          didDrawPage: (data) => {
            // Rodapé em todas as páginas
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
              'Organizador de Tarefas Pro — Relatório Automático de Produtividade',
              margemX,
              pageHeight - 6
            );
            doc.text(
              `Página ${data.pageNumber}`,
              pageWidth - margemX - 18,
              pageHeight - 6
            );
          },
        });
      }

      doc.save(`relatorio_tarefas_${dataLocalIso()}.pdf`);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert(`Falha ao gerar PDF: ${e.message}`);
    }
  };

  // Métricas de produtividade
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluido').length;
  const porcentagem = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

  // Dispara celebração quando atinge 100%
  const anteriorPorcentagemRef = useRef(porcentagem);
  useEffect(() => {
    if (porcentagem === 100 && totalTarefas > 0 && anteriorPorcentagemRef.current < 100) {
      dispararCelebracaoCompleta();
    }
    anteriorPorcentagemRef.current = porcentagem;
  }, [porcentagem, totalTarefas]);

  // Contadores para as abas de filtro
  const hojeStr = dataLocalIso();
  const em7Dias = new Date();
  em7Dias.setDate(em7Dias.getDate() + 7);
  const em7DiasStr = dataLocalIso(em7Dias);

  const contagemHoje = tarefas.filter((t) => {
    const dataTermi = t.data_termi?.split('T')[0];
    return dataTermi === hojeStr || (t.status !== 'concluido' && dataTermi < hojeStr);
  }).length;

  const atencaoHoje = tarefas.filter(t => t.status !== 'concluido' && t.data_termi?.slice(0, 10) <= hojeStr).length;

  const contagem7Dias = tarefas.filter((t) => {
    const dataTermi = t.data_termi?.split('T')[0];
    return dataTermi >= hojeStr && dataTermi <= em7DiasStr;
  }).length;

  const contagemPendentes = tarefas.filter((t) => t.status === 'pendente').length;
  const contagemEmAndamento = tarefas.filter((t) => t.status === 'em_andamento').length;
  const contagemConcluidas = tarefasConcluidas;

  // Busca textual
  const atendeTermoBusca = (t) => {
    if (!termoBusca.trim()) return true;
    const termo = termoBusca.toLowerCase().trim();
    const nomeMatch = t.nome?.toLowerCase().includes(termo);
    const dataComeMatch = formatarData(t.data_come)?.includes(termo);
    const dataTermiMatch = formatarData(t.data_termi)?.includes(termo);
    return nomeMatch || dataComeMatch || dataTermiMatch;
  };

  // Filtragem conforme a aba selecionada
  const filtrarPorAba = (lista) => {
    return lista.filter((t) => {
      const dataTermi = t.data_termi?.split('T')[0];

      if (filtroStatus === 'hoje') {
        return dataTermi === hojeStr || (t.status !== 'concluido' && dataTermi < hojeStr);
      }
      if (filtroStatus === '7dias') {
        return dataTermi >= hojeStr && dataTermi <= em7DiasStr;
      }
      if (filtroStatus === 'pendente' || filtroStatus === 'em_andamento' || filtroStatus === 'concluido') {
        return t.status === filtroStatus;
      }
      return true; // 'todos'
    });
  };

  // Aplicação da Ordenação Inteligente
  const prioridadeOrdem = { p1: 1, p2: 2, p3: 3, p4: 4 };

  const aplicarOrdenacao = (lista) => {
    return [...lista].sort((a, b) => {
      if (ordenacao === 'prioridade') {
        const pA = parseTarefaNome(a.nome).prioridade || 'p4';
        const pB = parseTarefaNome(b.nome).prioridade || 'p4';
        return (prioridadeOrdem[pA] || 4) - (prioridadeOrdem[pB] || 4);
      }
      if (ordenacao === 'prazo') {
        const dataA = a.data_termi || '';
        const dataB = b.data_termi || '';
        return dataA.localeCompare(dataB);
      }
      if (ordenacao === 'alfabetica') {
        const tA = parseTarefaNome(a.nome).tituloLimpo.toLowerCase();
        const tB = parseTarefaNome(b.nome).tituloLimpo.toLowerCase();
        return tA.localeCompare(tB);
      }
      if (ordenacao === 'recentes') {
        return (b.id || 0) - (a.id || 0);
      }
      return 0;
    });
  };

  // Tarefas finais filtradas e ordenadas para a Tabela
  const tarefasFiltradasTabela = aplicarOrdenacao(
    filtrarPorAba(tarefas).filter(atendeTermoBusca)
  );

  // Renderizador inteligente de Título + Prioridade + Tags + Recorrência + Subtarefas + Notas/Links
  const renderIdentificacaoTarefa = (tarefa, concluida) => {
    const { tituloLimpo, prioridade, tags, recorrencia, subtarefas, notas } = parseTarefaNome(tarefa.nome);
    const prioConfig = PRIORIDADES[prioridade] || PRIORIDADES.p4;
    const progEtapas = calcularProgressoSubtarefas(subtarefas);
    const temEtapas = subtarefas.length > 0;
    const expandida = etapasExpandidas.has(tarefa.id);
    const { links, textoLimpo: notasTexto } = extrairLinksDeTexto(notas);

    return (
      <div className="flex flex-col gap-1.5 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`break-words transition-colors duration-200 ${
            concluida
              ? ehDark ? 'line-through text-(--muted)' : 'line-through text-(--muted)'
              : ehDark ? 'text-(--ink) font-semibold' : 'text-(--ink) font-medium'
          }`}>
            {tituloLimpo}
          </span>

          {/* Badge de Prioridade */}
          {prioridade !== 'p4' && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[13px] font-bold border shrink-0 ${
                ehDark ? prioConfig.corDark : prioConfig.corClaro
              }`}
              title={prioConfig.nome}
            >
              <Flag className={`w-2.5 h-2.5 ${prioConfig.iconeCor}`} />
              {prioConfig.rotulo}
            </span>
          )}

          {/* Badge de Recorrência */}
          {recorrencia && recorrencia !== 'never' && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[13px] font-semibold border shrink-0 ${
                ehDark
                  ? 'bg-(--surface-muted) text-(--muted) border-(--border)'
                  : 'bg-(--surface-muted) text-(--muted) border-(--border)'
              }`}
              title={`Repete: ${recorrencia}`}
            >
              <Repeat className="w-2.5 h-2.5" />
              {recorrencia === 'daily' ? 'Diário' : recorrencia === 'weekly' ? 'Semanal' : 'Mensal'}
            </span>
          )}

          {/* Mini-Indicador de Subtarefas com Toggle */}
          {temEtapas && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                alternarEtapasExpandidas(tarefa.id);
              }}
              className={"ui-button " + (`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer active:scale-95 ${
                progEtapas.porcentagem === 100
                  ? ehDark ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : ehDark ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) border-(--border)' : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border-(--border)'
              }`)}
              title="Clique para ver ou ocultar etapas"
            >
              <ListChecks className="w-3 h-3 text-(--muted)" />
              <span>{progEtapas.feitas}/{progEtapas.total} etapas</span>
              {expandida ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}
        </div>

        {/* Tags / Categorias + Pílulas de Links Rápidos */}
        {(tags.length > 0 || links.length > 0) && (
          <div className="flex flex-wrap gap-1 items-center">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTermoBusca(`#${tag}`);
                }}
                title={`Filtrar por #${tag}`}
                className={"ui-button " + (`inline-flex items-center px-2 py-0.2 rounded-full text-[13px] font-semibold border transition-colors hover:scale-105 cursor-pointer ${obterCorTag(tag, ehDark)}`)}
              >
                #{tag}
              </button>
            ))}

            {links.map((url, idx) => {
              let dominio = 'Abrir Link';
              try {
                dominio = new URL(url).hostname.replace('www.', '');
              } catch {
                // Fallback
              }
              return (
                <a
                  key={`link-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={url}
                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[13px] font-bold border transition-colors hover:scale-105 cursor-pointer ${
                    ehDark
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                      : 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200'
                  }`}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[130px]">{dominio}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Notas / Observações Rápidas */}
        {notasTexto && (
          <p className={`text-[11px] leading-relaxed break-words line-clamp-2 ${
            ehDark ? 'text-(--ink)' : 'text-(--muted)'
          }`}>
             {notasTexto}
          </p>
        )}

        {/* Lista Expandida de Subtarefas com Checkbox Direto */}
        {temEtapas && expandida && (
          <div className={`mt-2 p-2.5 rounded-xl border space-y-1.5  ${
            ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface-muted) border-(--border)'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={`font-semibold ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                Progresso das etapas:
              </span>
              <span className={`font-bold ${progEtapas.porcentagem === 100 ? 'text-(--accent)' : ehDark ? 'text-(--ink)' : 'text-(--muted)'}`}>
                {progEtapas.porcentagem}%
              </span>
            </div>

            <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${ehDark ? 'bg-(--surface)' : 'bg-(--surface-muted)'}`}>
              <div
                className={`h-full rounded-full transition-colors duration-300 ${
                  progEtapas.porcentagem === 100 ? 'bg-emerald-400' : 'bg-(--surface-muted)'
                }`}
                style={{ width: `${progEtapas.porcentagem}%` }}
              />
            </div>

            <div className="space-y-1">
              {subtarefas.map((etapa, idx) => (
                <div
                  key={idx}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[13px] transition-colors ${
                    ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface) border-(--border)'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternarSubtarefaDireta(tarefa, idx)}
                    className={"ui-button " + ("cursor-pointer text-(--muted) hover:scale-110 transition-transform shrink-0")}
                  >
                    {etapa.feito ? (
                      <CheckSquare className="w-3.5 h-3.5 text-(--accent)" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-(--muted)" />
                    )}
                  </button>
                  <span className={`flex-1 break-words ${
                    etapa.feito
                      ? ehDark ? 'line-through text-(--muted)' : 'line-through text-(--muted)'
                      : ehDark ? 'text-(--ink)' : 'text-(--ink)'
                  }`}>
                    {etapa.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Configuração das Colunas do Quadro Kanban
  const colunasKanban = [
    {
      id: 'pendente',
      titulo: 'Pendente',
      icone: Clock,
      badgeClaro: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      corHeaderClaro: '  ',
      corHeaderDark: '  ',
      bordaClaro: 'border-amber-200/80',
      bordaDark: 'border-amber-500/20',
      fundoColunaClaro: 'bg-amber-500/[0.02]',
      fundoColunaDark: 'bg-(--surface)',
    },
    {
      id: 'em_andamento',
      titulo: 'Em andamento',
      icone: PlayCircle,
      badgeClaro: 'bg-(--surface-muted) text-(--muted) border-(--border)',
      badgeDark: 'bg-(--surface-muted) text-(--ink) border-(--border)',
      corHeaderClaro: '  ',
      corHeaderDark: '  ',
      bordaClaro: 'border-(--border)',
      bordaDark: 'border-(--border)',
      fundoColunaClaro: 'bg-(--surface-muted)',
      fundoColunaDark: 'bg-(--surface)',
    },
    {
      id: 'concluido',
      titulo: 'Concluído',
      icone: CheckCircle2,
      badgeClaro: 'bg-green-100 text-green-800 border-green-300',
      badgeDark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
      corHeaderClaro: '  ',
      corHeaderDark: '  ',
      bordaClaro: 'border-emerald-200/80',
      bordaDark: 'border-emerald-500/20',
      fundoColunaClaro: 'bg-emerald-500/[0.02]',
      fundoColunaDark: 'bg-(--surface)',
    },
  ];

  return (
    <div className="workspace">

      {/* Container Principal */}
      <div className="workspace-content w-full flex flex-col">

        <div className="workspace-brand">
          <Marca escopo={usuario?.nome ? 'Espaço de ' + usuario.nome.split(' ')[0] : 'Seu espaço pessoal'} />
          <time className="workspace-date">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</time>
        </div>
        {/* Barra Superior de Ações com Au Responsivo */}
        <div className="task-toolbar relative z-30">

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Botão Sair */}
            <button
              onClick={aoDeslogar}
              className={"ui-button " + ("flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-rose-500/40 hover:bg-rose-500/55 border border-rose-400/50 hover:border-rose-300/70  text-(--ink) font-bold rounded-full   transition-colors duration-300 active:scale-95 cursor-pointer group text-[13px] sm:text-sm")}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-200 group-hover:text-(--ink) group-hover:-translate-x-0.5 transition-colors duration-300" />
              Sair
            </button>

            {/* Botão Cadastrar */}
            <button
              onClick={() => handleNovoCadastro('pendente')}
              className={"ui-button ui-primary " + ("flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-emerald-500/40 hover:bg-emerald-500/55 border border-emerald-300/60 hover:border-emerald-200/80  text-(--ink) font-bold rounded-full   transition-colors duration-300 active:scale-95 cursor-pointer group text-[13px] sm:text-sm")}
              title="Cadastrar nova tarefa (Atalho: N)"
              aria-keyshortcuts="N"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100 group-hover:text-(--ink) group-hover:rotate-90 transition-colors duration-300" />
              Nova tarefa
              <Tecla>N</Tecla>
            </button>

            {/* Menu de Exportação (CSV e PDF) */}
            <div className="relative" ref={exportarRef}>
              <button
                type="button"
                onClick={() => setMenuExportarAberto(!menuExportarAberto)}
                className={"ui-button " + (`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 border  text-(--ink) font-bold rounded-full transition-colors duration-300 active:scale-95 cursor-pointer group text-[13px] sm:text-sm ${
                  menuExportarAberto
                    ? 'bg-(--surface-muted) border-(--border) '
                    : 'bg-(--surface-muted) hover:bg-(--surface-muted) border border-(--border) hover:border-(--border)  '
                }`)}
                title="Exportar tarefas para Excel ou PDF"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-(--ink) group-hover:text-(--ink) group-hover:-translate-y-0.5 transition-colors duration-300" />
                <span>Exportar</span>
                <ChevronDown className={`w-3.5 h-3.5 text-(--ink) transition-transform duration-300 ${menuExportarAberto ? 'rotate-180 text-(--ink)' : ''}`} />
              </button>

              {menuExportarAberto && (
                <div className={`absolute left-0 top-full mt-2.5 w-60 rounded-2xl p-2  border  z-50  ${
                  ehDark
                    ? 'bg-(--surface) border-(--border) text-(--ink)  ring-1 ring-white/10'
                    : 'bg-(--surface) border-(--border) text-(--ink)  ring-1 ring-black/5'
                }`}>
                  <div className={`px-3 py-1.5 text-[13px] font-bold   border-b mb-1.5 flex items-center justify-between ${
                    ehDark ? 'text-(--muted) border-(--border)' : 'text-(--muted) border-(--border)'
                  }`}>
                    <span>Exportar Relatório</span>
                    <span className={`text-[13px] font-semibold px-1.5 py-0.2 rounded-full ${
                      ehDark ? 'bg-(--surface) text-(--ink)' : 'bg-(--surface-muted) text-(--muted)'
                    }`}>
                      {tarefasFiltradasTabela.length} {tarefasFiltradasTabela.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <button type="button" onClick={exportarBackup} className={"ui-button " + ("w-full text-left px-3 py-3 text-sm rounded-xl hover:bg-(--surface-muted)")}>Salvar backup JSON</button>
                  <button type="button" disabled={importando} onClick={() => importarRef.current?.click()} className={"ui-button " + ("w-full text-left px-3 py-3 text-sm rounded-xl hover:bg-(--surface-muted)")}>{importando ? 'Importando…' : 'Importar backup JSON'}</button>
                  <button
                    type="button"
                    onClick={() => exportarCsv(tarefasFiltradasTabela)}
                    className={"ui-button " + (`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors text-left cursor-pointer active:scale-95 ${
                      ehDark
                        ? 'hover:bg-(--surface-muted) text-(--ink) hover:text-(--ink)'
                        : 'hover:bg-(--surface-muted) text-(--muted) hover:text-(--muted)'
                    }`)}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${ehDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Planilha Excel (.XLSX)</div>
                      <div className={`text-[13px] ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>Colunas ajustadas automaticamente</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportarPdf(tarefasFiltradasTabela)}
                    className={"ui-button " + (`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors text-left cursor-pointer active:scale-95 ${
                      ehDark
                        ? 'hover:bg-(--surface-muted) text-(--ink) hover:text-(--ink)'
                        : 'hover:bg-(--surface-muted) text-(--muted) hover:text-(--muted)'
                    }`)}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${ehDark ? 'bg-(--surface-muted) text-(--muted)' : 'bg-(--surface-muted) text-(--muted)'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Relatório em PDF</div>
                      <div className={`text-[13px] ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>Documento para impressão</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/*  Botão Estatísticas (Dashboard Analytics) */}
            <button
              type="button"
              onClick={() => setModalEstatisticasAberto(true)}
              className={"ui-button " + ("flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-(--surface-muted) hover:bg-(--surface-muted) border border-(--border) hover:border-(--border)  text-(--ink) font-bold rounded-full   transition-colors duration-300 active:scale-95 cursor-pointer group text-[13px] sm:text-sm")}
              title="Abrir painel de estatísticas e gráficos"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-(--ink) group-hover:text-(--ink) transition-colors duration-300" />
              <span>Estatísticas</span>
            </button>

            {/*  Botão de Alertas Nativos do Navegador */}
            <button
              type="button"
              onClick={alternarAlertasNativos}
              className={"ui-button " + (`flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 border  font-bold rounded-full transition-colors duration-300 active:scale-95 cursor-pointer text-[13px] sm:text-sm ${
                alertasAtivos
                  ? 'bg-amber-500/45 hover:bg-amber-500/60 border-amber-300/70 text-(--ink) '
                  : 'bg-(--surface) hover:bg-(--surface) border-(--border) text-(--ink) hover:text-(--ink)'
              }`)}
              title={alertasAtivos ? 'Alertas sonoros e notificações ativados (clique para desativar)' : 'Ativar alertas de horário (@HH:mm) no navegador'}
            >
              {alertasAtivos ? (
                <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 " />
              ) : (
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-(--ink)" />
              )}
              <span className="hidden sm:inline">{alertasAtivos ? 'Alertas ON' : 'Alertas'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seletor de Tema (Violeta / Dark) */}
            <SeletorTema />

            {/* Gerenciamento de Conta: "(nome)" */}
            {usuario?.nome && (
              <button
                type="button"
                onClick={aoAbrirConta}
                className={"ui-button " + (`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full   transition-colors active:scale-95 cursor-pointer group text-[13px] sm:text-sm ${
                  ehDark
                    ? 'bg-(--surface-muted) hover:bg-(--surface-muted) border border-(--border) text-(--ink) hover:text-(--ink) '
                    : 'bg-(--surface) hover:bg-(--surface) border border-(--border) hover:border-(--border) text-(--ink) hover:text-(--ink)'
                }`)}
                title="Clique para gerenciar sua conta"
              >
                <span className="font-medium truncate max-w-[140px] sm:max-w-none">
                  <strong className="text-(--ink) font-bold">{usuario.nome}</strong>
                </span>
                <Settings className={`w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-45 transition-transform duration-300 shrink-0 ${
                  ehDark ? 'text-(--muted) group-hover:text-(--ink)' : 'text-(--ink) group-hover:text-(--ink)'
                }`} />
              </button>
            )}
          </div>

        </div>

        <details className="mobile-tools">
          <summary>Mais opções</summary>
          <div className="mobile-tools-menu">
            <button className="ui-button" type="button" onClick={() => setModalEstatisticasAberto(true)}>Estatísticas</button>
            <button className="ui-button" type="button" onClick={alternarAlertasNativos}>{alertasAtivos ? 'Desativar alertas' : 'Ativar alertas'}</button>
            <SeletorTema />
            <button className="ui-button" type="button" onClick={aoAbrirConta}>Minha conta</button>
            <button className="ui-button" type="button" onClick={aoDeslogar}>Sair</button>
          </div>
        </details>
        <header className="workspace-heading">
          <div>
            <h1>{usuario?.nome ? 'Sua rotina, ' + usuario.nome.split(' ')[0] + '.' : 'Sua rotina.'}</h1>
            <p>{carregando ? 'Buscando suas tarefas.' : totalTarefas === 0 ? 'Um passo de cada vez. Comece pela primeira tarefa.' : atencaoHoje > 0 ? atencaoHoje + (atencaoHoje === 1 ? ' tarefa merece' : ' tarefas merecem') + ' sua atenção hoje.' : 'Seu dia está em dia. Escolha o próximo passo.'}</p>
          </div>
        </header>
        <section className="task-panel" aria-label="Suas tarefas">
          <input ref={importarRef} type="file" accept=".json,application/json" onChange={importarBackup} className="hidden" aria-label="Arquivo de backup de tarefas" />
          {avisoBackup && <p role="status" className="mb-4 text-sm text-(--ink)">{avisoBackup}</p>}
          {/* Mensagem de Erro */}
          {erro && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              ehDark
                ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                : 'bg-red-100 border border-red-300 text-red-700'
            }`}>
              {erro}
            </div>
          )}

          {/* 1. Quick Add: Criação Rápida em 1 Linha com Linguagem Natural */}
          <form onSubmit={handleQuickAdd} className="quick-add">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <label htmlFor="quick-add" className="sr-only">Adicionar tarefa com linguagem natural</label>
            <input id="quick-add" value={quickAddTexto} onChange={(e) => setQuickAddTexto(e.target.value)} placeholder="Nova tarefa…" disabled={criandoQuick} />
            <button type="submit" className={"ui-button ui-primary " + ("primary-button")} disabled={criandoQuick || !quickAddTexto.trim()} aria-keyshortcuts="Enter">{criandoQuick ? 'Salvando…' : 'Adicionar'} <Tecla>Enter</Tecla></button>
          </form>

          {/* Estado de Carregando */}
          {carregando ? (
            <div className={`flex-1 flex flex-col items-center justify-center py-20 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
              <div className={`loading-dots mb-4 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <p className="font-medium text-sm sm:text-base  ">Carregando suas tarefas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            /* Estado Vazio Total */
            <div className={`flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
              <p className={`text-lg sm:text-xl font-semibold mb-2 ${ehDark ? 'text-(--ink)' : 'text-(--muted)'}`}>Nenhuma tarefa encontrada</p>
              <p className={`text-[13px] sm:text-sm max-w-sm mb-6 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                Você ainda não tem tarefas cadastradas. Use a barra rápida acima ou clique em "Cadastrar"!
              </p>
              <button
                onClick={() => handleNovoCadastro('pendente')}
                className={"ui-button " + ("px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-(--ink) font-bold rounded-full   transition-colors cursor-pointer text-sm")}
              >
                Criar primeira tarefa
              </button>
            </div>
          ) : (
            <>
              <div className="progress-summary">
                <div><h2>{porcentagem === 100 ? 'Tudo concluído' : 'Progresso geral'}</h2><p>{tarefasConcluidas} de {totalTarefas} tarefas concluídas</p></div>
                <div><span className="progress-value num">{porcentagem}%</span><div className="progress-track" role="progressbar" aria-label="Tarefas concluídas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentagem}><div style={{ width: porcentagem + '%' }} /></div></div>
              </div>
              {/* 3. Barra de Busca e Ordenação */}
              <div className="task-filters w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">

                {/* Campo de Pesquisa em Tempo Real */}
                <div className="relative flex-1 max-w-md">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    ehDark ? 'text-(--muted)' : 'text-(--muted)'
                  }`} />
                  <input
                    ref={inputBuscaRef}
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    aria-label="Buscar tarefas, tags e horários"
                    placeholder="Buscar tarefas, #tags, @horários"
                    className={`w-full pl-10 pr-24 py-2 rounded-full text-[13px] sm:text-sm font-medium border transition-colors focus:outline-none focus:ring-2 ${
                      ehDark
                        ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                        : 'bg-(--surface) hover:bg-(--surface-muted) focus:bg-(--surface) text-(--ink) placeholder-gray-400 border-(--border) focus:border-(--border) focus:ring-(--accent) '
                    }`}
                  />
                  <div className="search-actions">
                    <button type="button" className="ui-button" onClick={() => inputBuscaRef.current?.focus()} aria-label="Focar busca" aria-keyshortcuts="/" title="Buscar tarefas (/) "><Tecla>/</Tecla></button>
                  {termoBusca && (
                    <button
                      type="button"
                      onClick={() => setTermoBusca('')}
                      aria-keyshortcuts="Escape"
                      className={"ui-button " + (`p-0.5 rounded-full transition-colors cursor-pointer ${
                        ehDark ? 'text-(--muted) hover:text-(--ink) hover:bg-(--surface)' : 'text-(--muted) hover:text-(--muted) hover:bg-(--surface-muted)'
                      }`)}
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                      <Tecla>Esc</Tecla>
                    </button>
                  )}
                  </div>
                </div>

                {/* Controles da Direita: Ordenação Inteligente + Modo Tabela / Quadro */}
                <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">

                  {/* Seletor de Ordenação Inteligente */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className={`w-3.5 h-3.5 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`} />
                    <select
                      value={ordenacao}
                      onChange={(e) => trocarOrdenacao(e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer focus:outline-none ${
                        ehDark
                          ? 'bg-(--surface) hover:bg-(--surface) border-(--border) text-(--ink) [&>option]:bg-(--surface) [&>option]:text-(--ink)'
                          : 'bg-(--surface) hover:bg-(--surface-muted) border-(--border) text-(--muted) '
                      }`}
                    >
                      <option value="padrao">Ordem: Padrão</option>
                      <option value="prioridade">Ordem: Prioridade (P1 &rarr; P4)</option>
                      <option value="prazo">Ordem: Prazo mais urgente</option>
                      <option value="alfabetica">Ordem: Alfabética (A-Z)</option>
                      <option value="recentes">Ordem: Mais recentes</option>
                    </select>
                  </div>

                  {/* Alternador de Modo: Tabela ↔ Quadro Kanban */}
                  <div className={`inline-flex items-center p-1 rounded-full border shrink-0 ${
                    ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface-muted) border-(--border)'
                  }`}>
                    <button aria-pressed={modoVisualizacao === 'tabela'}
                      type="button"
                      onClick={() => trocarModoVisualizacao('tabela')}
                      title="Visualização em Lista / Tabela"
                      className={"ui-button " + (`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                        modoVisualizacao === 'tabela'
                          ? ehDark
                            ? 'bg-(--surface-muted) text-(--ink)  border border-(--border)'
                            : 'bg-(--surface) text-(--muted) '
                          : ehDark
                          ? 'text-(--muted) hover:text-(--ink)'
                          : 'text-(--muted) hover:text-(--ink)'
                      }`)}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Tabela</span>
                    </button>

                    <button aria-pressed={modoVisualizacao === 'kanban'}
                      type="button"
                      onClick={() => trocarModoVisualizacao('kanban')}
                      title="Visualização em Quadro Kanban"
                      className={"ui-button " + (`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                        modoVisualizacao === 'kanban'
                          ? ehDark
                            ? 'bg-(--surface-muted) text-(--ink)  border border-(--border)'
                            : 'bg-(--surface) text-(--muted) '
                          : ehDark
                          ? 'text-(--muted) hover:text-(--ink)'
                          : 'text-(--muted) hover:text-(--ink)'
                      }`)}
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Quadro</span>
                    </button>
                  </div>

                </div>

              </div>

              {/* 4. Abas de Visões de Foco ("Hoje", "7 Dias", "Todas", "Pendentes", etc.) */}
              <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {[
                  { id: 'todos', label: 'Todas', contagem: totalTarefas },
                  { id: 'hoje', label: 'Hoje', contagem: contagemHoje },
                  { id: '7dias', label: ' Próximos 7 Dias', contagem: contagem7Dias },
                  { id: 'pendente', label: 'Pendentes', contagem: contagemPendentes },
                  { id: 'em_andamento', label: 'Em andamento', contagem: contagemEmAndamento },
                  { id: 'concluido', label: 'Concluídas', contagem: contagemConcluidas },
                ].map((aba) => {
                  const ativa = filtroStatus === aba.id;
                  return (
                    <button aria-pressed={filtroStatus === aba.id}
                      key={aba.id}
                      type="button"
                      onClick={() => setFiltroStatus(aba.id)}
                      className={"ui-button " + (`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                        ativa
                          ? ehDark
                            ? 'bg-(--surface-muted) text-(--ink) border border-(--border) '
                            : 'bg-(--surface-muted) text-(--ink) '
                          : ehDark
                          ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) hover:text-(--ink) border border-(--border)'
                          : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) hover:text-(--ink) border border-(--border)'
                      }`)}
                    >
                      <span>{aba.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[13px] font-bold ${
                        ativa
                          ? ehDark ? 'bg-(--surface-muted) text-(--ink)' : 'bg-(--surface-muted) text-(--ink)'
                          : ehDark ? 'bg-(--surface) text-(--ink)' : 'bg-(--surface-muted) text-(--muted)'
                      }`}>
                        {aba.contagem}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 5. Se nenhuma tarefa bater com a busca/filtro (modo Tabela) */}
              {modoVisualizacao === 'tabela' && tarefasFiltradasTabela.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <Search className={`w-8 h-8 mb-2 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`} />
                  <p className={`font-semibold text-sm sm:text-base ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
                    Nenhuma tarefa corresponde à busca ou filtro
                  </p>
                  <p className={`text-[13px] mt-1 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                    Tente digitar outros termos ou selecione a aba "Todas".
                  </p>
                  <button
                    type="button"
                    onClick={() => { setTermoBusca(''); setFiltroStatus('todos'); }}
                    className={"ui-button " + (`mt-4 px-4 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-colors active:scale-95 ${
                      ehDark ? 'bg-(--surface) hover:bg-(--surface) text-(--ink)' : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted)'
                    }`)}
                  >
                    Limpar busca e filtros
                  </button>
                </div>
              ) : modoVisualizacao === 'kanban' ? (
                /* ========================================================================= */
                /* 6. MODO QUADRO KANBAN (3 COLUNAS COM DRAG & DROP)                         */
                /* ========================================================================= */
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5 items-start ">
                  {colunasKanban.map((coluna) => {
                    const tarefasDaColuna = aplicarOrdenacao(
                      filtrarPorAba(tarefas)
                        .filter((t) => t.status === coluna.id)
                        .filter(atendeTermoBusca)
                    );
                    const ColunaIcone = coluna.icone;
                    const ehAlvoDrop = colunaAlvoDrag === coluna.id;

                    return (
                      <div
                        key={coluna.id}
                        onDragOver={(e) => handleDragOverColuna(e, coluna.id)}
                        onDragLeave={handleDragLeaveColuna}
                        onDrop={(e) => handleDropColuna(e, coluna.id)}
                        className={`rounded-2xl border  flex flex-col transition-colors duration-300 overflow-hidden ${
                          ehAlvoDrop
                            ? ehDark
                              ? 'ring-2 ring-(--accent) border-(--border) bg-(--surface-muted) scale-[1.01]'
                              : 'ring-2 ring-(--accent) border-(--border) bg-(--surface-muted) scale-[1.01]'
                            : ehDark
                            ? `${coluna.fundoColunaDark} ${coluna.bordaDark} `
                            : `${coluna.fundoColunaClaro} ${coluna.bordaClaro} `
                        }`}
                      >
                        {/* Cabeçalho da Coluna */}
                        <div className={`p-4 border-b flex items-center justify-between gap-2  ${
                          ehDark ? `${coluna.corHeaderDark} border-(--border)` : `${coluna.corHeaderClaro} border-(--border)`
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <ColunaIcone className={`w-4 h-4 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`} />
                            <h3 className={`font-bold text-sm sm:text-base ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
                              {coluna.titulo}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[13px] font-bold border ${
                              ehDark ? coluna.badgeDark : coluna.badgeClaro
                            }`}>
                              {tarefasDaColuna.length}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNovoCadastro(coluna.id)}
                            title={`Adicionar tarefa em ${coluna.titulo}`}
                            className={"ui-button ui-icon " + (`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                              ehDark
                                ? 'hover:bg-(--surface) text-(--ink) hover:text-(--ink)'
                                : 'hover:bg-(--surface-muted) text-(--muted) hover:text-(--muted)'
                            }`)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Corpo da Coluna */}
                        <div className="p-3.5 space-y-3 min-h-[180px] max-h-[620px] overflow-y-auto scrollbar-thin">
                          {tarefasDaColuna.length === 0 ? (
                            <div className={`p-6 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-2 transition-colors ${
                              ehAlvoDrop
                                ? ehDark ? 'border-(--border) text-(--ink) bg-(--surface-muted)' : 'border-(--border) text-(--muted) bg-(--surface-muted)'
                                : ehDark
                                ? 'border-(--border) text-(--muted) bg-(--surface)'
                                : 'border-(--border) text-(--muted) bg-(--surface-muted)'
                            }`}>
                              <p className="text-[13px] font-medium">
                                {ehAlvoDrop ? `Solte aqui para mover para ${coluna.titulo}` : `Nenhuma tarefa ${coluna.titulo.toLowerCase()}`}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleNovoCadastro(coluna.id)}
                                className={"ui-button " + (`text-[13px] font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
                                  ehDark ? 'text-(--muted) hover:text-(--ink)' : 'text-(--muted) hover:text-(--muted)'
                                }`)}
                              >
                                + Adicionar tarefa
                              </button>
                            </div>
                          ) : (
                            tarefasDaColuna.map((tarefa, idx) => {
                              const { hora } = parseTarefaNome(tarefa.nome);
                              const alerta = verificarPrazoInteligente(tarefa.data_termi, tarefa.status, hora);
                              const concluida = tarefa.status === 'concluido';
                              const sendoArrastada = tarefaArrastada?.id === tarefa.id;

                              return (
                                <div
                                  key={`kanban-${tarefa.id}`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, tarefa)}
                                  onDragEnd={handleDragEnd}
                                  title="Arraste para outra coluna para mudar o status"
                                  className={`rounded-2xl p-4 transition-colors text-left flex flex-col justify-between gap-3 border    cursor-grab active:cursor-grabbing ${
                                    sendoArrastada ? 'opacity-40 scale-95 ring-2 ring-(--accent)' : ''
                                  } ${
                                    ehDark
                                      ? 'bg-(--surface) hover:bg-(--surface) border-(--border) hover:border-(--border) text-(--ink) '
                                      : 'bg-(--surface) hover:bg-(--surface-muted) border-(--border) hover:border-(--border) text-(--ink) '
                                  }`}
                                  style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                  {/* Topo do Card */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <GripVertical className={`w-4 h-4 mt-0.5 shrink-0 opacity-40 hover:opacity-90 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`} />
                                      <button aria-pressed={concluida}
                                        type="button"
                                        onClick={() => alternarConclusaoRapida(tarefa)}
                                        title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                        className={"ui-button ui-check " + (`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                          concluida
                                            ? 'bg-emerald-500 border-emerald-500 text-(--ink) '
                                            : ehDark
                                            ? 'border-(--border) hover:border-emerald-400 hover:bg-emerald-500/10'
                                            : 'border-(--border) hover:border-emerald-500 hover:bg-emerald-50'
                                        }`)}
                                      >
                                        {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>

                                      {renderIdentificacaoTarefa(tarefa, concluida)}
                                    </div>

                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setTarefaPomodoroAtiva(tarefa)}
                                        title=" Iniciar Foco Pomodoro nesta tarefa"
                                        className={"ui-button ui-icon ui-warning " + (`p-1 rounded-md transition-colors cursor-pointer ${
                                          tarefaPomodoroAtiva?.id === tarefa.id
                                            ? 'text-rose-400 bg-rose-500/20'
                                            : ehDark ? 'text-amber-300/70 hover:text-rose-300 hover:bg-rose-500/15' : 'text-(--muted) hover:text-rose-600 hover:bg-rose-50'
                                        }`)}
                                      >
                                        <Flame className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEditar(tarefa)}
                                        title="Editar tarefa"
                                        className={"ui-button ui-icon " + (`p-1 rounded-md transition-colors cursor-pointer ${
                                          ehDark ? 'text-(--muted) hover:text-(--ink) hover:bg-(--surface)' : 'text-(--muted) hover:text-(--muted) hover:bg-(--surface-muted)'
                                        }`)}
                                      >
                                        <SquarePen className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                                        title="Excluir tarefa"
                                        className={"ui-button ui-icon ui-danger " + (`p-1 rounded-md transition-colors cursor-pointer ${
                                          ehDark ? 'text-rose-400/80 hover:text-rose-200 hover:bg-rose-500/20' : 'text-(--muted) hover:text-rose-600 hover:bg-rose-50'
                                        }`)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Meio: Datas com alerta inteligente */}
                                  <div className={`text-[13px] flex flex-wrap items-center gap-2 pt-1 border-t ${
                                    ehDark ? 'border-(--border) text-(--muted)' : 'border-(--border) text-(--muted)'
                                  }`}>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span>Até {formatarData(tarefa.data_termi)}{hora ? ` às ${hora}` : ''}</span>
                                    </div>
                                    {alerta === 'atrasada' && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-bold ${
                                        ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                      }`}>
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        Atrasada
                                      </span>
                                    )}
                                    {alerta === 'hoje' && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-bold ${
                                        ehDark ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}>
                                        <Clock className="w-2.5 h-2.5" />
                                        {hora ? `Hoje às ${hora}` : 'Hoje'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Rodapé: Ações rápidas de movimentação entre colunas */}
                                  <div className={`flex items-center justify-between gap-2 pt-2 border-t border-dashed ${
                                    ehDark ? 'border-(--border)' : 'border-(--border)'
                                  }`}>
                                    {coluna.id === 'pendente' && (
                                      <button
                                        type="button"
                                        onClick={() => moverStatus(tarefa, 'em_andamento')}
                                        className={"ui-button " + (`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer active:scale-95 ${
                                          ehDark
                                            ? 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--ink) border border-(--border)'
                                            : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border border-(--border)'
                                        }`)}
                                      >
                                        <span>Iniciar</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {coluna.id === 'em_andamento' && (
                                      <div className="flex items-center gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => moverStatus(tarefa, 'pendente')}
                                          title="Voltar para Pendente"
                                          className={"ui-button " + (`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer active:scale-95 ${
                                            ehDark
                                              ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) border border-(--border)'
                                              : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border border-(--border)'
                                          }`)}
                                        >
                                          <ArrowLeft className="w-3 h-3" />
                                          <span>Voltar</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moverStatus(tarefa, 'concluido')}
                                          title="Concluir tarefa"
                                          className={"ui-button ui-success " + (`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer active:scale-95 ${
                                            ehDark
                                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-(--accent) border border-emerald-500/40'
                                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                          }`)}
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Concluir</span>
                                        </button>
                                      </div>
                                    )}

                                    {coluna.id === 'concluido' && (
                                      <button
                                        type="button"
                                        onClick={() => moverStatus(tarefa, 'em_andamento')}
                                        className={"ui-button " + (`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[13px] font-medium transition-colors cursor-pointer active:scale-95 ${
                                          ehDark
                                            ? 'bg-(--surface) hover:bg-(--surface) text-(--muted) hover:text-(--ink) border border-(--border)'
                                            : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border border-(--border)'
                                        }`)}
                                      >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Reabrir tarefa</span>
                                      </button>
                                    )}
                                  </div>

                                </div>
                              );
                            })
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ========================================================================= */
                /* 7. MODO TABELA / LISTA (DESKTOP E MOBILE)                                  */
                /* ========================================================================= */
                <>
                  {/* Visualização em Cards para Smartphones (< md) */}
                  <div className="task-cards grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 w-full">
                    {tarefasFiltradasTabela.map((tarefa, index) => {
                      const { hora } = parseTarefaNome(tarefa.nome);
                      const alerta = verificarPrazoInteligente(tarefa.data_termi, tarefa.status, hora);
                      const concluida = tarefa.status === 'concluido';

                      return (
                        <div
                          key={`card-${tarefa.id}`}
                          className={`rounded-2xl p-4  transition-colors text-left flex flex-col justify-between gap-3 border   ${
                            ehDark
                              ? 'bg-(--surface) hover:bg-(--surface) border-(--border) text-(--ink)  '
                              : 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--ink) '
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Topo do Card */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button aria-pressed={concluida}
                                type="button"
                                onClick={() => alternarConclusaoRapida(tarefa)}
                                title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                className={"ui-button ui-check " + (`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                  concluida
                                    ? 'bg-emerald-500 border-emerald-500 text-(--ink) '
                                    : ehDark
                                    ? 'border-(--border) hover:border-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-(--border) hover:border-emerald-500 hover:bg-emerald-50'
                                }`)}
                              >
                                {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {renderIdentificacaoTarefa(tarefa, concluida)}
                            </div>

                            <button data-status={tarefa.status}
                              type="button"
                              onClick={() => alternarProximoStatus(tarefa)}
                              title="Clique para alternar o status"
                              className={"ui-button " + (`shrink-0 text-[13px] px-2.5 py-1 rounded-full font-semibold transition-colors active:scale-95 cursor-pointer ${
                                tarefa.status === 'concluido'
                                  ? ehDark ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-green-100 text-green-800 border border-green-300'
                                  : tarefa.status === 'em_andamento'
                                  ? ehDark ? 'bg-(--surface-muted) text-(--ink) border border-(--border)' : 'bg-(--surface-muted) text-(--muted) border border-(--border)'
                                  : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`)}
                            >
                              {rotuloStatus[tarefa.status] || tarefa.status}
                            </button>
                          </div>

                          {/* Datas com Alerta Inteligente e Horário */}
                          <div className={`text-[13px] space-y-1.5 pt-2 border-t ${
                            ehDark ? 'border-(--border) text-(--muted)' : 'border-(--border) text-(--muted)'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span>Início:</span>
                              <span className="font-medium text-right">{formatarData(tarefa.data_come)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                Término:
                                {alerta === 'atrasada' && (
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[13px] font-bold ${
                                    ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                  }`}>
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Atrasada
                                  </span>
                                )}
                                {alerta === 'hoje' && (
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[13px] font-bold ${
                                    ehDark ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    {hora ? `Hoje às ${hora}` : 'Hoje'}
                                  </span>
                                )}
                              </span>
                              <span className="font-medium text-right">
                                {formatarData(tarefa.data_termi)}{hora ? ` às ${hora}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Ações (Focar Pomodoro, Editar e Excluir) */}
                          <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
                            ehDark ? 'border-(--border)' : 'border-(--border)'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setTarefaPomodoroAtiva(tarefa)}
                              className={"ui-button ui-warning " + (`flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark
                                  ? 'bg-amber-900/30 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`)}
                            >
                              <Flame className="w-3.5 h-3.5 text-rose-400" />
                              Focar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditar(tarefa)}
                              className={"ui-button " + (`flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark
                                  ? 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--ink) border border-(--border)'
                                  : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border border-(--border)'
                              }`)}
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                              className={"ui-button ui-danger " + (`flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark
                                  ? 'bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-500/30'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabela de Tarefas para Computadores e Telas Maiores (>= md) */}
                  <div className="hidden lg:block w-full overflow-x-auto rounded-2xl border border-transparent">
                    <table className="w-full border-collapse text-left">

                      {/* Cabeçalho da Tabela */}
                      <thead>
                        <tr className={`border-b text-[13px] sm:text-sm font-semibold   ${
                          ehDark
                            ? 'border-(--border) text-(--muted) bg-(--surface)'
                            : 'border-(--border) text-(--muted) bg-(--surface-muted)'
                        }`}>
                          <th className="py-3 px-4 font-bold">Título</th>
                          <th className="py-3 px-4 font-bold text-center sm:text-left">Início</th>
                          <th className="py-3 px-4 font-bold text-center sm:text-left">Término</th>
                          <th className="py-3 px-4 font-bold text-center">Status</th>
                          <th className="py-3 px-4 font-bold text-right pr-4">Ações</th>
                        </tr>
                      </thead>

                      {/* Corpo da Tabela */}
                      <tbody className="divide-y divide-transparent text-sm">
                        {tarefasFiltradasTabela.map((tarefa, index) => {
                          const { hora } = parseTarefaNome(tarefa.nome);
                          const alerta = verificarPrazoInteligente(tarefa.data_termi, tarefa.status, hora);
                          const concluida = tarefa.status === 'concluido';

                          return (
                            <tr
                              key={tarefa.id}
                              className={`transition-colors duration-200  ${
                                ehDark
                                  ? 'hover:bg-(--surface-muted) text-(--ink)'
                                  : 'hover:bg-(--surface-muted) text-(--ink)'
                              }`}
                              style={{ animationDelay: `${index * 40}ms` }}
                            >
                              {/* Coluna: Nome/Título com Checkbox Circular e Tags/Prioridade/Etapas */}
                              <td className="py-4 px-4 max-w-xs sm:max-w-md">
                                <div className="flex items-start gap-3">
                                  <button aria-pressed={concluida}
                                    type="button"
                                    onClick={() => alternarConclusaoRapida(tarefa)}
                                    title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                    className={"ui-button ui-check " + (`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                      concluida
                                        ? 'bg-emerald-500 border-emerald-500 text-(--ink) '
                                        : ehDark
                                        ? 'border-(--border) hover:border-emerald-400 hover:bg-emerald-500/10'
                                        : 'border-(--border) hover:border-emerald-500 hover:bg-emerald-50'
                                    }`)}
                                  >
                                    {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>

                                  {renderIdentificacaoTarefa(tarefa, concluida)}
                                </div>
                              </td>

                              {/* Coluna: Data de Início */}
                              <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                                {formatarData(tarefa.data_come)}
                              </td>

                              {/* Coluna: Data de Término com Horário e Alerta Inteligente */}
                              <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                                <div className="inline-flex items-center gap-2">
                                  <span className="flex items-center gap-1.5 font-medium">
                                    {formatarData(tarefa.data_termi)}
                                    {hora && (
                                      <span className={`inline-flex items-center gap-1 text-[13px] px-2 py-0.5 rounded-full font-medium ${
                                        ehDark ? 'bg-(--surface) text-(--ink)' : 'bg-(--surface-muted) text-(--muted)'
                                      }`}>
                                        <Clock className="w-3 h-3 text-(--muted)" />
                                        {hora}
                                      </span>
                                    )}
                                  </span>
                                  {alerta === 'atrasada' && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-bold ${
                                      ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                    }`}>
                                      <AlertCircle className="w-3 h-3" />
                                      Atrasada
                                    </span>
                                  )}
                                  {alerta === 'hoje' && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-bold ${
                                      ehDark ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                      <Clock className="w-3 h-3" />
                                      {hora ? `Hoje às ${hora}` : 'Hoje'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Coluna: Status */}
                              <td className="py-4 px-4 text-center">
                                <button data-status={tarefa.status}
                                  type="button"
                                  onClick={() => alternarProximoStatus(tarefa)}
                                  title="Clique para alternar o status"
                                  className={"ui-button " + (`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-medium text-[13px] sm:text-sm cursor-pointer transition-colors  active:scale-95 ${
                                    tarefa.status === 'concluido'
                                      ? ehDark ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                      : tarefa.status === 'em_andamento'
                                      ? ehDark ? 'bg-(--surface-muted) text-(--ink) border border-(--border) hover:bg-(--surface-muted) ' : 'bg-(--surface-muted) text-(--muted) border border-(--border) hover:bg-(--surface-muted)'
                                      : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  }`)}
                                >
                                  {rotuloStatus[tarefa.status] || tarefa.status}
                                </button>
                              </td>

                              {/* Coluna: Ações */}
                              <td className="py-4 px-4 text-right pr-4 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTarefaPomodoroAtiva(tarefa)}
                                    title=" Iniciar Foco Pomodoro nesta tarefa"
                                    className={"ui-button ui-icon ui-warning " + (`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      tarefaPomodoroAtiva?.id === tarefa.id
                                        ? 'text-rose-400 bg-rose-500/20'
                                        : ehDark
                                        ? 'text-amber-300 hover:text-rose-300 hover:bg-rose-500/20'
                                        : 'text-amber-600 hover:text-rose-600 hover:bg-rose-50'
                                    }`)}
                                  >
                                    <Flame className="w-5 h-5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleEditar(tarefa)}
                                    title="Editar tarefa"
                                    className={"ui-button ui-icon " + (`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      ehDark
                                        ? 'text-(--muted) hover:text-(--ink) hover:bg-(--surface-muted)'
                                        : 'text-(--muted) hover:text-(--muted) hover:bg-(--surface-muted)'
                                    }`)}
                                  >
                                    <SquarePen className="w-5 h-5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                                    title="Excluir tarefa"
                                    className={"ui-button ui-icon ui-danger " + (`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      ehDark
                                        ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/20'
                                        : 'text-(--muted) hover:text-rose-600 hover:bg-rose-50'
                                    }`)}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                    </table>
                  </div>
                </>
              )}
            </>
          )}

        </section>

      </div>

      {/* Modal de Criação / Edição de Tarefa */}
      {modalAberto && (
        <ModalTarefa
          key={tarefaEmEdicao?.id || statusInicialParaNova || 'nova'}
          tarefaParaEditar={tarefaEmEdicao}
          statusInicial={statusInicialParaNova}
          aoSalvar={handleSalvarTarefa}
          aoFechar={() => {
            setModalAberto(false);
            setTarefaEmEdicao(null);
            setStatusInicialParaNova('pendente');
          }}
        />
      )}

      {/*  Modal de Estatísticas e Gráficos (Dashboard Analytics) */}
      {modalEstatisticasAberto && (
        <ModalEstatisticas
          tarefas={tarefas}
          aoFechar={() => setModalEstatisticasAberto(false)}
        />
      )}

      {/*  Widget Flutuante do Timer Pomodoro Integrado */}
      {tarefaPomodoroAtiva && (
        <WidgetPomodoro
          tarefaAtiva={tarefaPomodoroAtiva}
          aoFechar={() => setTarefaPomodoroAtiva(null)}
          aoConcluirTarefa={(t) => {
            if (t.status !== 'concluido') {
              alternarConclusaoRapida(t);
            }
          }}
        />
      )}

    </div>
  );
}
