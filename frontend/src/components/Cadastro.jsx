import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { cadastroApi } from '../services/api.js';

/**
 * ============================================================================
 * TELA DE CADASTRO
 * ============================================================================
 * Baseado no design do Figma: 'Cadastro.png'
 * Suporta Tema Violeta e Tema Dark (Midnight Amethyst).
 */
export function Cadastro({ aoVoltarParaLogin, aoAbrirTermos, aoCadastroSucesso }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaFocada, setSenhaFocada] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validações básicas no frontend
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (!/[A-Z]/.test(senha)) {
      setErro('A senha deve conter pelo menos uma letra maiúscula.');
      return;
    }

    if (!/[0-9]/.test(senha)) {
      setErro('A senha deve conter pelo menos um número.');
      return;
    }

    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(senha)) {
      setErro('A senha deve conter pelo menos um caractere especial (ex: !@#$%&*).');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem. Digite novamente.');
      return;
    }

    if (!aceitouTermos) {
      setErro('Você deve aceitar os Termos de Uso e Política de Privacidade.');
      return;
    }

    try {
      setCarregando(true);
      // Dispara o cadastro para o backend Fastify
      await cadastroApi(nome.trim(), email.trim(), senha);

      // Notifica o componente pai passando o e-mail cadastrado
      aoCadastroSucesso(email.trim());
    } catch (err) {
      setErro(err.message || 'Erro ao realizar o cadastro. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh w-full flex flex-col items-center justify-center px-4 py-6 sm:py-10 text-white transition-colors duration-500">
      
      {/* Botão Voltar Adaptativo */}
      <div className="w-full max-w-xl flex justify-start mb-2 sm:mb-4">
        <button
          type="button"
          onClick={aoVoltarParaLogin}
          className="flex items-center gap-1.5 text-white/90 hover:text-white font-semibold text-sm sm:text-base transition-all cursor-pointer active:scale-95 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/15 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Voltar
        </button>
      </div>

      {/* Card Estilizado de Cadastro com Glassmorphism Translúcido e Borda com Brilho */}
      <div className={`w-full max-w-xl backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-10 flex flex-col items-center text-center transition-all duration-500 animate-fade-in my-auto ${
        ehDark
          ? 'bg-gradient-to-b from-white/[0.08] via-[#140b20]/90 to-[#0a0610]/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.14),inset_0_1px_1px_rgba(255,255,255,0.15)]'
          : 'bg-gradient-to-b from-white/[0.13] via-[#2f0440]/60 to-[#1c0228]/80 border border-white/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_45px_rgba(168,85,247,0.18),inset_0_1px_1px_rgba(255,255,255,0.3)]'
      }`}>
        
        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl font-bold mb-2 tracking-wide text-white drop-shadow-sm">
          Crie sua conta
        </h1>

        {/* Subtítulo */}
        <p className={`text-sm sm:text-lg mb-6 sm:mb-8 font-normal ${ehDark ? 'text-purple-200/80' : 'text-purple-200/90'}`}>
          Preencha os dados abaixo para criar sua conta
        </p>

        {/* Alerta de Erro */}
        {erro && (
          <div className="w-full mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-2xl animate-fade-in text-left">
            {erro}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
          
          {/* Campo: Nome Completo */}
          <div>
            <label className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              className={`w-full px-5 py-3 rounded-full focus:outline-none focus:ring-4 transition-all font-medium border shadow-md ${
                ehDark
                  ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] text-white placeholder-purple-200/50 border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                  : 'bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500 border-white/30 focus:border-purple-400 focus:ring-purple-400/50'
              }`}
              required
            />
          </div>

          {/* Campo: E-mail */}
          <div>
            <label className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className={`w-full px-5 py-3 rounded-full focus:outline-none focus:ring-4 transition-all font-medium border shadow-md ${
                ehDark
                  ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] text-white placeholder-purple-200/50 border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                  : 'bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500 border-white/30 focus:border-purple-400 focus:ring-purple-400/50'
              }`}
              required
            />
          </div>

          {/* Linha com Senha e Confirmar Senha lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Campo: Senha */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onFocus={() => setSenhaFocada(true)}
                  onBlur={() => setSenhaFocada(false)}
                  placeholder="••••••••"
                  className={`w-full pl-5 pr-12 py-3 rounded-full focus:outline-none focus:ring-4 transition-all font-medium border shadow-md ${
                    ehDark
                      ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] text-white placeholder-purple-200/50 border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                      : 'bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500 border-white/30 focus:border-purple-400 focus:ring-purple-400/50'
                  }`}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className={`absolute right-3.5 p-1.5 rounded-full transition-all cursor-pointer focus:outline-none active:scale-95 ${
                    ehDark
                      ? 'text-white bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 hover:border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'text-gray-700 hover:text-gray-900 bg-gray-200/80 hover:bg-gray-300 border border-gray-300/80 shadow-sm'
                  }`}
                  title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Campo: Confirmar Senha */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
                Confirmar senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-5 pr-12 py-3 rounded-full focus:outline-none focus:ring-4 transition-all font-medium border shadow-md ${
                    ehDark
                      ? 'bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.16] text-white placeholder-purple-200/50 border-white/20 focus:border-purple-400 focus:ring-purple-400/50'
                      : 'bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500 border-white/30 focus:border-purple-400 focus:ring-purple-400/50'
                  }`}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className={`absolute right-3.5 p-1.5 rounded-full transition-all cursor-pointer focus:outline-none active:scale-95 ${
                    ehDark
                      ? 'text-white bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 hover:border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'text-gray-700 hover:text-gray-900 bg-gray-200/80 hover:bg-gray-300 border border-gray-300/80 shadow-sm'
                  }`}
                  title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

          </div>

          {/* Indicadores Visuais de Requisitos da Senha - Aparece apenas quando a caixa da senha for clicada/focada */}
          {senhaFocada && (
            <div className={`text-xs space-y-1.5 border rounded-2xl p-3 text-left transition-all animate-fade-in shadow-inner ${
              ehDark ? 'bg-black/40 border-white/15 text-purple-200/80' : 'bg-white/5 border-white/10 text-purple-200/80'
            }`}>
              <p className={`font-semibold text-xs mb-1 ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>Requisitos de segurança:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <span className={`flex items-center gap-1.5 ${senha.length >= 8 ? 'text-green-400 font-semibold' : 'text-purple-300/70'}`}>
                  {senha.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                </span>
                <span className={`flex items-center gap-1.5 ${/[A-Z]/.test(senha) ? 'text-green-400 font-semibold' : 'text-purple-300/70'}`}>
                  {/[A-Z]/.test(senha) ? '✓' : '○'} 1 Letra maiúscula
                </span>
                <span className={`flex items-center gap-1.5 ${/[0-9]/.test(senha) ? 'text-green-400 font-semibold' : 'text-purple-300/70'}`}>
                  {/[0-9]/.test(senha) ? '✓' : '○'} 1 Número
                </span>
                <span className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(senha) ? 'text-green-400 font-semibold' : 'text-purple-300/70'}`}>
                  {/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(senha) ? '✓' : '○'} 1 Caractere especial
                </span>
              </div>
            </div>
          )}

          {/* Checkbox Termos de Uso */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
            <label htmlFor="termos" className={`text-xs sm:text-sm select-none cursor-pointer ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
              Li e concordo com os{' '}
              <button
                type="button"
                onClick={() => aoAbrirTermos?.(() => setAceitouTermos(true))}
                className="text-yellow-400 hover:text-yellow-300 font-semibold underline cursor-pointer"
              >
                Termos de Uso
              </button>{' '}
              e{' '}
              <button
                type="button"
                onClick={() => aoAbrirTermos?.(() => setAceitouTermos(true))}
                className="text-yellow-400 hover:text-yellow-300 font-semibold underline cursor-pointer"
              >
                Política de Privacidade
              </button>
            </label>
          </div>

          {/* Botão Criar Conta em Cristal Translúcido */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={carregando}
              className="px-14 py-3.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-lg font-semibold rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>

        </form>

        {/* Rodapé: Link para Login */}
        <div className="mt-8 pt-6 border-t border-white/15 w-full">
          <p className={`text-sm sm:text-base font-medium ${ehDark ? 'text-purple-200' : 'text-purple-100'}`}>
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={aoVoltarParaLogin}
              className="text-[#e2583e] hover:text-[#ff7043] font-bold hover:underline cursor-pointer transition-colors"
            >
              Faça Login
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
