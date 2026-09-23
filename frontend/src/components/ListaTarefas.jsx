import { useState, useEffect } from 'react';
import { LogOut, PlusCircle, SquarePen, Trash2, Settings } from 'lucide-react';
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

/**
 * ============================================================================
 * TELA PRINCIPAL (LISTA DE TAREFAS / DASHBOARD)
 * ============================================================================
 * Suporta Tema Violeta (Figma clássico) e Tema Dark (Obsidian Glass).
 */
export function ListaTarefas({ usuario, aoDeslogar, aoAbrirConta }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
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

  // Alterna o status da tarefa ao clicar no badge (com Atualização Otimista Instantânea)
  const alternarProximoStatus = async (tarefa) => {
    const proximaOrdem = {
      pendente: 'em_andamento',
      em_andamento: 'concluido',
      concluido: 'pendente'
    };
    const novoStatus = proximaOrdem[tarefa.status] || 'pendente';
    const statusAnterior = tarefa.status;

    // 1. Atualização Otimista Imediata (0ms de delay na interface)
    setTarefas((atuais) =>
      atuais.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
    );

    // 2. Persistência assíncrona em segundo plano
    try {
      await atualizarStatusApi(tarefa.id, novoStatus);
    } catch (err) {
      // Se houver erro de rede, reverte o status para o anterior e avisa
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === tarefa.id ? { ...t, status: statusAnterior } : t))
      );
      alert(`Falha ao salvar alteração de status: ${err.message}`);
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

  // Exclui a tarefa com confirmação (com Atualização Otimista)
  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a tarefa "${nome}"?`)) {
      return;
    }

    const tarefasAnteriores = tarefas;

    // Remove imediatamente da interface (0ms)
    setTarefas((atuais) => atuais.filter((t) => t.id !== id));

    try {
      await excluirTarefaApi(id);
    } catch (err) {
      // Reverte se a exclusão falhar
      setTarefas(tarefasAnteriores);
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
    <div className="min-h-screen w-full p-4 sm:p-8 flex flex-col items-center transition-colors duration-500">
      
      {/* Container Principal */}
      <div className="w-full max-w-6xl flex flex-col space-y-4">
        
        {/* Barra Superior de Ações com Auto-Encaixe Responsivo */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full flex-wrap animate-slide-up">
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão Sair (Vidro Semi-Translúcido Ruby com Alta Nitidez) */}
            <button
              onClick={aoDeslogar}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-rose-500/40 hover:bg-rose-500/55 border border-rose-400/50 hover:border-rose-300/70 backdrop-blur-md text-white font-bold rounded-full shadow-[0_4px_15px_rgba(244,63,94,0.25)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-200 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-300" />
              Sair
            </button>

            {/* Botão Cadastrar (Vidro Semi-Translúcido Esmeralda com Alta Nitidez) */}
            <button
              onClick={handleNovoCadastro}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 bg-emerald-500/40 hover:bg-emerald-500/55 border border-emerald-300/60 hover:border-emerald-200/80 backdrop-blur-md text-white font-bold rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              Cadastrar
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seletor de Tema (Violeta / Dark) */}
            <SeletorTema />

            {/* Gerenciamento de Conta: "Olá, (nome)" com engrenagem no canto direito */}
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

        {/* Card Central com Efeito Glassmorphism e Sombra Suave (Adapta ao tema Violeta ou Dark) */}
        <div className={`w-full backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 min-h-[480px] sm:min-h-[520px] flex flex-col transition-all duration-500 animate-slide-up animate-delay-150 ${
          ehDark
            ? 'bg-gradient-to-b from-white/[0.08] via-[#140b20]/90 to-[#0a0610]/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-purple-100'
            : 'bg-white/95 border border-white/60 shadow-[0_16px_50px_rgba(0,0,0,0.25)] text-gray-800'
        }`}>
          
          {/* Mensagem de Erro, se houver */}
          {erro && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              ehDark 
                ? 'bg-red-950/50 border border-red-500/40 text-red-200' 
                : 'bg-red-100 border border-red-300 text-red-700'
            }`}>
              {erro}
            </div>
          )}

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
            /* Estado Vazio */
            <div className={`flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 ${ehDark ? 'text-zinc-400' : 'text-gray-400'}`}>
              <p className={`text-lg sm:text-xl font-semibold mb-2 ${ehDark ? 'text-zinc-200' : 'text-gray-600'}`}>Nenhuma tarefa encontrada</p>
              <p className={`text-xs sm:text-sm max-w-sm mb-6 ${ehDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Você ainda não tem tarefas cadastradas. Clique no botão verde "Cadastrar" acima para começar!
              </p>
              <button
                onClick={handleNovoCadastro}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-full shadow-lg shadow-emerald-600/30 transition-all cursor-pointer text-sm"
              >
                Criar primeira tarefa
              </button>
            </div>
          ) : (
            <>
              {/* Visualização em Cards para Smartphones (< md) */}
              <div className="block md:hidden space-y-3 w-full">
                {tarefas.map((tarefa, index) => (
                  <div 
                    key={`card-${tarefa.id}`}
                    className={`rounded-2xl p-4 shadow-sm transition-all text-left flex flex-col justify-between gap-3 border hover-lift animate-slide-up ${
                      ehDark
                        ? 'bg-white/[0.05] hover:bg-white/[0.08] border-purple-500/20 text-purple-100 shadow-md hover:shadow-lg'
                        : 'bg-purple-50/50 hover:bg-purple-50/80 border-purple-100/80 text-gray-900 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Topo do Card: Nome e Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-base leading-snug break-words flex-1 ${ehDark ? 'text-white' : 'text-gray-900'}`}>
                        {tarefa.nome}
                      </h3>
                      <button
                        type="button"
                        onClick={() => alternarProximoStatus(tarefa)}
                        title="Clique para alternar o status"
                        className={`shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-full font-semibold text-xs cursor-pointer transition-all shadow-sm active:scale-95 ${
                          tarefa.status === 'concluido'
                            ? ehDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                            : tarefa.status === 'em_andamento'
                            ? ehDark ? 'bg-purple-500/30 text-purple-100 border border-purple-400/50 hover:bg-purple-500/40 shadow-sm' : 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
                            : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        {rotuloStatus[tarefa.status] || tarefa.status}
                      </button>
                    </div>

                    {/* Meio: Datas de Início e Término */}
                    <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                      ehDark ? 'border-purple-500/15 text-purple-300/70' : 'border-purple-100/60 text-gray-500'
                    }`}>
                      <div>
                        <span className={ehDark ? 'text-purple-400/60' : 'text-gray-400'}>Início: </span>
                        <span className={`font-semibold ${ehDark ? 'text-purple-200' : 'text-gray-700'}`}>{formatarData(tarefa.data_come)}</span>
                      </div>
                      <div>
                        <span className={ehDark ? 'text-purple-400/60' : 'text-gray-400'}>Término: </span>
                        <span className={`font-semibold ${ehDark ? 'text-purple-200' : 'text-gray-700'}`}>{formatarData(tarefa.data_termi)}</span>
                      </div>
                    </div>

                    {/* Rodapé: Ações Editar e Excluir com touch targets confortáveis */}
                    <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
                      ehDark ? 'border-purple-500/15' : 'border-purple-100/60'
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleEditar(tarefa)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer active:scale-95 ${
                          ehDark
                            ? 'text-purple-200 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30'
                            : 'text-purple-700 hover:bg-purple-100/80 bg-purple-100/40'
                        }`}
                      >
                        <SquarePen className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer active:scale-95 ${
                          ehDark
                            ? 'text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40'
                            : 'text-rose-700 hover:bg-rose-100/80 bg-rose-100/40'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela Tradicional para Tablets e Desktops (>= md) */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  
                  {/* Cabeçalho da Tabela */}
                  <thead>
                    <tr className={`border-b text-base sm:text-lg font-bold ${
                      ehDark ? 'border-purple-500/20 text-purple-200' : 'border-gray-200 text-gray-900'
                    }`}>
                      <th className="py-4 px-4 font-bold">Tarefa</th>
                      <th className="py-4 px-4 font-bold text-center sm:text-left">Começa</th>
                      <th className="py-4 px-4 font-bold text-center sm:text-left">Termina</th>
                      <th className="py-4 px-4 font-bold text-center">Status</th>
                      <th className="py-4 px-4 font-bold text-right pr-6">Ações</th>
                    </tr>
                  </thead>

                  {/* Corpo da Tabela */}
                  <tbody className={`divide-y ${ehDark ? 'divide-purple-500/15' : 'divide-gray-200'}`}>
                    {tarefas.map((tarefa, index) => (
                      <tr 
                        key={tarefa.id} 
                        className={`transition-colors text-sm sm:text-base animate-slide-up ${ehDark ? 'hover-row-glow' : ''} ${
                          ehDark
                            ? 'hover:bg-purple-500/10 text-purple-200'
                            : 'hover:bg-purple-50/40 text-gray-800'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Coluna: Nome/Título */}
                        <td className={`py-4 px-4 font-medium max-w-xs sm:max-w-md break-words ${ehDark ? 'text-white font-semibold' : 'text-gray-900'}`}>
                          {tarefa.nome}
                        </td>

                        {/* Coluna: Data de Início */}
                        <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-purple-300/80' : 'text-gray-600'}`}>
                          {formatarData(tarefa.data_come)}
                        </td>

                        {/* Coluna: Data de Término */}
                        <td className={`py-4 px-4 whitespace-nowrap text-center sm:text-left ${ehDark ? 'text-purple-300/80' : 'text-gray-600'}`}>
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
                                ? ehDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                : tarefa.status === 'em_andamento'
                                ? ehDark ? 'bg-purple-500/30 text-purple-100 border border-purple-400/50 hover:bg-purple-500/40 shadow-sm' : 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
                                : ehDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
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
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark
                                  ? 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                                  : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                              }`}
                            >
                              <SquarePen className="w-5 h-5" />
                            </button>

                            {/* Botão Excluir */}
                            <button
                              type="button"
                              onClick={() => handleExcluir(tarefa.id, tarefa.nome)}
                              title="Excluir tarefa"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                ehDark
                                  ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50'
                                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              }`}
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
            </>
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
