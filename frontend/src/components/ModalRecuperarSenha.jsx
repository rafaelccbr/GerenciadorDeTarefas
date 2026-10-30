import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useState } from 'react';
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/theme.js';
import { recuperarSenhaApi } from '../services/api.js';

/**
 * ============================================================================
 * MODAL DE RECUPERAÇÃO DE SENHA (Esqueceu a senha?)
 * ============================================================================
 * Permite ao usuário solicitar a redefinição de sua senha através do e-mail.
 *
 * Estilo visual:
 * - Card translúcido em gradiente com efeito glassmorphism premium
 * - Borda iluminada com chanfro de luz superior (inset)
 * - Glow violeta ambiente coerente com as telas de Login e Cadastro
 * - Botão de fechar (X) e ícones elegantes da biblioteca Lucide
 */
export function ModalRecuperarSenha({ aoFechar }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!email.trim()) {
      setErro('Por favor, informe o seu e-mail cadastrado.');
      return;
    }

    try {
      setCarregando(true);
      // Chama o endpoint POST /auth/recuperar-senha no backend
      await recuperarSenhaApi(email.trim());
      setSucesso(true);
    } catch (err) {
      setErro(err.message || 'Falha ao solicitar recuperação de senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65  p-3 sm:p-4">
      {/* Card Estilizado com Vidro, Chanfro Luminoso e Glow Violeta */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className={`dialog-surface bg-(--surface) relative w-full max-w-md  rounded-3xl p-6 sm:p-10 text-center text-(--ink) transition-colors duration-500  max-h-[90dvh] overflow-y-auto no-scrollbar ${
        ehDark
          ? '    border border-(--border) '
          : '    border border-(--border) '
      }`}>

        {/* Botão Fechar no Topo Direito */}
        <button aria-label="Fechar diálogo" aria-keyshortcuts="Escape"
          onClick={aoFechar}
          type="button"
          className={"ui-button dialog-close " + ("absolute top-4 right-4 sm:top-5 sm:right-5 text-(--ink) hover:text-(--ink) bg-(--surface) hover:bg-(--surface) rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer")}
          title="Fechar"
        >
            <span>Fechar</span> <Tecla>Esc</Tecla>
          </button>

        {/* Ícone de Destaque com efeito vidro */}
        <div className="w-14 h-14 mx-auto mb-4 bg-(--surface) border border-(--border) rounded-2xl flex items-center justify-center text-(--ink)  ">
          <KeyRound className="w-7 h-7 text-(--ink)" />
        </div>

        {/* Título Principal */}
        <h2 className="text-2xl sm:text-2xl font-bold mb-2  text-(--ink) ">
          Recuperar Senha
        </h2>

        {/* Estado 1: Mensagem de Sucesso */}
        {sucesso ? (
          <div className="space-y-5 my-4">
            <div className="w-14 h-14 mx-auto bg-green-500/20 border border-green-400/50 rounded-2xl flex items-center justify-center text-(--accent) ">
              <CheckCircle2 className="w-8 h-8 text-(--accent)" />
            </div>

            <p className="text-sm sm:text-base text-(--ink) font-medium leading-relaxed">
              Se o e-mail informado estiver cadastrado, enviamos as instruções para redefinir sua senha:
            </p>

            <div className="p-3 bg-(--surface) border border-(--border) rounded-2xl">
              <p className="text-sm sm:text-base font-semibold text-(--accent) break-all">
                {email}
              </p>
            </div>

            <p className="text-xs text-(--ink)">
              (Lembre-se de conferir sua caixa de entrada e pasta de spam)
            </p>

            <div className="pt-3">
              <button aria-keyshortcuts="Escape"
                type="button"
                onClick={aoFechar}
                className={"ui-button " + ("w-full px-8 py-3 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) font-semibold rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2")}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Login
               <Tecla>Esc</Tecla></button>
            </div>
          </div>
        ) : (
          /* Estado 2: Formulário de Solicitação */
          <form onSubmit={handleSubmit} className="space-y-5 mt-3">
            <p className="text-sm text-(--ink) font-normal leading-relaxed">
              Digite seu e-mail cadastrado para receber o link de redefinição de senha com segurança.
            </p>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs sm:text-sm rounded-2xl  text-center">
                {erro}
              </div>
            )}

            {/* Campo de E-mail */}
            <div className="flex flex-col items-center w-full">
              <label className={`text-sm font-medium mb-2 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
                E-mail Cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className={`w-full px-6 py-3.5 rounded-full text-center focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                  ehDark
                    ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                    : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                }`}
                required
                autoFocus
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="submit"
                disabled={carregando}
                className={"ui-button ui-primary " + ("w-full sm:w-auto px-8 py-3 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) text-sm sm:text-base font-semibold rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer disabled:opacity-50")}
              >
                {carregando ? 'Enviando...' : 'Enviar Link'}
               <Tecla>Enter</Tecla></button>

              <button aria-keyshortcuts="Escape"
                type="button"
                onClick={aoFechar}
                className={"ui-button " + ("w-full sm:w-auto px-6 py-3 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) hover:text-(--ink) text-sm sm:text-base font-medium rounded-full border border-(--border) transition-colors cursor-pointer")}
              >
                Cancelar
               <Tecla>Esc</Tecla></button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
