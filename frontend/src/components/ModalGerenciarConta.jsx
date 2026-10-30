import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useState, useEffect } from 'react';
import { Sparkles, Moon, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/theme.js';
import { atualizarPerfilApi, excluirContaApi, segurancaContaApi, configurarSenhaApi } from '../services/api.js';

/**
 * ============================================================================
 * MODAL DE GERENCIAMENTO DE CONTA
 * ============================================================================
 * Permite ao usuário logado:
 * 1. Alterar seus dados pessoais (Nome e E-mail) e Tema (Claro / Dark).
 * 2. Redefinir sua senha com validação de confirmação.
 * 3. Excluir permanentemente sua conta e todas as tarefas vinculadas.
 *
 * Organizado em 3 abas didáticas:
 * - 'perfil': Dados cadastrais e preferências de tema
 * - 'senha': Alteração de senha
 * - 'excluir': Zona de perigo com dupla confirmação
 */
export function ModalGerenciarConta({ usuario, aoAtualizarUsuario, aoExcluirConta, aoFechar, abaInicial = 'perfil' }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const { tema, setTema } = useTheme();
  const ehDark = tema === 'dark';
  const [abaAtiva, setAbaAtiva] = useState(abaInicial); // 'perfil' | 'senha' | 'excluir'

  // Estados da Aba: Perfil
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estados da Aba: Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [novaSenhaFocada, setNovaSenhaFocada] = useState(false);

  // Estados da Aba: Excluir Conta
  const [confirmouExclusao, setConfirmouExclusao] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  // Mensagens de Feedback
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [seguranca, setSeguranca] = useState(null);
  useEffect(() => {
    let ativo = true;
    segurancaContaApi().then(dados => { if (ativo) setSeguranca(dados); }).catch(() => { if (ativo) setErro('Não foi possível verificar as opções da conta. Feche e abra Minha conta para tentar novamente.'); });
    return () => { ativo = false; };
  }, []);

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

    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (!/[A-Z]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos uma letra maiúscula.');
      return;
    }

    if (!/[0-9]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos um número.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos um caractere especial (ex: !@#$%&*).');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setSalvandoSenha(true);
      if (seguranca?.senhaConfigurada) await atualizarPerfilApi({ senha: novaSenha, senhaAtual });
      else await configurarSenhaApi(novaSenha);
      setSeguranca(prev => ({ ...prev, senhaConfigurada: true }));
      setSenhaAtual('');
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
      await excluirContaApi(senhaExclusao);
      aoExcluirConta();
    } catch (err) {
      setErro(err.message || 'Erro ao excluir a conta.');
      setExcluindo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65  p-3 sm:p-4">
      {/* Card do Modal com Efeito Vidro Translúcido, Chanfro e Glow */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className={`dialog-surface bg-(--surface) relative w-full max-w-lg  rounded-3xl p-5 sm:p-8 text-(--ink)  max-h-[90dvh] overflow-y-auto no-scrollbar transition-colors duration-500 ${
        ehDark
          ? '    border border-(--border) '
          : '    border border-(--border) '
      }`}>

        {/* Botão Fechar no Topo Direito */}
        <button aria-label="Fechar diálogo" aria-keyshortcuts="Escape"
          onClick={aoFechar}
          type="button"
          className={"ui-button dialog-close " + ("absolute top-4 right-4 sm:top-5 sm:right-5 text-(--ink) hover:text-(--ink) bg-(--surface) hover:bg-(--surface) rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer")}
        >
            <span>Fechar</span> <Tecla>Esc</Tecla>
          </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5 sm:mb-6 pr-6 pl-2">
          <h2 className="text-xl sm:text-2xl font-bold  text-(--ink)">
            Minha Conta
          </h2>
          <p className="text-xs sm:text-sm text-(--ink) mt-1">
            Gerencie suas informações cadastrais e preferências de segurança
          </p>
        </div>

        {/* Seletor de Abas (Pílulas Responsivas) */}
        <div className="flex justify-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-black/30  rounded-full mb-5 sm:mb-6 border border-(--border)">
          <button aria-pressed={abaAtiva === 'perfil'}
            type="button"
            onClick={() => trocarAba('perfil')}
            className={"ui-button " + (`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold rounded-full transition-colors cursor-pointer ${
              abaAtiva === 'perfil'
                ? 'bg-(--surface-muted) text-(--ink) '
                : 'text-(--ink) hover:text-(--ink) hover:bg-(--surface)'
            }`)}
          >
            Perfil
          </button>

          <button aria-pressed={abaAtiva === 'senha'}
            type="button"
            onClick={() => trocarAba('senha')}
            className={"ui-button " + (`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold rounded-full transition-colors cursor-pointer ${
              abaAtiva === 'senha'
                ? 'bg-(--surface-muted) text-(--ink) '
                : 'text-(--ink) hover:text-(--ink) hover:bg-(--surface)'
            }`)}
          >
            Senha
          </button>

          <button aria-pressed={abaAtiva === 'excluir'}
            type="button"
            onClick={() => trocarAba('excluir')}
            className={"ui-button ui-danger " + (`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold rounded-full transition-colors cursor-pointer ${
              abaAtiva === 'excluir'
                ? 'bg-red-500 text-(--ink) '
                : 'text-red-300 hover:text-red-200 hover:bg-red-500/20'
            }`)}
          >
            Excluir Conta
          </button>
        </div>

        {/* Alerta de Sucesso */}
        {mensagemSucesso && (
          <div className="mb-5 p-3 bg-green-500/20 border border-green-400/50 text-(--accent) text-sm rounded-2xl  text-center font-medium">
             {mensagemSucesso}
          </div>
        )}

        {/* Alerta de Erro */}
        {erro && (
          <div className="mb-5 p-3 bg-red-500/25 border border-red-500/50 text-red-200 text-sm rounded-2xl  text-center">
            {erro}
          </div>
        )}

        {/* ==================================================================== */}
        {/* ABA 1: DADOS DO PERFIL                                               */}
        {/* ==================================================================== */}
        {abaAtiva === 'perfil' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5 text-left pl-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className={`w-full px-5 py-3 rounded-2xl text-left focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                    : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5 text-left pl-1">
                E-mail
              </label>
              <input
                readOnly={!seguranca?.emailAlteravel}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className={`w-full px-5 py-3 rounded-2xl text-left focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                    : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                }`}
                required
              />
              <p className="text-xs text-(--ink) mt-1.5 text-left pl-1">
                {seguranca?.emailAlteravel ? 'Alterações de e-mail precisam ser confirmadas no novo endereço.' : 'O e-mail identifica sua conta de acesso.'}
              </p>
            </div>

            {/* Preferência de Tema */}
            <div className="pt-1 text-left">
              <label className="block text-sm font-medium text-(--ink) mb-2 pl-1">
                Aparência da Interface
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button aria-pressed={tema === 'light'}
                  type="button"
                  onClick={() => setTema('light')}
                  className={"ui-button " + (`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors cursor-pointer text-xs sm:text-sm font-semibold ${
                    tema === 'light'
                      ? 'bg-(--surface-muted) border-(--border) text-(--ink) '
                      : 'bg-(--surface) border-(--border) text-(--ink) hover:bg-(--surface) hover:text-(--ink)'
                  }`)}
                >
                  <Sparkles className="w-4 h-4 text-(--muted)" />
                  Tema Violeta
                </button>
                <button aria-pressed={tema === 'dark'}
                  type="button"
                  onClick={() => setTema('dark')}
                  className={"ui-button " + (`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors cursor-pointer text-xs sm:text-sm font-semibold ${
                    tema === 'dark'
                      ? 'bg-(--surface-muted) border-(--border) text-(--ink) '
                      : 'bg-(--surface) border-(--border) text-(--ink) hover:bg-(--surface) hover:text-(--ink)'
                  }`)}
                >
                  <Moon className="w-4 h-4 text-(--muted)" />
                  Tema Noturno
                </button>
              </div>
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button aria-keyshortcuts="Escape"
                type="button"
                onClick={aoFechar}
                className={"ui-button " + ("w-full sm:w-auto px-5 py-2.5 bg-(--surface) hover:bg-(--surface) text-(--ink) hover:text-(--ink) rounded-full transition-colors cursor-pointer text-sm font-medium")}
              >
                Cancelar
               <Tecla>Esc</Tecla></button>
              <button
                type="submit"
                disabled={salvandoPerfil}
                className={"ui-button ui-primary " + ("w-full sm:w-auto px-7 py-2.5 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) font-semibold rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer text-sm disabled:opacity-50")}
              >
                {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
               <Tecla>Enter</Tecla></button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* ABA 2: ALTERAÇÃO DE SENHA                                            */}
        {/* ==================================================================== */}
        {abaAtiva === 'senha' && (
          <form onSubmit={handleAtualizarSenha} className="space-y-4">
{seguranca?.senhaConfigurada ? <div className="field"><label htmlFor="current-password">Senha atual</label><input id="current-password" type="password" autoComplete="current-password" required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} /></div> : <p className="text-sm text-(--muted)">Crie uma senha para também entrar com seu e-mail. O acesso com Google continua disponível.</p>}
            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5 text-left pl-1">
                Nova Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  onFocus={() => setNovaSenhaFocada(true)}
                  onBlur={() => setNovaSenhaFocada(false)}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full pl-5 pr-12 py-3 rounded-2xl text-left focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                    ehDark
                      ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                      : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                  }`}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className={"ui-button " + (`absolute right-3.5 p-1 rounded-full transition-colors cursor-pointer focus:outline-none ${
                    ehDark
                      ? 'text-(--ink) hover:text-(--ink) hover:bg-(--surface)'
                      : 'text-(--muted) hover:text-(--ink) hover:bg-(--surface-muted)'
                  }`)}
                  title={mostrarNovaSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={mostrarNovaSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {novaSenhaFocada && (
                <div className={`text-xs space-y-1.5 border rounded-2xl p-3 text-left transition-colors   mt-2 ${
                  ehDark ? 'bg-black/40 border-(--border) text-(--ink)' : 'bg-(--surface) border-(--border) text-(--ink)'
                }`}>
                  <p className="font-semibold text-(--ink) text-xs mb-1">Requisitos de segurança:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className={`flex items-center gap-1.5 ${novaSenha.length >= 8 ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                      {novaSenha.length >= 8 ? '' : '○'} Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[A-Z]/.test(novaSenha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                      {/[A-Z]/.test(novaSenha) ? '' : '○'} 1 Letra maiúscula
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[0-9]/.test(novaSenha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                      {/[0-9]/.test(novaSenha) ? '' : '○'} 1 Número
                    </span>
                    <span className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(novaSenha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                      {/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(novaSenha) ? '' : '○'} 1 Caractere especial
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-(--ink) mb-1.5 text-left pl-1">
                Confirmar Nova Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={`w-full pl-5 pr-12 py-3 rounded-2xl text-left focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                    ehDark
                      ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                      : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                  }`}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className={"ui-button " + (`absolute right-3.5 p-1 rounded-full transition-colors cursor-pointer focus:outline-none ${
                    ehDark
                      ? 'text-(--ink) hover:text-(--ink) hover:bg-(--surface)'
                      : 'text-(--muted) hover:text-(--ink) hover:bg-(--surface-muted)'
                  }`)}
                  title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button aria-keyshortcuts="Escape"
                type="button"
                onClick={aoFechar}
                className={"ui-button " + ("w-full sm:w-auto px-5 py-2.5 bg-(--surface) hover:bg-(--surface) text-(--ink) hover:text-(--ink) rounded-full transition-colors cursor-pointer text-sm font-medium")}
              >
                Cancelar
               <Tecla>Esc</Tecla></button>
              <button
                type="submit"
                disabled={salvandoSenha || !seguranca}
                className={"ui-button ui-primary " + ("w-full sm:w-auto px-7 py-2.5 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) font-semibold rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer text-sm disabled:opacity-50")}
              >
                {salvandoSenha ? 'Atualizando...' : 'Atualizar Senha'}
               <Tecla>Enter</Tecla></button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* ABA 3: ZONA DE PERIGO (EXCLUSÃO DE CONTA)                            */}
        {/* ==================================================================== */}
        {abaAtiva === 'excluir' && (
          <form onSubmit={handleExcluirConta} className="space-y-4 text-left">
{seguranca?.senhaConfigurada && <div className="field"><label htmlFor="delete-password">Confirme sua senha</label><input id="delete-password" type="password" autoComplete="current-password" required value={senhaExclusao} onChange={e => setSenhaExclusao(e.target.value)} /></div>}
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-2xl text-red-200 text-sm space-y-2">
              <p className="font-bold text-red-300 flex items-center gap-1.5">
                 Ação Permanente e Irreversível
              </p>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Ao excluir sua conta, suas tarefas, seu perfil e suas sessões serão apagados permanentemente. Salve um backup antes de continuar.
              </p>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="confirma-exclusao"
                checked={confirmouExclusao}
                onChange={(e) => setConfirmouExclusao(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-(--border) cursor-pointer"
              />
              <label htmlFor="confirma-exclusao" className="text-xs text-(--ink) cursor-pointer select-none">
                Estou ciente e concordo com a exclusão definitiva de todos os meus dados e tarefas.
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--ink) mb-1">
                Para confirmar, digite <span className="text-red-400 font-bold">EXCLUIR</span> no campo abaixo:
              </label>
              <input
                type="text"
                value={textoConfirmacao}
                onChange={(e) => setTextoConfirmacao(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full px-4 py-2.5 bg-red-950/40 border border-red-400/50 text-(--ink) rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-red-300/40 text-sm font-semibold  "
              />
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button aria-keyshortcuts="Escape"
                type="button"
                onClick={aoFechar}
                className={"ui-button " + ("w-full sm:w-auto px-5 py-2.5 bg-(--surface) hover:bg-(--surface) text-(--ink) hover:text-(--ink) rounded-full transition-colors cursor-pointer text-sm font-medium")}
              >
                Voltar
               <Tecla>Esc</Tecla></button>
              <button
                type="submit"
                disabled={!seguranca || excluindo || !confirmouExclusao || textoConfirmacao.trim().toUpperCase() !== 'EXCLUIR'}
                className={"ui-button ui-danger " + ("w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-(--ink) font-bold rounded-full   border border-red-400/40 transition-colors cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                {excluindo ? 'Excluindo...' : 'Excluir Minha Conta'}
               <Tecla>Enter</Tecla></button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
