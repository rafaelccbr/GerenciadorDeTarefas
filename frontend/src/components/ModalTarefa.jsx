import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useState } from 'react';
import { dataLocalIso } from '../utils/datas.js';
import { Flag, Tag, Plus, X, Clock, Repeat, ListChecks, CheckSquare, Square, Trash2, FileText, Link2 } from 'lucide-react';
import { useTheme } from '../context/theme.js';
import {
  parseTarefaNome,
  montarTarefaNome,
  PRIORIDADES,
  TAGS_SUGERIDAS,
  RECORRENCIA_OPCOES,
  calcularProgressoSubtarefas,
  obterCorTag
} from '../utils/tarefaParser.js';

/**
 * ============================================================================
 * MODAL DE CADASTRO / EDIÇÃO DE TAREFAS
 * ============================================================================
 * Suporte completo a:
 * - Prioridades P1 a P4 Todoist
 * - Tags e Categorias customizadas e sugeridas
 * - Horário de conclusão com alerta preciso de minutos
 * -  Etapas / Subtarefas (Mini-Checklist dinâmico com progresso)
 * -  Recorrência (Diária, Semanal, Mensal)
 * -  Notas e Links Rápidos clicáveis
 */
export function ModalTarefa({ tarefaParaEditar, statusInicial, aoSalvar, aoFechar }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const hoje = dataLocalIso();

  // Extrai título limpo, prioridade, horário, tags, subtarefas, recorrência e notas se for edição
  const parsed = parseTarefaNome(tarefaParaEditar?.nome || '');
  const [nome, setNome] = useState(parsed.tituloLimpo);
  const [prioridade, setPrioridade] = useState(parsed.prioridade || 'p4');
  const [hora, setHora] = useState(parsed.hora || '');
  const [tags, setTags] = useState(parsed.tags || []);
  const [inputCustomTag, setInputCustomTag] = useState('');

  // Subtarefas / Etapas
  const [subtarefas, setSubtarefas] = useState(parsed.subtarefas || []);
  const [novaEtapaTexto, setNovaEtapaTexto] = useState('');

  // Recorrência e Notas
  const [recorrencia, setRecorrencia] = useState(parsed.recorrencia || 'never');
  const [notas, setNotas] = useState(parsed.notas || '');

  const [status, setStatus] = useState(tarefaParaEditar?.status || statusInicial || 'pendente');
  const [dataCome, setDataCome] = useState(tarefaParaEditar?.data_come || hoje);
  const [dataTermi, setDataTermi] = useState(tarefaParaEditar?.data_termi || hoje);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Adiciona tag personalizada
  const adicionarTag = (tagParaAdicionar) => {
    const limpa = (tagParaAdicionar || inputCustomTag).trim().replace(/^#/, '');
    if (!limpa) return;
    if (!tags.includes(limpa)) {
      setTags([...tags, limpa]);
    }
    setInputCustomTag('');
  };

  // Remove tag
  const removerTag = (tagParaRemover) => {
    setTags(tags.filter((t) => t !== tagParaRemover));
  };

  // Alterna tag sugerida
  const alternarTagSugerida = (sugestao) => {
    if (tags.includes(sugestao)) {
      removerTag(sugestao);
    } else {
      setTags([...tags, sugestao]);
    }
  };

  // Manipulação de Subtarefas
  const adicionarSubtarefa = () => {
    const texto = novaEtapaTexto.trim();
    if (!texto) return;
    setSubtarefas([...subtarefas, { texto, feito: false }]);
    setNovaEtapaTexto('');
  };

  const alternarSubtarefa = (index) => {
    setSubtarefas(subtarefas.map((s, idx) => (idx === index ? { ...s, feito: !s.feito } : s)));
  };

  const atualizarTextoSubtarefa = (index, novoTexto) => {
    setSubtarefas(subtarefas.map((s, idx) => (idx === index ? { ...s, texto: novoTexto } : s)));
  };

  const removerSubtarefa = (index) => {
    setSubtarefas(subtarefas.filter((_, idx) => idx !== index));
  };

  const progressoSubtarefas = calcularProgressoSubtarefas(subtarefas);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Por favor, informe o título da tarefa.');
      return;
    }

    if (!dataCome || !dataTermi) {
      setErro('Por favor, informe as datas de início e término.');
      return;
    }

    if (new Date(dataCome) > new Date(dataTermi)) {
      setErro('A data de início não pode ser posterior à data de término.');
      return;
    }

    // Monta o nome composto com horário, tags, prioridade, recorrência, notas e subtarefas
    const nomeComposto = montarTarefaNome({
      titulo: nome,
      prioridade,
      hora,
      tags,
      subtarefas,
      recorrencia,
      notas,
    });

    try {
      setSalvando(true);
      await aoSalvar({
        id: tarefaParaEditar?.id,
        nome: nomeComposto,
        status,
        data_come: dataCome,
        data_termi: dataTermi,
      });
      aoFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar a tarefa.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60  p-3 sm:p-4">
      {/* Container do Modal com Transparência e Rolagem Segura */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className={`dialog-surface bg-(--surface) relative w-full max-w-xl  rounded-3xl overflow-hidden  max-h-[92dvh] flex flex-col transition-colors duration-500 ${
        ehDark
          ? '    border border-(--border) text-(--ink) '
          : 'bg-(--surface) border border-(--border) text-(--ink) '
      }`}>

        {/* Cabeçalho */}
        <div className={`py-3.5 sm:py-4 px-6 text-center  shrink-0 ${
          ehDark
            ? '    border-b border-(--border)'
            : '   '
        }`}>
          <h2 className="text-lg sm:text-2xl font-bold text-(--ink)  ">
            {tarefaParaEditar ? 'Editar Tarefa' : 'Cadastro de Tarefa'}
          </h2>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} onKeyDownCapture={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            if (!salvando) event.currentTarget.requestSubmit();
          }
        }} className="p-5 sm:p-7 space-y-4 sm:space-y-5 overflow-y-auto">

          {/* Mensagem de Erro */}
          {erro && (
            <div className={`p-3 text-xs sm:text-sm rounded-xl ${
              ehDark
                ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                : 'bg-red-100 border border-red-300 text-red-700'
            }`}>
              {erro}
            </div>
          )}

          {/* Campo: Título da Tarefa */}
          <div>
            <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
              ehDark ? 'text-(--ink)' : 'text-(--ink)'
            }`}>
              Título
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Estudar Cálculo para prova"
              className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-4 transition-colors text-sm  ${
                ehDark
                  ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) border border-(--border) text-(--ink) placeholder-(--muted) focus:ring-(--accent) focus:border-(--border)'
                  : 'bg-(--surface) border border-(--border) text-(--ink) placeholder-gray-400 focus:ring-(--accent) focus:border-(--border)'
              }`}
              required
            />
          </div>

          {/* Seletor de Prioridade (P1 a P4 Todoist) */}
          <div>
            <label className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold mb-1.5 ${
              ehDark ? 'text-(--ink)' : 'text-(--ink)'
            }`}>
              <Flag className="w-3.5 h-3.5 text-(--muted)" />
              Prioridade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(PRIORIDADES).map((p) => {
                const ativo = prioridade === p.id;
                return (
                  <button aria-pressed={prioridade === p.id}
                    key={p.id}
                    type="button"
                    onClick={() => setPrioridade(p.id)}
                    className={"ui-button " + (`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border active:scale-95 ${
                      ativo
                        ? ehDark ? `${p.corDark} ` : `${p.corClaro}  font-extrabold ring-2 ring-(--accent)`
                        : ehDark
                        ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) border-(--border)'
                        : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border-(--border)'
                    }`)}
                  >
                    <Flag className={`w-3 h-3 ${p.iconeCor}`} />
                    <span>{p.rotulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Tags / Categorias */}
          <div>
            <label className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold mb-1.5 ${
              ehDark ? 'text-(--ink)' : 'text-(--ink)'
            }`}>
              <Tag className="w-3.5 h-3.5 text-(--muted)" />
              Tags / Categorias
            </label>

            {/* Tags já selecionadas */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${obterCorTag(tag, ehDark)}`}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removerTag(tag)}
                      className={"ui-button ui-icon ui-danger " + ("hover:opacity-75 cursor-pointer ml-0.5")}
                      title={`Remover tag #${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Campo para adicionar tag customizada */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={inputCustomTag}
                onChange={(e) => setInputCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarTag();
                  }
                }}
                placeholder="Digitar nova tag e pressionar Enter..."
                className={`flex-1 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors focus:outline-none focus:ring-2 ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                    : 'bg-(--surface) hover:bg-(--surface-muted) text-(--ink) placeholder-gray-400 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                }`}
              />
              <button
                type="button"
                onClick={() => adicionarTag()}
                className={"ui-button " + (`p-1.5 rounded-xl border transition-colors cursor-pointer active:scale-95 ${
                  ehDark
                    ? 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--ink)'
                    : 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--muted)'
                }`)}
                title="Adicionar tag"
              >
                <Plus className="w-4 h-4" />
                <Tecla>Enter</Tecla>
              </button>
            </div>

            {/* Sugestões rápidas de Tags */}
            <div className="flex flex-wrap gap-1 items-center">
              <span className={`text-[11px] mr-1 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                Sugeridas:
              </span>
              {TAGS_SUGERIDAS.map((sugestao) => {
                const selecionada = tags.includes(sugestao);
                return (
                  <button aria-pressed={tags.includes(sugestao)}
                    key={sugestao}
                    type="button"
                    onClick={() => alternarTagSugerida(sugestao)}
                    className={"ui-button " + (`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                      selecionada
                        ? ehDark ? 'bg-(--surface-muted) text-(--ink) border-(--border)' : 'bg-(--surface-muted) text-(--ink) border-(--border)'
                        : ehDark ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) border-(--border)' : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border-(--border)'
                    }`)}
                  >
                    #{sugestao}
                  </button>
                );
              })}
            </div>

          </div>

          {/* NOVA SEÇÃO: Subtarefas / Mini-Checklist */}
          <div className={`p-3.5 rounded-2xl border ${
            ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface-muted) border-(--border)'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
                ehDark ? 'text-(--ink)' : 'text-(--ink)'
              }`}>
                <ListChecks className="w-4 h-4 text-(--muted)" />
                Etapas (Checklist)
              </label>

              {subtarefas.length > 0 && (
                <span className={`text-[11px] font-semibold ${
                  progressoSubtarefas.porcentagem === 100
                    ? 'text-(--accent)'
                    : ehDark ? 'text-(--muted)' : 'text-(--muted)'
                }`}>
                  {progressoSubtarefas.feitas}/{progressoSubtarefas.total} concluídas ({progressoSubtarefas.porcentagem}%)
                </span>
              )}
            </div>

            {/* Barra de progresso das subtarefas */}
            {subtarefas.length > 0 && (
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-3 ${ehDark ? 'bg-(--surface)' : 'bg-(--surface-muted)'}`}>
                <div
                  className={`h-full rounded-full transition-colors duration-300 ${
                    progressoSubtarefas.porcentagem === 100
                      ? 'bg-emerald-400'
                      : 'bg-(--surface-muted)'
                  }`}
                  style={{ width: `${progressoSubtarefas.porcentagem}%` }}
                />
              </div>
            )}

            {/* Lista de etapas cadastradas */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2.5">
              {subtarefas.map((etapa, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs transition-colors ${
                    ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface) border-(--border)'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternarSubtarefa(idx)}
                    className={"ui-button " + ("cursor-pointer text-(--muted) hover:scale-110 transition-transform shrink-0")}
                  >
                    {etapa.feito ? (
                      <CheckSquare className="w-4 h-4 text-(--accent)" />
                    ) : (
                      <Square className="w-4 h-4 text-(--muted)" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={etapa.texto}
                    onChange={(e) => atualizarTextoSubtarefa(idx, e.target.value)}
                    className={`flex-1 bg-transparent focus:outline-none text-xs ${
                      etapa.feito
                        ? ehDark ? 'line-through text-(--muted)' : 'line-through text-(--muted)'
                        : ehDark ? 'text-(--ink)' : 'text-(--ink)'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => removerSubtarefa(idx)}
                    className={"ui-button ui-icon ui-danger " + ("p-1 hover:text-rose-400 text-(--muted) transition-colors cursor-pointer shrink-0")}
                    title="Remover etapa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Input para adicionar nova etapa */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={novaEtapaTexto}
                onChange={(e) => setNovaEtapaTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarSubtarefa();
                  }
                }}
                placeholder="Adicionar nova etapa e pressionar Enter..."
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors focus:outline-none focus:ring-2 ${
                  ehDark
                    ? 'bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                    : 'bg-(--surface) text-(--ink) placeholder-gray-400 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                }`}
              />
              <button
                type="button"
                onClick={adicionarSubtarefa}
                className={"ui-button " + (`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 ${
                  ehDark
                    ? 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--ink)'
                    : 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--muted)'
                }`)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Etapa</span> <Tecla>Enter</Tecla>
              </button>
            </div>
          </div>

          {/* NOVA SEÇÃO: Notas / Descrição & Links Rápidos */}
          <div>
            <label className={`flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5 ${
              ehDark ? 'text-(--ink)' : 'text-(--ink)'
            }`}>
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-(--muted)" />
                Notas ou Links de Apoio
              </span>
              <span className={`text-xs font-normal flex items-center gap-1 ${ehDark ? 'text-(--muted)' : 'text-(--muted)'}`}>
                <Link2 className="w-3 h-3" /> Links viram botões clicáveis
              </span>
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex: Link do Google Docs https://docs.google.com/... ou anotações importantes sobre a tarefa"
              className={`w-full px-3.5 py-2 rounded-2xl focus:outline-none focus:ring-4 transition-colors text-xs sm:text-sm  resize-none ${
                ehDark
                  ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) border border-(--border) text-(--ink) placeholder-(--muted) focus:ring-(--accent) focus:border-(--border)'
                  : 'bg-(--surface) border border-(--border) text-(--ink) placeholder-gray-400 focus:ring-(--accent) focus:border-(--border)'
              }`}
            />
          </div>

          {/* Linha com Status, Início, Término, Horário e Recorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">

            {/* Campo: Status */}
            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-(--ink)' : 'text-(--ink)'
              }`}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm focus:outline-none focus:ring-4 transition-colors cursor-pointer ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border) [&>option]:bg-(--surface) [&>option]:text-(--ink)'
                    : 'bg-(--surface-muted) hover:bg-(--surface-muted) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border)'
                }`}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Campo: Início */}
            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-(--ink)' : 'text-(--ink)'
              }`}>
                Início
              </label>
              <input
                type="date"
                value={dataCome}
                onChange={(e) => setDataCome(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-colors  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) border border-(--border) text-(--ink) [color-scheme:dark] focus:ring-(--accent) focus:border-(--border)'
                    : 'bg-(--surface) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border)'
                }`}
                required
              />
            </div>

            {/* Campo: Término */}
            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-(--ink)' : 'text-(--ink)'
              }`}>
                Término
              </label>
              <input
                type="date"
                value={dataTermi}
                onChange={(e) => setDataTermi(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-colors  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) border border-(--border) text-(--ink) [color-scheme:dark] focus:ring-(--accent) focus:border-(--border)'
                    : 'bg-(--surface) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border)'
                }`}
                required
              />
            </div>

            {/* Campo: Horário */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${
                  ehDark ? 'text-(--ink)' : 'text-(--ink)'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-(--muted)" />
                  Horário
                </label>
                {hora && (
                  <button
                    type="button"
                    onClick={() => setHora('')}
                    className={"ui-button " + (`text-xs underline cursor-pointer ${
                      ehDark ? 'text-(--muted) hover:text-(--ink)' : 'text-(--muted) hover:text-(--muted)'
                    }`)}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-colors  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) border border-(--border) text-(--ink) [color-scheme:dark] focus:ring-(--accent) focus:border-(--border)'
                    : 'bg-(--surface) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border)'
                }`}
              />
            </div>

            {/* Campo: Recorrência */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-(--ink)' : 'text-(--ink)'
              }`}>
                <Repeat className="w-3.5 h-3.5 text-(--muted)" />
                Repetição / Rotina
              </label>
              <select
                value={recorrencia}
                onChange={(e) => setRecorrencia(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm focus:outline-none focus:ring-4 transition-colors cursor-pointer ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border) [&>option]:bg-(--surface) [&>option]:text-(--ink)'
                    : 'bg-(--surface-muted) hover:bg-(--surface-muted) border border-(--border) text-(--ink) focus:ring-(--accent) focus:border-(--border)'
                }`}
              >
                {RECORRENCIA_OPCOES.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Botões de Ação */}
          <div className="task-form-actions flex flex-col-reverse sm:flex-row justify-center items-center gap-3 sm:gap-4">

            <button aria-keyshortcuts="Escape"
              type="button"
              onClick={aoFechar}
              className={"ui-button " + (`w-full sm:w-auto px-8 py-2.5 active:scale-95 font-bold rounded-full border  transition-colors cursor-pointer text-sm ${
                ehDark
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border-rose-200/80'
              }`)}
            >
              Cancelar
             <Tecla>Esc</Tecla></button>

            <button
              type="submit"
              disabled={salvando}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              className={"ui-button ui-primary " + ("primary-button w-full sm:w-auto px-8")}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
              <Tecla>Ctrl/⌘ Enter</Tecla>
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
