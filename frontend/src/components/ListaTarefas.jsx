import { useState, useEffect } from 'react';
import { LogOut, PlusCircle, SquarePen, Trash2, Settings } from 'lucide-react';
import { 
  listarTarefasApi, 
  atualizarStatusApi, 
  excluirTarefaApi, 
  criarTarefaApi, 
  atualizarTarefaApi 
} from '../services/api.js';
import { ModalTarefa } from './ModalTarefa.jsx';

/**
 * ============================================================================
 * TELA PRINCIPAL (LISTA DE TAREFAS / DASHBOARD)
 * ============================================================================
 * Baseado no design do Figma: 'Lista de Tarefas.png'
 * 
 * Recursos e Componentes visuais:
 * - Botão 'Sair' no topo esquerdo (estilo pílula avermelhado).
 * - Botão 'Cadastrar' (estilo pílula esverdeado).
 * - Card central branco amplo com cantos arredondados (rounded-3xl).
 * - Tabela com colunas: Tarefa, Começa, Termina, Status e Ações.
 * - Suporte completo para criar, listar, alterar status, editar e deletar tarefas.
 */
export function ListaTarefas({ usuario, aoDeslogar, aoAbrirConta }) {
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  // Controle do Modal de Criação/Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);

  // Carrega as tarefas do usuário autenticado ao montar a tela
  useEffect(() => {
    let ativo = true;

    listarTarefasApi()
      .then((lista) => {
        if (ativo) {
          setTarefas(Array.isArray(lista) ? lista : []);
          setCarregando(false);
        }
      })
      .catch((err) => {
        if (ativo) {
          setErro(err.message || 'Erro ao carregar lista de tarefas.');
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);


  // Converte data do formato 'AAAA-MM-DD' para o formato brasileiro 'DD/MM/AAAA'
  const formatarData = (dataStr) => {
    if (!dataStr) return '--/--/----';
    // Se a data vier com timestamp (ex: ISO), extrai apenas a parte da data
    const [ano, mes, dia] = dataStr.split('T')[0].split('-');
    if (!ano || !mes || !dia) return dataStr;
    return `${dia}/${mes}/${ano}`;
  };

  // Mapeia o valor do banco para exibição elegante com primeira letra maiúscula
  const rotuloStatus = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    concluido: 'Concluído'
  };

  // Alterna o status da tarefa ao clicar no badge
  const alternarProximoStatus = async (tarefa) => {
    const proximaOrdem = {
      pendente: 'em_andamento',
      em_andamento: 'concluido',
      concluido: 'pendente'
    };
    const novoStatus = proximaOrdem[tarefa.status] || 'pendente';

    try {
      await atualizarStatusApi(tarefa.id, novoStatus);
      // Atualiza o estado local imediatamente
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
      );
    } catch (err) {
      alert(`Falha ao alterar status: ${err.message}`);
    }
  };

  // Abre o modal para cadastro de nova tarefa
  const handleNovoCadastro = () => {
    setTarefaEmEdicao(null);
    setModalAberto(true);
  };

  // Abre o modal em modo de edição
  const handleEditar = (tarefa) => {
    setTarefaEmEdicao(tarefa);
    setModalAberto(true);
  };

  // Exclui a tarefa com confirmação
  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a tarefa "${nome}"?`)) {
      return;
    }

    try {
      await excluirTarefaApi(id);
      // Remove do estado da tela
      setTarefas((atuais) => atuais.filter((t) => t.id !== id));
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // Salva no backend (Criar ou Editar)
  const handleSalvarTarefa = async (dadosTarefa) => {
    if (dadosTarefa.id) {
      // Atualização (PUT)
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
      // Criação (POST)
      const res = await criarTarefaApi({
        nome: dadosTarefa.nome,
        data_come: dadosTarefa.data_come,
        data_termi: dadosTarefa.data_termi,
        status: dadosTarefa.status,
      });
      setTarefas((atuais) => [res.tarefa, ...atuais]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-figma-gradient p-4 sm:p-8 flex flex-col items-center">
      
      {/* Container Principal */}
      <div className="w-full max-w-6xl flex flex-col space-y-4">
        
        {/* Barra Superior de Ações conforme Figma */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          
          <div className="flex items-center gap-3">
            {/* Botão Sair (Coral/Salmão com ícone e leve transparência) */}
            <button
              onClick={aoDeslogar}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#fca5a5]/90 hover:bg-[#f87171] border border-red-200/50 backdrop-blur-sm text-gray-900 font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-700" />
              Sair
            </button>

            {/* Botão Cadastrar (Verde claro com ícone e leve transparência) */}
            <button
              onClick={handleNovoCadastro}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#bbf7d0]/90 hover:bg-[#86efac] border border-green-200/50 backdrop-blur-sm text-gray-900 font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-green-700" />
              Cadastrar
            </button>
          </div>

          {/* Gerenciamento de Conta: "Olá, (nome)" com engrenagem no canto direito */}
          {usuario?.nome && (
            <button
              type="button"
              onClick={aoAbrirConta}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-purple-200 hover:text-white rounded-full backdrop-blur-md shadow-md transition-all active:scale-95 cursor-pointer group self-end sm:self-auto"
              title="Clique para gerenciar sua conta"
            >
              <span className="text-sm font-medium">
                Olá, <strong className="text-white font-bold">{usuario.nome}</strong>
              </span>
              <Settings className="w-4 h-4 text-purple-200 group-hover:text-white group-hover:rotate-45 transition-transform duration-300" />
            </button>
          )}

        </div>

        {/* Card Branco Central com Efeito Glassmorphism e Sombra Suave (Figma 'Lista de Tarefas.png') */}
        <div className="w-full bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.25)] p-6 sm:p-8 min-h-[520px] flex flex-col">
          
          {/* Mensagem de Erro, se houver */}
          {erro && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
              {erro}
            </div>
          )}

          {/* Estado de Carregando */}
          {carregando ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Carregando suas tarefas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            /* Estado Vazio */
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 text-center">
              <p className="text-xl font-semibold mb-2 text-gray-600">Nenhuma tarefa encontrada</p>
              <p className="text-sm max-w-sm mb-6">
                Você ainda não tem tarefas cadastradas. Clique no botão verde "Cadastrar" acima para começar!
              </p>
              <button
                onClick={handleNovoCadastro}
                className="px-6 py-2.5 bg-[#bbf7d0] hover:bg-[#86efac] text-gray-900 font-bold rounded-full shadow transition-all"
              >
                Criar primeira tarefa
              </button>
            </div>
          ) : (
            /* Tabela de Tarefas */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                
                {/* Cabeçalho da Tabela */}
                <thead>
                  <tr className="border-b border-gray-200 text-gray-900 text-base sm:text-lg font-bold">
                    <th className="py-4 px-4 font-bold">Tarefa</th>
                    <th className="py-4 px-4 font-bold text-center sm:text-left">Começa</th>
                    <th className="py-4 px-4 font-bold text-center sm:text-left">Termina</th>
                    <th className="py-4 px-4 font-bold text-center">Status</th>
                    <th className="py-4 px-4 font-bold text-right pr-6">Ações</th>
                  </tr>
                </thead>

                {/* Corpo da Tabela */}
                <tbody className="divide-y divide-gray-200">
                  {tarefas.map((tarefa) => (
                    <tr 
                      key={tarefa.id} 
                      className="hover:bg-purple-50/40 transition-colors text-gray-800 text-sm sm:text-base"
                    >
                      {/* Coluna: Nome/Título */}
                      <td className="py-4 px-4 font-medium max-w-xs sm:max-w-md break-words">
                        {tarefa.nome}
                      </td>

                      {/* Coluna: Data de Início */}
                      <td className="py-4 px-4 text-gray-600 whitespace-nowrap text-center sm:text-left">
                        {formatarData(tarefa.data_come)}
                      </td>

                      {/* Coluna: Data de Término */}
                      <td className="py-4 px-4 text-gray-600 whitespace-nowrap text-center sm:text-left">
                        {formatarData(tarefa.data_termi)}
                      </td>

                      {/* Coluna: Status (Pill clicável para alternar) */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => alternarProximoStatus(tarefa)}
                          title="Clique para alternar o status"
                          className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm cursor-pointer transition-all shadow-sm active:scale-95 ${
                            tarefa.status === 'concluido'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : tarefa.status === 'em_andamento'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                          }`}
                        >
                          {rotuloStatus[tarefa.status] || tarefa.status}
                        </button>
                      </td>

                      {/* Coluna: Ações (Editar e Excluir) */}
                      <td className="py-4 px-4 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => handleEditar(tarefa)}
                            title="Editar tarefa"
                            className="p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <SquarePen className="w-5 h-5" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                            title="Excluir tarefa"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>

      {/* Modal de Criação / Edição de Tarefa */}
      {modalAberto && (
        <ModalTarefa
          key={tarefaEmEdicao?.id || 'nova'}
          tarefaParaEditar={tarefaEmEdicao}
          aoSalvar={handleSalvarTarefa}
          aoFechar={() => {
            setModalAberto(false);
            setTarefaEmEdicao(null);
          }}
        />
      )}

    </div>
  );
}
