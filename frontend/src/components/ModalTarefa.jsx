import { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * ============================================================================
 * MODAL DE CADASTRO / EDIÇÃO DE TAREFAS
 * ============================================================================
 * Baseado no design do Figma: 'Cadastro de Tarefas.png'
 * 
 * Este componente atende tanto à CRIAÇÃO de uma nova tarefa quanto à EDIÇÃO
 * de uma tarefa existente (quando `tarefaParaEditar` é informada).
 */
export function ModalTarefa({ tarefaParaEditar, aoSalvar, aoFechar }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const hoje = new Date().toISOString().split('T')[0];

  // Inicialização direta a partir das propriedades recebidas
  const [nome, setNome] = useState(tarefaParaEditar?.nome || '');
  const [status, setStatus] = useState(tarefaParaEditar?.status || 'pendente');
  const [dataCome, setDataCome] = useState(tarefaParaEditar?.data_come || hoje);
  const [dataTermi, setDataTermi] = useState(tarefaParaEditar?.data_termi || hoje);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

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

    try {
      setSalvando(true);
      await aoSalvar({
        id: tarefaParaEditar?.id,
        nome: nome.trim(),
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
      <div className={`relative w-full max-w-lg backdrop-blur-2xl rounded-3xl overflow-hidden animate-fade-in max-h-[90dvh] flex flex-col transition-all duration-500 ${
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
          
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
            <label className={`block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${
              ehDark ? 'text-purple-200' : 'text-gray-900'
            }`}>
              Título
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reunião com a equipe"
              className={`w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm sm:text-base shadow-sm ${
                ehDark
                  ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] border border-white/20 text-white placeholder-purple-200/50 focus:ring-purple-400/40 focus:border-purple-400'
                  : 'bg-white border border-purple-300/60 text-gray-800 placeholder-gray-400 focus:ring-purple-400/40 focus:border-purple-500'
              }`}
              required
            />
          </div>

          {/* Linha com Status, Início e Término */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
            
            {/* Campo: Status */}
            <div>
              <label className={`block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all cursor-pointer ${
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
              <label className={`block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Início
              </label>
              <input
                type="date"
                value={dataCome}
                onChange={(e) => setDataCome(e.target.value)}
                className={`w-full px-3 py-2 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white [color-scheme:dark] focus:ring-purple-400/40 focus:border-purple-400'
                    : 'bg-white border border-purple-300/60 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
                }`}
                required
              />
            </div>

            {/* Campo: Término */}
            <div>
              <label className={`block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${
                ehDark ? 'text-purple-200' : 'text-gray-900'
              }`}>
                Término
              </label>
              <input
                type="date"
                value={dataTermi}
                onChange={(e) => setDataTermi(e.target.value)}
                className={`w-full px-3 py-2 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  ehDark
                    ? 'bg-white/10 hover:bg-white/[0.14] border border-white/20 text-white [color-scheme:dark] focus:ring-purple-400/40 focus:border-purple-400'
                    : 'bg-white border border-purple-300/60 text-gray-800 focus:ring-purple-400/30 focus:border-purple-400'
                }`}
                required
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
