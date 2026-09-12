import { useState } from 'react';

/**
 * ============================================================================
 * MODAL DE CADASTRO / EDIÇÃO DE TAREFAS
 * ============================================================================
 * Baseado no design do Figma: 'Cadastro de Tarefas.png'
 * 
 * Este componente atende tanto à CRIAÇÃO de uma nova tarefa quanto à EDIÇÃO
 * de uma tarefa existente (quando `tarefaParaEditar` é informada).
 * 
 * Campos manipulados:
 * - nome (Título da tarefa)
 * - status ('pendente' | 'em_andamento' | 'concluido')
 * - data_come (Data de Início - formato YYYY-MM-DD)
 * - data_termi (Data de Término - formato YYYY-MM-DD)
 */
export function ModalTarefa({ tarefaParaEditar, aoSalvar, aoFechar }) {
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

    // Validação básica no cliente
    if (!nome.trim()) {
      setErro('Por favor, informe o título da tarefa.');
      return;
    }
    if (!dataCome) {
      setErro('Por favor, informe a data de início.');
      return;
    }
    if (!dataTermi) {
      setErro('Por favor, informe a data de término.');
      return;
    }
    if (dataTermi < dataCome) {
      setErro('A data de término não pode ser anterior à data de início.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-3 sm:p-4">
      {/* Container do Modal com Leve Transparência, Bordas Suaves e Rolagem Segura */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-fade-in text-gray-800 max-h-[90dvh] flex flex-col">
        
        {/* Cabeçalho com Degradê Violeta Profundo */}
        <div className="bg-gradient-to-r from-purple-800 via-[#3b075e] to-purple-900 py-3.5 sm:py-4 px-6 text-center shadow-md shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
            {tarefaParaEditar ? 'Editar Tarefa' : 'Cadastro de Tarefa'}
          </h2>
        </div>

        {/* Corpo do Formulário com Rolagem Ativa em Telas Pequenas */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* Mensagem de Erro, se houver */}
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs sm:text-sm rounded-xl">
              {erro}
            </div>
          )}

          {/* Campo: Título da Tarefa */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
              Título
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reunião com a equipe"
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-purple-300/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/40 focus:border-purple-500 transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
              required
            />
          </div>

          {/* Linha com Status, Início e Término */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
            
            {/* Campo: Status */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 border border-purple-300/50 rounded-full font-medium text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-400 transition-all cursor-pointer"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Campo: Início */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
                Início
              </label>
              <input
                type="date"
                value={dataCome}
                onChange={(e) => setDataCome(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300/60 rounded-full text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-400 transition-all shadow-sm"
                required
              />
            </div>

            {/* Campo: Término */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
                Término
              </label>
              <input
                type="date"
                value={dataTermi}
                onChange={(e) => setDataTermi(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300/60 rounded-full text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-400 transition-all shadow-sm"
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
              className="w-full sm:w-auto px-8 py-2.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 font-bold rounded-full border border-rose-200/80 shadow-sm transition-all cursor-pointer text-sm"
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
