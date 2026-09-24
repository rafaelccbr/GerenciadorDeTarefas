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
  Sparkles,
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
  Zap,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../context/ThemeContext.jsx';
import { SeletorTema } from './SeletorTema.jsx';
import { 
  listarTarefasApi, 
  atualizarStatusApi, 
  excluirTarefaApi, 
  criarTarefaApi, 
  atualizarTarefaApi 
} from '../services/api.js';
import { ModalTarefa } from './ModalTarefa.jsx';
import { 
  parseTarefaNome, 
  montarTarefaNome,
  PRIORIDADES, 
  obterCorTag,
  verificarPrazoInteligente,
  parseQuickAdd,
  calcularProximaData,
  calcularProgressoSubtarefas
} from '../utils/tarefaParser.js';

/**
 * ============================================================================
 * TELA PRINCIPAL (DASHBOARD COMPLETO ESTILO TODOIST)
 * ============================================================================
 * Recursos Todoist:
 * 1. 📅 Visões de Foco: "Hoje", "Próximos 7 Dias" e filtros por status
 * 2. ⚡ Quick Add: Criação em 1 linha com linguagem natural (@hora, #tags, p1, amanhã)
 * 3. 🎯 Gamificação: Confetes ao concluir tarefa e celebração aos 100% de produtividade
 * 4. 🔀 Ordenação Inteligente: Por Prioridade, Prazo, Alfabética e Recentes
 * 5. ☑️ Subtarefas / Mini-Checklist interativo com progresso
 * 6. 🔁 Tarefas Recorrentes (Rotinas automáticas com reagendamento)
 * 7. 📄 Exportação de Relatórios: PDF formatado e CSV para Excel
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

  // Tarefas com checklist expandido (IDs)
  const [etapasExpandidas, setEtapasExpandidas] = useState(new Set());

  // Controle do Modal de Criação/Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
  const [statusInicialParaNova, setStatusInicialParaNova] = useState('pendente');

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

      if (e.key === 'Escape') {
        if (modalAberto) {
          setModalAberto(false);
          setTarefaEmEdicao(null);
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
  }, [modalAberto, termoBusca]);

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
        colors: ['#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
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
    const { recorrencia, subtarefas, tituloLimpo, prioridade, hora, tags } = parseTarefaNome(tarefa.nome);
    if (recorrencia && recorrencia !== 'never') {
      const proximaData = calcularProximaData(tarefa.data_termi, recorrencia);
      const subtarefasResetadas = subtarefas.map(s => ({ ...s, feito: false }));
      const novoNome = montarTarefaNome({
        titulo: tituloLimpo,
        prioridade,
        hora,
        tags,
        recorrencia,
        subtarefas: subtarefasResetadas
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

  // Exportar CSV
  const exportarCsv = (listaParaExportar) => {
    setMenuExportarAberto(false);
    if (!listaParaExportar || listaParaExportar.length === 0) {
      alert('Não há tarefas para exportar com os filtros atuais.');
      return;
    }

    try {
      const cabecalho = ['Título', 'Início', 'Término', 'Horário', 'Status', 'Prioridade', 'Tags', 'Recorrência', 'Etapas'];
      const linhas = listaParaExportar.map((t) => {
        const { tituloLimpo, prioridade, hora, tags, recorrencia, subtarefas } = parseTarefaNome(t.nome);
        const prog = calcularProgressoSubtarefas(subtarefas);
        const etapasStr = subtarefas.length > 0 ? `${prog.feitas}/${prog.total}` : 'Nenhuma';
        return [
          `"${(tituloLimpo || '').replace(/"/g, '""')}"`,
          formatarData(t.data_come),
          formatarData(t.data_termi),
          hora || '-',
          rotuloStatus[t.status] || t.status,
          (prioridade || 'p4').toUpperCase(),
          `"${(tags || []).join(', ')}"`,
          recorrencia && recorrencia !== 'never' ? recorrencia : 'Não',
          `"${etapasStr}"`,
        ].join(',');
      });

      const conteudoCsv = '\uFEFF' + [cabecalho.join(','), ...linhas].join('\n');
      const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tarefas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 300);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      alert(`Falha ao exportar CSV: ${e.message}`);
    }
  };

  // Exportar PDF
  const exportarPdf = (listaParaExportar) => {
    setMenuExportarAberto(false);
    if (!listaParaExportar || listaParaExportar.length === 0) {
      alert('Não há tarefas para exportar com os filtros atuais.');
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(88, 28, 135);
      doc.text('Relatório de Tarefas', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      const dataHoje = new Date().toLocaleDateString('pt-BR');
      doc.text(`Usuário: ${usuario?.nome || 'Usuário'} | Gerado em: ${dataHoje}`, 14, 28);
      doc.text(`Total de tarefas: ${listaParaExportar.length} | Produtividade: ${porcentagem}%`, 14, 34);

      const head = [['Título', 'Início', 'Término', 'Status', 'Prioridade', 'Tags']];
      const body = listaParaExportar.map((t) => {
        const { tituloLimpo, prioridade, hora, tags } = parseTarefaNome(t.nome);
        return [
          tituloLimpo || 'Sem título',
          formatarData(t.data_come),
          formatarData(t.data_termi) + (hora ? ` às ${hora}` : ''),
          rotuloStatus[t.status] || t.status,
          (prioridade || 'P4').toUpperCase(),
          (tags || []).map((tg) => `#${tg}`).join(' '),
        ];
      });

      const autoTableFunc = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc.autoTable);
      if (typeof autoTableFunc === 'function') {
        autoTableFunc(doc, {
          startY: 40,
          head,
          body,
          headStyles: { 
            fillColor: [126, 34, 206],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 245, 255]
          },
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2.5 },
        });
      }

      doc.save(`relatorio_tarefas_${new Date().toISOString().split('T')[0]}.pdf`);
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
  const hojeStr = new Date().toISOString().split('T')[0];
  const em7Dias = new Date();
  em7Dias.setDate(em7Dias.getDate() + 7);
  const em7DiasStr = em7Dias.toISOString().split('T')[0];

  const contagemHoje = tarefas.filter((t) => {
    const dataTermi = t.data_termi?.split('T')[0];
    return dataTermi === hojeStr || (t.status !== 'concluido' && dataTermi < hojeStr);
  }).length;

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

  // Renderizador inteligente de Título + Prioridade + Tags + Recorrência + Subtarefas
  const renderIdentificacaoTarefa = (tarefa, concluida) => {
    const { tituloLimpo, prioridade, tags, recorrencia, subtarefas } = parseTarefaNome(tarefa.nome);
    const prioConfig = PRIORIDADES[prioridade] || PRIORIDADES.p4;
    const progEtapas = calcularProgressoSubtarefas(subtarefas);
    const temEtapas = subtarefas.length > 0;
    const expandida = etapasExpandidas.has(tarefa.id);

    return (
      <div className="flex flex-col gap-1.5 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`break-words transition-all duration-200 ${
            concluida
              ? ehDark ? 'line-through text-purple-300/50' : 'line-through text-gray-400'
              : ehDark ? 'text-white font-semibold' : 'text-gray-900 font-medium'
          }`}>
            {tituloLimpo}
          </span>

          {/* Badge de Prioridade */}
          {prioridade !== 'p4' && (
            <span 
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
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
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${
                ehDark 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                  : 'bg-purple-100 text-purple-800 border-purple-200'
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                progEtapas.porcentagem === 100
                  ? ehDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : ehDark ? 'bg-white/10 hover:bg-white/15 text-purple-200 border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              title="Clique para ver ou ocultar etapas"
            >
              <ListChecks className="w-3 h-3 text-purple-400" />
              <span>{progEtapas.feitas}/{progEtapas.total} etapas</span>
              {expandida ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}
        </div>

        {/* Tags / Categorias */}
        {tags.length > 0 && (
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
                className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border transition-all hover:scale-105 cursor-pointer ${obterCorTag(tag, ehDark)}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Lista Expandida de Subtarefas com Checkbox Direto */}
        {temEtapas && expandida && (
          <div className={`mt-2 p-2.5 rounded-xl border space-y-1.5 animate-slide-up ${
            ehDark ? 'bg-white/[0.04] border-white/10' : 'bg-purple-50/50 border-purple-100'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={`font-semibold ${ehDark ? 'text-purple-300/80' : 'text-gray-600'}`}>
                Progresso das etapas:
              </span>
              <span className={`font-bold ${progEtapas.porcentagem === 100 ? 'text-emerald-400' : ehDark ? 'text-purple-200' : 'text-purple-800'}`}>
                {progEtapas.porcentagem}%
              </span>
            </div>

            <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${ehDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  progEtapas.porcentagem === 100 ? 'bg-emerald-400' : 'bg-purple-500'
                }`}
                style={{ width: `${progEtapas.porcentagem}%` }}
              />
            </div>

            <div className="space-y-1">
              {subtarefas.map((etapa, idx) => (
                <div 
                  key={idx}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-all ${
                    ehDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternarSubtarefaDireta(tarefa, idx)}
                    className="cursor-pointer text-purple-400 hover:scale-110 transition-transform shrink-0"
                  >
                    {etapa.feito ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                  <span className={`flex-1 break-words ${
                    etapa.feito 
                      ? ehDark ? 'line-through text-purple-300/40' : 'line-through text-gray-400'
                      : ehDark ? 'text-white' : 'text-gray-800'
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
      corHeaderClaro: 'from-amber-500/10 via-amber-500/5 to-transparent',
      corHeaderDark: 'from-amber-500/15 via-amber-500/5 to-transparent',
      bordaClaro: 'border-amber-200/80',
      bordaDark: 'border-amber-500/20',
      fundoColunaClaro: 'bg-amber-500/[0.02]',
      fundoColunaDark: 'bg-white/[0.015]',
    },
    {
      id: 'em_andamento',
      titulo: 'Em andamento',
      icone: PlayCircle,
      badgeClaro: 'bg-purple-100 text-purple-800 border-purple-300',
      badgeDark: 'bg-purple-500/25 text-purple-200 border-purple-500/40',
      corHeaderClaro: 'from-purple-500/10 via-purple-500/5 to-transparent',
      corHeaderDark: 'from-purple-500/15 via-purple-500/5 to-transparent',
      bordaClaro: 'border-purple-200/80',
      bordaDark: 'border-purple-500/20',
      fundoColunaClaro: 'bg-purple-500/[0.02]',
      fundoColunaDark: 'bg-white/[0.015]',
    },
    {
      id: 'concluido',
      titulo: 'Concluído',
      icone: CheckCircle2,
      badgeClaro: 'bg-green-100 text-green-800 border-green-300',
      badgeDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      corHeaderClaro: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      corHeaderDark: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      bordaClaro: 'border-emerald-200/80',
      bordaDark: 'border-emerald-500/20',
      fundoColunaClaro: 'bg-emerald-500/[0.02]',
      fundoColunaDark: 'bg-white/[0.015]',
    },
  ];

  return (
    <div className="min-h-screen w-full p-4 sm:p-8 flex flex-col items-center transition-colors duration-500">
      
      {/* Container Principal */}
      <div className="w-full max-w-6xl flex flex-col space-y-4">
        
        {/* Barra Superior de Ações com Auto-Encaixe Responsivo */}
        <div className="relative z-50 flex items-center justify-between gap-2.5 sm:gap-3 w-full flex-wrap animate-slide-up">
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Botão Sair */}
            <button
              onClick={aoDeslogar}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-rose-500/40 hover:bg-rose-500/55 border border-rose-400/50 hover:border-rose-300/70 backdrop-blur-md text-white font-bold rounded-full shadow-[0_4px_15px_rgba(244,63,94,0.25)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-200 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-300" />
              Sair
            </button>

            {/* Botão Cadastrar */}
            <button
              onClick={() => handleNovoCadastro('pendente')}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-emerald-500/40 hover:bg-emerald-500/55 border border-emerald-300/60 hover:border-emerald-200/80 backdrop-blur-md text-white font-bold rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm"
              title="Cadastrar nova tarefa (Atalho: N)"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              Cadastrar
              <span className="hidden sm:inline-block ml-0.5 px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono opacity-80">N</span>
            </button>

            {/* Menu de Exportação (CSV e PDF) */}
            <div className="relative" ref={exportarRef}>
              <button
                type="button"
                onClick={() => setMenuExportarAberto(!menuExportarAberto)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 border backdrop-blur-md text-white font-bold rounded-full transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm ${
                  menuExportarAberto
                    ? 'bg-purple-600/70 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'bg-purple-500/40 hover:bg-purple-500/60 border border-purple-400/50 hover:border-purple-300/70 shadow-[0_4px_15px_rgba(168,85,247,0.25)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)]'
                }`}
                title="Exportar tarefas para Excel ou PDF"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-300" />
                <span>Exportar</span>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-200 transition-transform duration-300 ${menuExportarAberto ? 'rotate-180 text-white' : ''}`} />
              </button>

              {menuExportarAberto && (
                <div className={`absolute left-0 top-full mt-2.5 w-60 rounded-2xl p-2 shadow-2xl border backdrop-blur-2xl z-50 animate-fade-in ${
                  ehDark
                    ? 'bg-[#150a24]/98 border-purple-500/40 text-purple-100 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(168,85,247,0.25)] ring-1 ring-white/10'
                    : 'bg-white/98 border-purple-200 text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(147,51,234,0.15)] ring-1 ring-black/5'
                }`}>
                  <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b mb-1.5 flex items-center justify-between ${
                    ehDark ? 'text-purple-300/70 border-white/10' : 'text-purple-700/80 border-purple-100'
                  }`}>
                    <span>Exportar Relatório</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      ehDark ? 'bg-white/10 text-purple-200' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {tarefasFiltradasTabela.length} {tarefasFiltradasTabela.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportarCsv(tarefasFiltradasTabela)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer active:scale-95 ${
                      ehDark 
                        ? 'hover:bg-purple-500/20 text-purple-100 hover:text-white' 
                        : 'hover:bg-purple-50 text-gray-700 hover:text-purple-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${ehDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Planilha Excel (CSV)</div>
                      <div className={`text-[10px] ${ehDark ? 'text-purple-300/50' : 'text-gray-400'}`}>Arquivo formatado para Excel</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportarPdf(tarefasFiltradasTabela)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer active:scale-95 ${
                      ehDark 
                        ? 'hover:bg-purple-500/20 text-purple-100 hover:text-white' 
                        : 'hover:bg-purple-50 text-gray-700 hover:text-purple-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${ehDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Relatório em PDF</div>
                      <div className={`text-[10px] ${ehDark ? 'text-purple-300/50' : 'text-gray-400'}`}>Documento para impressão</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seletor de Tema (Violeta / Dark) */}
            <SeletorTema />

            {/* Gerenciamento de Conta: "Olá, (nome)" */}
            {usuario?.nome && (
              <button
                type="button"
                onClick={aoAbrirConta}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer group text-xs sm:text-sm ${
                  ehDark
                    ? 'bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-purple-200 hover:text-white'
                }`}
                title="Clique para gerenciar sua conta"
              >
                <span className="font-medium truncate max-w-[140px] sm:max-w-none">
                  Olá, <strong className="text-white font-bold">{usuario.nome}</strong>
                </span>
                <Settings className={`w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-45 transition-transform duration-300 shrink-0 ${
                  ehDark ? 'text-purple-300 group-hover:text-white' : 'text-purple-200 group-hover:text-white'
                }`} />
              </button>
            )}
          </div>

        </div>

        {/* Card Central */}
        <div className={`w-full backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 min-h-[480px] sm:min-h-[520px] flex flex-col transition-all duration-500 animate-slide-up animate-delay-150 ${
          ehDark
            ? 'bg-gradient-to-b from-white/[0.08] via-[#140b20]/90 to-[#0a0610]/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-purple-100'
            : 'bg-white/95 border border-white/60 shadow-[0_16px_50px_rgba(0,0,0,0.25)] text-gray-800'
        }`}>
          
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
          <form onSubmit={handleQuickAdd} className="mb-4">
            <div className={`relative flex items-center rounded-2xl border transition-all shadow-sm ${
              ehDark 
                ? 'bg-white/[0.06] hover:bg-white/[0.09] focus-within:bg-white/[0.1] border-white/15 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/30' 
                : 'bg-white hover:bg-purple-50/20 focus-within:bg-white border-purple-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/30'
            }`}>
              <div className="pl-4 pr-2 text-purple-400">
                <Zap className="w-4 h-4 animate-pulse" />
              </div>
              <input
                type="text"
                value={quickAddTexto}
                onChange={(e) => setQuickAddTexto(e.target.value)}
                placeholder="⚡ Quick Add: 'Estudar Cálculo amanhã @15:00 #Faculdade p1' [Enter]"
                className={`w-full py-3 pr-24 bg-transparent text-xs sm:text-sm font-medium focus:outline-none ${
                  ehDark ? 'text-white placeholder-purple-200/40' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={!quickAddTexto.trim() || criandoQuick}
                className="absolute right-2 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-sm"
              >
                {criandoQuick ? 'Criando...' : 'Adicionar'}
              </button>
            </div>
          </form>

          {/* Estado de Carregando */}
          {carregando ? (
            <div className={`flex-1 flex flex-col items-center justify-center py-20 ${ehDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              <div className={`loading-dots mb-4 ${ehDark ? 'text-purple-400' : 'text-purple-600'}`}>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <p className="font-medium text-sm sm:text-base animate-slide-up animate-delay-300">Carregando suas tarefas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            /* Estado Vazio Total */
            <div className={`flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 ${ehDark ? 'text-zinc-400' : 'text-gray-400'}`}>
              <p className={`text-lg sm:text-xl font-semibold mb-2 ${ehDark ? 'text-zinc-200' : 'text-gray-600'}`}>Nenhuma tarefa encontrada</p>
              <p className={`text-xs sm:text-sm max-w-sm mb-6 ${ehDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Você ainda não tem tarefas cadastradas. Use a barra rápida acima ou clique em "Cadastrar"!
              </p>
              <button
                onClick={() => handleNovoCadastro('pendente')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-full shadow-lg shadow-emerald-600/30 transition-all cursor-pointer text-sm"
              >
                Criar primeira tarefa
              </button>
            </div>
          ) : (
            <>
              {/* 2. Widget de Produtividade (Estilo Karma do Todoist) */}
              <div className={`w-full rounded-2xl p-4 sm:p-5 mb-5 border transition-all ${
                ehDark 
                  ? 'bg-white/[0.04] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                  : 'bg-purple-50/60 border-purple-100 shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      porcentagem === 100 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : ehDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold ${ehDark ? 'text-white' : 'text-gray-900'}`}>
                        {porcentagem === 100 ? '🎉 Parabéns! Todas as tarefas concluídas!' : 'Produtividade'}
                      </h4>
                      <p className={`text-xs ${ehDark ? 'text-purple-300/70' : 'text-gray-500'}`}>
                        {tarefasConcluidas} de {totalTarefas} tarefas concluídas
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm sm:text-base font-extrabold ${
                    porcentagem === 100 
                      ? 'text-emerald-400' 
                      : ehDark ? 'text-purple-200' : 'text-purple-700'
                  }`}>
                    {porcentagem}%
                  </span>
                </div>

                {/* Barra de Progresso Animada */}
                <div className={`w-full h-2 rounded-full overflow-hidden ${ehDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      porcentagem === 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                        : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400'
                    }`}
                    style={{ width: `${porcentagem}%` }}
                  />
                </div>
              </div>

              {/* 3. Barra de Busca e Ordenação */}
              <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
                
                {/* Campo de Pesquisa em Tempo Real */}
                <div className="relative flex-1 max-w-md">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    ehDark ? 'text-purple-300/50' : 'text-gray-400'
                  }`} />
                  <input
                    ref={inputBuscaRef}
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    placeholder="Buscar tarefas, #tags, @horários... (Pressione /)"
                    className={`w-full pl-10 pr-9 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all focus:outline-none focus:ring-2 ${
                      ehDark
                        ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.18] text-white placeholder-purple-200/40 border-white/15 focus:border-purple-400 focus:ring-purple-400/30'
                        : 'bg-white hover:bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 border-gray-200 focus:border-purple-400 focus:ring-purple-400/30 shadow-sm'
                    }`}
                  />
                  {termoBusca && (
                    <button
                      type="button"
                      onClick={() => setTermoBusca('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors cursor-pointer ${
                        ehDark ? 'text-purple-300/60 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Controles da Direita: Ordenação Inteligente + Modo Tabela / Quadro */}
                <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                  
                  {/* Seletor de Ordenação Inteligente */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className={`w-3.5 h-3.5 ${ehDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <select
                      value={ordenacao}
                      onChange={(e) => trocarOrdenacao(e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer focus:outline-none ${
                        ehDark
                          ? 'bg-white/10 hover:bg-white/15 border-white/15 text-purple-200 [&>option]:bg-[#140b20] [&>option]:text-white'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm'
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
                    ehDark ? 'bg-white/5 border-white/10' : 'bg-gray-100/90 border-gray-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => trocarModoVisualizacao('tabela')}
                      title="Visualização em Lista / Tabela"
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        modoVisualizacao === 'tabela'
                          ? ehDark
                            ? 'bg-purple-500/40 text-white shadow-sm border border-purple-400/50'
                            : 'bg-white text-purple-800 shadow-sm'
                          : ehDark
                          ? 'text-purple-300/60 hover:text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Tabela</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => trocarModoVisualizacao('kanban')}
                      title="Visualização em Quadro Kanban"
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        modoVisualizacao === 'kanban'
                          ? ehDark
                            ? 'bg-purple-500/40 text-white shadow-sm border border-purple-400/50'
                            : 'bg-white text-purple-800 shadow-sm'
                          : ehDark
                          ? 'text-purple-300/60 hover:text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
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
                  { id: 'hoje', label: '☀️ Hoje', contagem: contagemHoje },
                  { id: '7dias', label: '📆 Próximos 7 Dias', contagem: contagem7Dias },
                  { id: 'pendente', label: 'Pendentes', contagem: contagemPendentes },
                  { id: 'em_andamento', label: 'Em andamento', contagem: contagemEmAndamento },
                  { id: 'concluido', label: 'Concluídas', contagem: contagemConcluidas },
                ].map((aba) => {
                  const ativa = filtroStatus === aba.id;
                  return (
                    <button
                      key={aba.id}
                      type="button"
                      onClick={() => setFiltroStatus(aba.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                        ativa
                          ? ehDark
                            ? 'bg-purple-500/30 text-white border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                            : 'bg-purple-600 text-white shadow-sm'
                          : ehDark
                          ? 'bg-white/5 hover:bg-white/10 text-purple-200/70 hover:text-white border border-white/10'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200/60'
                      }`}
                    >
                      <span>{aba.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        ativa
                          ? ehDark ? 'bg-purple-400/30 text-white' : 'bg-purple-700 text-white'
                          : ehDark ? 'bg-white/10 text-purple-200/60' : 'bg-gray-200 text-gray-500'
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
                  <Search className={`w-8 h-8 mb-2 ${ehDark ? 'text-purple-300/40' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-sm sm:text-base ${ehDark ? 'text-white' : 'text-gray-800'}`}>
                    Nenhuma tarefa corresponde à busca ou filtro
                  </p>
                  <p className={`text-xs mt-1 ${ehDark ? 'text-purple-300/60' : 'text-gray-500'}`}>
                    Tente digitar outros termos ou selecione a aba "Todas".
                  </p>
                  <button
                    type="button"
                    onClick={() => { setTermoBusca(''); setFiltroStatus('todos'); }}
                    className={`mt-4 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                      ehDark ? 'bg-white/10 hover:bg-white/20 text-purple-200' : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                    }`}
                  >
                    Limpar busca e filtros
                  </button>
                </div>
              ) : modoVisualizacao === 'kanban' ? (
                /* ========================================================================= */
                /* 6. MODO QUADRO KANBAN (3 COLUNAS)                                         */
                /* ========================================================================= */
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5 items-start animate-fade-in">
                  {colunasKanban.map((coluna) => {
                    const tarefasDaColuna = aplicarOrdenacao(
                      filtrarPorAba(tarefas)
                        .filter((t) => t.status === coluna.id)
                        .filter(atendeTermoBusca)
                    );
                    const ColunaIcone = coluna.icone;

                    return (
                      <div
                        key={coluna.id}
                        className={`rounded-2xl border backdrop-blur-xl flex flex-col transition-all duration-300 overflow-hidden ${
                          ehDark 
                            ? `${coluna.fundoColunaDark} ${coluna.bordaDark} shadow-[0_4px_25px_rgba(0,0,0,0.25)]` 
                            : `${coluna.fundoColunaClaro} ${coluna.bordaClaro} shadow-sm`
                        }`}
                      >
                        {/* Cabeçalho da Coluna */}
                        <div className={`p-4 border-b flex items-center justify-between gap-2 bg-gradient-to-b ${
                          ehDark ? `${coluna.corHeaderDark} border-white/10` : `${coluna.corHeaderClaro} border-gray-200/80`
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <ColunaIcone className={`w-4 h-4 ${ehDark ? 'text-white' : 'text-gray-800'}`} />
                            <h3 className={`font-bold text-sm sm:text-base ${ehDark ? 'text-white' : 'text-gray-900'}`}>
                              {coluna.titulo}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              ehDark ? coluna.badgeDark : coluna.badgeClaro
                            }`}>
                              {tarefasDaColuna.length}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNovoCadastro(coluna.id)}
                            title={`Adicionar tarefa em ${coluna.titulo}`}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                              ehDark 
                                ? 'hover:bg-white/10 text-purple-200 hover:text-white' 
                                : 'hover:bg-gray-100 text-gray-600 hover:text-purple-700'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Corpo da Coluna */}
                        <div className="p-3.5 space-y-3 min-h-[160px] max-h-[620px] overflow-y-auto scrollbar-thin">
                          {tarefasDaColuna.length === 0 ? (
                            <div className={`p-6 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-2 ${
                              ehDark 
                                ? 'border-white/10 text-purple-300/40 bg-white/[0.01]' 
                                : 'border-gray-200 text-gray-400 bg-gray-50/50'
                            }`}>
                              <p className="text-xs font-medium">Nenhuma tarefa {coluna.titulo.toLowerCase()}</p>
                              <button
                                type="button"
                                onClick={() => handleNovoCadastro(coluna.id)}
                                className={`text-xs font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
                                  ehDark ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-purple-800'
                                }`}
                              >
                                + Adicionar tarefa
                              </button>
                            </div>
                          ) : (
                            tarefasDaColuna.map((tarefa, idx) => {
                              const { hora } = parseTarefaNome(tarefa.nome);
                              const alerta = verificarPrazoInteligente(tarefa.data_termi, tarefa.status, hora);
                              const concluida = tarefa.status === 'concluido';

                              return (
                                <div
                                  key={`kanban-${tarefa.id}`}
                                  className={`rounded-2xl p-4 transition-all text-left flex flex-col justify-between gap-3 border hover-lift shadow-sm animate-slide-up ${
                                    ehDark
                                      ? 'bg-white/[0.05] hover:bg-white/[0.08] border-white/10 hover:border-purple-400/40 text-purple-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                                      : 'bg-white hover:bg-purple-50/40 border-gray-200/80 hover:border-purple-300 text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
                                  }`}
                                  style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                  {/* Topo do Card */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => alternarConclusaoRapida(tarefa)}
                                        title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                          concluida
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                            : ehDark
                                            ? 'border-purple-300/40 hover:border-emerald-400 hover:bg-emerald-500/10'
                                            : 'border-gray-400 hover:border-emerald-500 hover:bg-emerald-50'
                                        }`}
                                      >
                                        {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>

                                      {renderIdentificacaoTarefa(tarefa, concluida)}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditar(tarefa)}
                                        title="Editar tarefa"
                                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                                          ehDark ? 'text-purple-300/70 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-purple-700 hover:bg-purple-50'
                                        }`}
                                      >
                                        <SquarePen className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                                        title="Excluir tarefa"
                                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                                          ehDark ? 'text-rose-400/80 hover:text-rose-200 hover:bg-rose-500/20' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                        }`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Meio: Datas com alerta inteligente */}
                                  <div className={`text-xs flex flex-wrap items-center gap-2 pt-1 border-t ${
                                    ehDark ? 'border-white/5 text-purple-300/75' : 'border-gray-100 text-gray-500'
                                  }`}>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span>Até {formatarData(tarefa.data_termi)}{hora ? ` às ${hora}` : ''}</span>
                                    </div>
                                    {alerta === 'atrasada' && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                      }`}>
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        Atrasada
                                      </span>
                                    )}
                                    {alerta === 'hoje' && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        ehDark ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}>
                                        <Clock className="w-2.5 h-2.5" />
                                        {hora ? `Hoje às ${hora}` : 'Hoje'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Rodapé: Ações rápidas de movimentação entre colunas */}
                                  <div className={`flex items-center justify-between gap-2 pt-2 border-t border-dashed ${
                                    ehDark ? 'border-white/5' : 'border-gray-100'
                                  }`}>
                                    {coluna.id === 'pendente' && (
                                      <button
                                        type="button"
                                        onClick={() => moverStatus(tarefa, 'em_andamento')}
                                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                                          ehDark
                                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30'
                                            : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                        }`}
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
                                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                                            ehDark
                                              ? 'bg-white/5 hover:bg-white/10 text-purple-200/70 border border-white/10'
                                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                          }`}
                                        >
                                          <ArrowLeft className="w-3 h-3" />
                                          <span>Voltar</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moverStatus(tarefa, 'concluido')}
                                          title="Concluir tarefa"
                                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                            ehDark
                                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                          }`}
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
                                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                                          ehDark
                                            ? 'bg-white/5 hover:bg-white/10 text-purple-300/80 hover:text-white border border-white/10'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                        }`}
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
                  <div className="block md:hidden space-y-3 w-full">
                    {tarefasFiltradasTabela.map((tarefa, index) => {
                      const { hora } = parseTarefaNome(tarefa.nome);
                      const alerta = verificarPrazoInteligente(tarefa.data_termi, tarefa.status, hora);
                      const concluida = tarefa.status === 'concluido';

                      return (
                        <div 
                          key={`card-${tarefa.id}`}
                          className={`rounded-2xl p-4 shadow-sm transition-all text-left flex flex-col justify-between gap-3 border hover-lift animate-slide-up ${
                            ehDark
                              ? 'bg-white/[0.05] hover:bg-white/[0.08] border-purple-500/20 text-purple-100 shadow-md hover:shadow-lg'
                              : 'bg-purple-50/50 hover:bg-purple-50/80 border-purple-100/80 text-gray-900 hover:shadow-md'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Topo do Card */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => alternarConclusaoRapida(tarefa)}
                                title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                  concluida
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                    : ehDark
                                    ? 'border-purple-300/40 hover:border-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-gray-400 hover:border-emerald-500 hover:bg-emerald-50'
                                }`}
                              >
                                {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {renderIdentificacaoTarefa(tarefa, concluida)}
                            </div>

                            <button
                              type="button"
                              onClick={() => alternarProximoStatus(tarefa)}
                              title="Clique para alternar o status"
                              className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold transition-all active:scale-95 cursor-pointer ${
                                tarefa.status === 'concluido'
                                  ? ehDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-green-100 text-green-800 border border-green-300'
                                  : tarefa.status === 'em_andamento'
                                  ? ehDark ? 'bg-purple-500/30 text-purple-100 border border-purple-400/50' : 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {rotuloStatus[tarefa.status] || tarefa.status}
                            </button>
                          </div>

                          {/* Datas com Alerta Inteligente e Horário */}
                          <div className={`text-xs space-y-1.5 pt-2 border-t ${
                            ehDark ? 'border-white/10 text-purple-300/70' : 'border-purple-200/60 text-gray-500'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span>Início:</span>
                              <span className="font-medium text-right">{formatarData(tarefa.data_come)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                Término:
                                {alerta === 'atrasada' && (
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                  }`}>
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Atrasada
                                  </span>
                                )}
                                {alerta === 'hoje' && (
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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

                          {/* Ações (Editar e Excluir) */}
                          <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
                            ehDark ? 'border-white/10' : 'border-purple-200/60'
                          }`}>
                            <button
                              type="button"
                              onClick={() => handleEditar(tarefa)}
                              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark 
                                  ? 'bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 border border-purple-500/30' 
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                              }`}
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark 
                                  ? 'bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-500/30' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
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
                  <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-transparent">
                    <table className="w-full border-collapse text-left">
                      
                      {/* Cabeçalho da Tabela */}
                      <thead>
                        <tr className={`border-b text-xs sm:text-sm font-semibold tracking-wider uppercase ${
                          ehDark 
                            ? 'border-purple-500/30 text-purple-300/80 bg-white/[0.02]' 
                            : 'border-purple-200 text-purple-950 bg-purple-50/50'
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
                              className={`transition-colors duration-200 animate-slide-up ${
                                ehDark
                                  ? 'hover:bg-purple-500/10 text-purple-200'
                                  : 'hover:bg-purple-50/40 text-gray-800'
                              }`}
                              style={{ animationDelay: `${index * 40}ms` }}
                            >
                              {/* Coluna: Nome/Título com Checkbox Circular e Tags/Prioridade/Etapas */}
                              <td className="py-4 px-4 max-w-xs sm:max-w-md">
                                <div className="flex items-start gap-3">
                                  <button
                                    type="button"
                                    onClick={() => alternarConclusaoRapida(tarefa)}
                                    title={concluida ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 active:scale-90 ${
                                      concluida
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : ehDark
                                        ? 'border-purple-300/40 hover:border-emerald-400 hover:bg-emerald-500/10'
                                        : 'border-gray-400 hover:border-emerald-500 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {concluida && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                  
                                  {renderIdentificacaoTarefa(tarefa, concluida)}
                                </div>
                              </td>

                              {/* Coluna: Data de Início */}
                              <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-purple-300/80' : 'text-gray-600'}`}>
                                {formatarData(tarefa.data_come)}
                              </td>

                              {/* Coluna: Data de Término com Horário e Alerta Inteligente */}
                              <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-purple-300/80' : 'text-gray-600'}`}>
                                <div className="inline-flex items-center gap-2">
                                  <span className="flex items-center gap-1.5 font-medium">
                                    {formatarData(tarefa.data_termi)}
                                    {hora && (
                                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                        ehDark ? 'bg-white/10 text-purple-200' : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        <Clock className="w-3 h-3 text-purple-400" />
                                        {hora}
                                      </span>
                                    )}
                                  </span>
                                  {alerta === 'atrasada' && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                      ehDark ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-700 border border-rose-300'
                                    }`}>
                                      <AlertCircle className="w-3 h-3" />
                                      Atrasada
                                    </span>
                                  )}
                                  {alerta === 'hoje' && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
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
                                <button
                                  type="button"
                                  onClick={() => alternarProximoStatus(tarefa)}
                                  title="Clique para alternar o status"
                                  className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm cursor-pointer transition-all shadow-sm active:scale-95 ${
                                    tarefa.status === 'concluido'
                                      ? ehDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                      : tarefa.status === 'em_andamento'
                                      ? ehDark ? 'bg-purple-500/30 text-purple-100 border border-purple-400/50 hover:bg-purple-500/40 shadow-sm' : 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
                                      : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  }`}
                                >
                                  {rotuloStatus[tarefa.status] || tarefa.status}
                                </button>
                              </td>

                              {/* Coluna: Ações */}
                              <td className="py-4 px-4 text-right pr-4 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleEditar(tarefa)}
                                    title="Editar tarefa"
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      ehDark
                                        ? 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                                        : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                                  >
                                    <SquarePen className="w-5 h-5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                                    title="Excluir tarefa"
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      ehDark
                                        ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/20'
                                        : 'text-gray-700 hover:text-rose-600 hover:bg-rose-50'
                                    }`}
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

        </div>

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

    </div>
  );
}
