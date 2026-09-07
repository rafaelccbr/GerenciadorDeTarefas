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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      {/* Container do Modal com Leve Transparência e Bordas Suaves */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-fade-in text-gray-800">
        
        {/* Cabeçalho Ciano/Azul (conforme Figma) */}
        <div className="bg-[#00b4d8] py-4 px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-wide">
            {tarefaParaEditar ? 'Editar Tarefa' : 'Cadastro de Tarefa'}
          </h2>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Mensagem de Erro, se houver */}
          {erro && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl">
              {erro}
            </div>
          )}

          {/* Campo: Título da Tarefa */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Título
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reunião com a equipe"
              className="w-full px-5 py-3 border-2 border-[#1e88e5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8] transition-all text-base text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          {/* Linha com Status, Início e Término */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            
            {/* Campo: Status */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-full font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] transition-all cursor-pointer"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Campo: Início */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Início
              </label>
              <input
                type="date"
                value={dataCome}
                onChange={(e) => setDataCome(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#1e88e5] rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] transition-all"
                required
              />
            </div>

            {/* Campo: Término */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Término
              </label>
              <input
                type="date"
                value={dataTermi}
                onChange={(e) => setDataTermi(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#1e88e5] rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] transition-all"
                required
              />
            </div>

          </div>

          {/* Botões de Ação (Salvar e Cancelar) */}
          <div className="flex justify-center items-center gap-4 pt-4">
            
            {/* Botão Salvar (Verde claro conforme Figma) */}
            <button
              type="submit"
              disabled={salvando}
              className="px-8 py-2.5 bg-[#bbf7d0] hover:bg-[#86efac] active:scale-95 text-gray-900 font-semibold rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>

            {/* Botão Cancelar (Coral/Salmão conforme Figma) */}
            <button
              type="button"
              onClick={aoFechar}
              className="px-8 py-2.5 bg-[#fca5a5] hover:bg-[#f87171] active:scale-95 text-gray-900 font-semibold rounded-full shadow-md transition-all cursor-pointer"
            >
              Cancelar
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
