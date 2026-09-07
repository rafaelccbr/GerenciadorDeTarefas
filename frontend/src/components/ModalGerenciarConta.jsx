import { useState } from 'react';
import { atualizarPerfilApi, excluirContaApi } from '../services/api.js';

/**
 * ============================================================================
 * MODAL DE GERENCIAMENTO DE CONTA
 * ============================================================================
 * Permite ao usuário logado:
 * 1. Alterar seus dados pessoais (Nome e E-mail).
 * 2. Redefinir sua senha com validação de confirmação.
 * 3. Excluir permanentemente sua conta e todas as tarefas vinculadas.
 * 
 * Organizado em 3 abas didáticas:
 * - 'perfil': Dados cadastrais
 * - 'senha': Alteração de senha
 * - 'excluir': Zona de perigo com dupla confirmação
 */
export function ModalGerenciarConta({ usuario, aoAtualizarUsuario, aoExcluirConta, aoFechar }) {
  const [abaAtiva, setAbaAtiva] = useState('perfil'); // 'perfil' | 'senha' | 'excluir'

  // Estados da Aba: Perfil
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estados da Aba: Senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Estados da Aba: Excluir Conta
  const [confirmouExclusao, setConfirmouExclusao] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  // Mensagens de Feedback
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Limpa mensagens ao trocar de aba
  const trocarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    setMensagemSucesso('');
    setErro('');
  };

  // --------------------------------------------------------------------------
  // 1. AÇÃO: Salvar alterações no Perfil (Nome e/ou E-mail)
  // --------------------------------------------------------------------------
  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    if (!nome.trim()) {
      setErro('O nome não pode estar em branco.');
      return;
    }

    try {
      setSalvandoPerfil(true);
      const resposta = await atualizarPerfilApi({
        nome: nome.trim(),
        email: email.trim() !== usuario?.email ? email.trim() : undefined,
      });

      setMensagemSucesso(resposta.mensagem || 'Dados atualizados com sucesso!');
      aoAtualizarUsuario(resposta.usuario);
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // --------------------------------------------------------------------------
  // 2. AÇÃO: Atualizar Senha
  // --------------------------------------------------------------------------
  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setSalvandoSenha(true);
      await atualizarPerfilApi({ senha: novaSenha });
      setMensagemSucesso('Senha atualizada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. AÇÃO: Excluir Permanentemente a Conta
  // --------------------------------------------------------------------------
  const handleExcluirConta = async (e) => {
    e.preventDefault();
    setErro('');

    if (!confirmouExclusao) {
      setErro('Por favor, marque a caixa confirmando que está ciente da exclusão.');
      return;
    }

    if (textoConfirmacao.trim().toUpperCase() !== 'EXCLUIR') {
      setErro('Digite a palavra EXCLUIR para confirmar a exclusão definitiva.');
      return;
    }

    try {
      setExcluindo(true);
      await excluirContaApi();
      aoExcluirConta();
    } catch (err) {
      setErro(err.message || 'Erro ao excluir a conta.');
      setExcluindo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
      {/* Card do Modal com Efeito Vidro Translúcido, Chanfro e Glow */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-white/[0.14] via-[#2f0440]/65 to-[#1c0228]/85 backdrop-blur-2xl border border-white/25 rounded-3xl p-6 sm:p-8 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_45px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] animate-fade-in max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Botão Fechar no Topo Direito */}
        <button
          onClick={aoFechar}
          type="button"
          className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
            Minha Conta
          </h2>
          <p className="text-sm text-purple-200/80 mt-1">
            Gerencie suas informações cadastrais e preferências de segurança
          </p>
        </div>

        {/* Seletor de Abas (Pílulas) */}
        <div className="flex justify-center gap-2 p-1.5 bg-black/30 backdrop-blur-md rounded-full mb-6 border border-white/15">
          <button
            type="button"
            onClick={() => trocarAba('perfil')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
              abaAtiva === 'perfil'
                ? 'bg-[#00b4d8] text-gray-900 shadow-md'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Perfil
          </button>

          <button
            type="button"
            onClick={() => trocarAba('senha')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
              abaAtiva === 'senha'
                ? 'bg-[#00b4d8] text-gray-900 shadow-md'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Senha
          </button>

          <button
            type="button"
            onClick={() => trocarAba('excluir')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
              abaAtiva === 'excluir'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-red-300 hover:text-red-200 hover:bg-red-500/20'
            }`}
          >
            Excluir Conta
          </button>
        </div>

        {/* Alerta de Sucesso */}
        {mensagemSucesso && (
          <div className="mb-5 p-3 bg-green-500/20 border border-green-400/50 text-green-200 text-sm rounded-2xl animate-fade-in text-center font-medium">
            ✓ {mensagemSucesso}
          </div>
        )}

        {/* Alerta de Erro */}
        {erro && (
          <div className="mb-5 p-3 bg-red-500/25 border border-red-500/50 text-red-200 text-sm rounded-2xl animate-fade-in text-center">
            {erro}
          </div>
        )}

        {/* ==================================================================== */}
        {/* ABA 1: DADOS DO PERFIL                                               */}
        {/* ==================================================================== */}
        {abaAtiva === 'perfil' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5 text-left pl-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-2xl text-left focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5 text-left pl-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-2xl text-left focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
                required
              />
              <p className="text-xs text-purple-200/70 mt-1.5 text-left pl-1">
                * Caso altere o e-mail, pode ser necessário confirmá-lo novamente pelo link enviado.
              </p>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={aoFechar}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-full transition-all cursor-pointer text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoPerfil}
                className="px-7 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_15px_rgba(255,255,255,0.12)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(168,85,247,0.3)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer text-sm disabled:opacity-50"
              >
                {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* ABA 2: ALTERAÇÃO DE SENHA                                            */}
        {/* ==================================================================== */}
        {abaAtiva === 'senha' && (
          <form onSubmit={handleAtualizarSenha} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5 text-left pl-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-2xl text-left focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5 text-left pl-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-2xl text-left focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
                required
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={aoFechar}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-full transition-all cursor-pointer text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoSenha}
                className="px-7 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_15px_rgba(255,255,255,0.12)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(168,85,247,0.3)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer text-sm disabled:opacity-50"
              >
                {salvandoSenha ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* ABA 3: ZONA DE PERIGO (EXCLUSÃO DE CONTA)                            */}
        {/* ==================================================================== */}
        {abaAtiva === 'excluir' && (
          <form onSubmit={handleExcluirConta} className="space-y-4 text-left">
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-2xl text-red-200 text-sm space-y-2">
              <p className="font-bold text-red-300 flex items-center gap-1.5">
                ⚠️ Ação Permanente e Irreversível
              </p>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Ao excluir sua conta, todas as suas tarefas, dados pessoais e acessos serão apagados permanentemente do sistema e do banco de dados do Supabase. Não será possível recuperar nenhuma informação.
              </p>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="confirma-exclusao"
                checked={confirmouExclusao}
                onChange={(e) => setConfirmouExclusao(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-white/30 cursor-pointer"
              />
              <label htmlFor="confirma-exclusao" className="text-xs text-purple-100 cursor-pointer select-none">
                Estou ciente e concordo com a exclusão definitiva de todos os meus dados e tarefas.
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Para confirmar, digite <span className="text-red-400 font-bold">EXCLUIR</span> no campo abaixo:
              </label>
              <input
                type="text"
                value={textoConfirmacao}
                onChange={(e) => setTextoConfirmacao(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full px-4 py-2.5 bg-red-950/40 border border-red-400/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-red-300/40 text-sm font-semibold tracking-wider uppercase"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={aoFechar}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-full transition-all cursor-pointer text-sm font-medium"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={excluindo || !confirmouExclusao || textoConfirmacao.trim().toUpperCase() !== 'EXCLUIR'}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-full shadow-lg shadow-red-900/40 border border-red-400/40 transition-all cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {excluindo ? 'Excluindo...' : 'Excluir Minha Conta'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

