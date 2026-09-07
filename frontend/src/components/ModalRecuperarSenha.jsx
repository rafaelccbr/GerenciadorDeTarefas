import { useState } from 'react';
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
      {/* Card Estilizado com Vidro, Chanfro Luminoso e Glow Violeta */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-white/[0.14] via-[#2f0440]/65 to-[#1c0228]/85 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 sm:p-10 text-center text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_45px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] animate-fade-in">
        
        {/* Botão Fechar no Topo Direito */}
        <button
          onClick={aoFechar}
          type="button"
          className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>

        {/* Ícone de Destaque com efeito vidro */}
        <div className="w-14 h-14 mx-auto mb-4 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-purple-200 shadow-md backdrop-blur-sm">
          <KeyRound className="w-7 h-7 text-purple-200" />
        </div>

        {/* Título Principal */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-wide text-white drop-shadow-sm">
          Recuperar Senha
        </h2>

        {/* Estado 1: Mensagem de Sucesso */}
        {sucesso ? (
          <div className="space-y-5 my-4">
            <div className="w-14 h-14 mx-auto bg-green-500/20 border border-green-400/50 rounded-2xl flex items-center justify-center text-green-300 shadow-[0_0_25px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>

            <p className="text-sm sm:text-base text-purple-100 font-medium leading-relaxed">
              Se o e-mail informado estiver cadastrado, enviamos as instruções para redefinir sua senha:
            </p>

            <div className="p-3 bg-white/10 border border-white/15 rounded-2xl">
              <p className="text-sm sm:text-base font-semibold text-yellow-300 break-all">
                {email}
              </p>
            </div>

            <p className="text-xs text-purple-200/80">
              (Lembre-se de conferir sua caixa de entrada e pasta de spam)
            </p>

            <div className="pt-3">
              <button
                type="button"
                onClick={aoFechar}
                className="w-full px-8 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Login
              </button>
            </div>
          </div>
        ) : (
          /* Estado 2: Formulário de Solicitação */
          <form onSubmit={handleSubmit} className="space-y-5 mt-3">
            <p className="text-sm text-purple-200/90 font-normal leading-relaxed">
              Digite seu e-mail cadastrado para receber o link de redefinição de senha com segurança.
            </p>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs sm:text-sm rounded-2xl animate-fade-in text-center">
                {erro}
              </div>
            )}

            {/* Campo de E-mail */}
            <div className="flex flex-col items-center w-full">
              <label className="text-sm font-medium text-purple-200 mb-2">
                E-mail Cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-6 py-3.5 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full text-center focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
                required
                autoFocus
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="submit"
                disabled={carregando}
                className="w-full sm:w-auto px-8 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-sm sm:text-base font-semibold rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                {carregando ? 'Enviando...' : 'Enviar Link'}
              </button>

              <button
                type="button"
                onClick={aoFechar}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-purple-200 hover:text-white text-sm sm:text-base font-medium rounded-full border border-white/20 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
