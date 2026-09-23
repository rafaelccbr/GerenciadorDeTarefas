import { useState } from 'react';
import { Flag, Tag, Plus, X, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { 
  parseTarefaNome, 
  montarTarefaNome, 
  PRIORIDADES, 
  TAGS_SUGERIDAS, 
  obterCorTag 
} from '../utils/tarefaParser.js';

/**
 * ============================================================================
 * MODAL DE CADASTRO / EDIÇÃO DE TAREFAS (COM PRIORIDADES, TAGS E HORÁRIO)
 * ============================================================================
 * Suporte completo a:
 * - Prioridades P1 a P4 Todoist
 * - Tags e Categorias customizadas e sugeridas
 * - Horário de conclusão com alerta preciso de minutos
 */
export function ModalTarefa({ tarefaParaEditar, statusInicial, aoSalvar, aoFechar }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const hoje = new Date().toISOString().split('T')[0];

  // Extrai título limpo, prioridade, horário e tags se for edição
  const parsed = parseTarefaNome(tarefaParaEditar?.nome || '');
  const [nome, setNome] = useState(parsed.tituloLimpo);
  const [prioridade, setPrioridade] = useState(parsed.prioridade || 'p4');
  const [hora, setHora] = useState(parsed.hora || '');
  const [tags, setTags] = useState(parsed.tags || []);
  const [inputCustomTag, setInputCustomTag] = useState('');
  
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

    // Monta o nome composto com horário, tags e prioridade
    const nomeComposto = montarTarefaNome({
      titulo: nome,
      prioridade,
      hora,
      tags,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4">
      {/* Container do Modal com Leve Transparência, Bordas Suaves e Rolagem Segura */}
      <div className={`relative w-full max-w-xl backdrop-blur-2xl rounded-3xl overflow-hidden animate-fade-in max-h-[92dvh] flex flex-col transition-all duration-500 ${
        ehDark
          ? 'bg-gradient-to-b from-[#180e25]/95 via-[#10091a]/95 to-[#09050e]/98 border border-purple-500/25 text-purple-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.12)]'
          : 'bg-white/95 border border-white/60 text-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
      }`}>
        
        {/* Cabeçalho com Degradê Violeta Profundo ou Carvão */}
        <div className={`py-3.5 sm:py-4 px-6 text-center shadow-md shrink-0 ${
          ehDark 
            ? 'bg-gradient-to-r from-[#2a0e44] via-[#3d1264] to-[#2a0e44] border-b border-purple-500/30' 
            : 'bg-gradient-to-r from-purple-800 via-[#3b075e] to-purple-900'
        }`}>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
            {tarefaParaEditar ? 'Editar Tarefa' : 'Cadastro de Tarefa'}
          </h2>
        </div>

        {/* Corpo do Formulário com Rolagem Ativa em Telas Pequenas */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 sm:space-y-5 overflow-y-auto">
          
          {/* Mensagem de Erro, se houver */}
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
              ehDark ? 'text-purple-200' : 'text-gray-900'
            }`}>
              Título
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Estudar Cálculo para prova"
              className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm shadow-sm ${
                ehDark
                  ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] border border-white/20 text-white placeholder-purple-200/50 focus:ring-purple-400/40 focus:border-purple-400'
                  : 'bg-white border border-purple-300/60 text-gray-800 placeholder-gray-400 focus:ring-purple-400/40 focus:border-purple-500'
              }`}
              required
            />
          </div>

          {/* Seletor de Prioridade (P1 a P4 Todoist) */}
          <div>
            <label className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold mb-1.5 ${
              ehDark ? 'text-purple-200' : 'text-gray-900'
            }`}>
              <Flag className="w-3.5 h-3.5 text-purple-400" />
              Prioridade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(PRIORIDADES).map((p) => {
                const ativo = prioridade === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrioridade(p.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                      ativo
                        ? ehDark ? `${p.corDark} shadow-md` : `${p.corClaro} shadow-sm font-extrabold ring-2 ring-purple-400/40`
                        : ehDark
                        ? 'bg-white/5 hover:bg-white/10 text-purple-200/60 border-white/10'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                    }`}
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
              ehDark ? 'text-purple-200' : 'text-gray-900'
            }`}>
              <Tag className="w-3.5 h-3.5 text-purple-400" />
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
                      className="hover:opacity-75 cursor-pointer ml-0.5"
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
                className={`flex-1 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] text-white placeholder-purple-200/40 border-white/15 focus:border-purple-400 focus:ring-purple-400/30'
                    : 'bg-white hover:bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200 focus:border-purple-400 focus:ring-purple-400/30'
                }`}
              />
              <button
                type="button"
                onClick={() => adicionarTag()}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  ehDark 
                    ? 'bg-purple-500/20 hover:bg-purple-500/35 border-purple-500/30 text-purple-200' 
                    : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                }`}
                title="Adicionar tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Sugestões rápidas de Tags */}
            <div className="flex flex-wrap gap-1 items-center">
              <span className={`text-[11px] mr-1 ${ehDark ? 'text-purple-300/60' : 'text-gray-400'}`}>
                Sugeridas:
              </span>
              {TAGS_SUGERIDAS.map((sugestao) => {
                const selecionada = tags.includes(sugestao);
                return (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => alternarTagSugerida(sugestao)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                      selecionada
                        ? ehDark ? 'bg-purple-500/40 text-white border-purple-400/60' : 'bg-purple-600 text-white border-purple-700'
                        : ehDark ? 'bg-white/5 hover:bg-white/10 text-purple-200/60 border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                    }`}
                  >
                    #{sugestao}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Linha com Status, Início, Término e Horário Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            
            {/* Campo: Status */}
            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all cursor-pointer ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white focus:ring-purple-400/40 focus:border-purple-400 [&>option]:bg-[#140b20] [&>option]:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 border border-purple-300/50 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
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
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Início
              </label>
              <input
                type="date"
                value={dataCome}
                onChange={(e) => setDataCome(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white [color-scheme:dark] focus:ring-purple-400/40 focus:border-purple-400'
                    : 'bg-white border border-purple-300/60 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
                }`}
                required
              />
            </div>

            {/* Campo: Término (Data) */}
            <div>
              <label className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Término
              </label>
              <input
                type="date"
                value={dataTermi}
                onChange={(e) => setDataTermi(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white [color-scheme:dark] focus:ring-purple-400/40 focus:border-purple-400'
                    : 'bg-white border border-purple-300/60 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
                }`}
                required
              />
            </div>

            {/* Campo: Horário de Conclusão (Hora) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${
                  ehDark ? 'text-purple-200' : 'text-gray-900'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Horário
                </label>
                {hora && (
                  <button
                    type="button"
                    onClick={() => setHora('')}
                    className={`text-[10px] underline cursor-pointer ${
                      ehDark ? 'text-purple-300/70 hover:text-white' : 'text-purple-600 hover:text-purple-800'
                    }`}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white [color-scheme:dark] focus:ring-purple-400/40 focus:border-purple-400'
                    : 'bg-white border border-purple-300/60 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
                }`}
              />
            </div>

          </div>

          {/* Botões de Ação (Salvar e Cancelar) */}
          <div className="flex flex-col-reverse sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
            
            {/* Botão Cancelar */}
            <button
              type="button"
              onClick={aoFechar}
              className={`w-full sm:w-auto px-8 py-2.5 active:scale-95 font-bold rounded-full border shadow-sm transition-all cursor-pointer text-sm ${
                ehDark
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border-rose-200/80'
              }`}
            >
              Cancelar
            </button>

            {/* Botão Salvar */}
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
