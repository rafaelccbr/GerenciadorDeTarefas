import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cadastroApi } from '../services/api.js';

/**
 * ============================================================================
 * TELA DE CADASTRO
 * ============================================================================
 * Baseado no design do Figma: 'Cadastro.png'
 * 
 * Responsabilidades:
 * 1. Coletar Nome Completo, E-mail, Senha e Confirmação de Senha.
 * 2. Validar termos de uso e coincidência de senhas.
 * 3. Enviar requisição para POST /auth/cadastro.
 * 4. Ao cadastrar com sucesso, abrir o Modal de Confirmação (Autenticação.png).
 */
export function Cadastro({ aoVoltarParaLogin, aoAbrirTermos, aoCadastroSucesso }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validações básicas no frontend
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve possuir no mínimo 6 caracteres.');
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-figma-gradient text-white relative">
      
      {/* Botão Voltar (Canto Superior Esquerdo com efeito de vidro) */}
      <button
        type="button"
        onClick={aoVoltarParaLogin}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-white/90 hover:text-white font-semibold text-base sm:text-lg transition-all cursor-pointer active:scale-95 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-sm"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar
      </button>

      {/* Card Estilizado de Cadastro com Glassmorphism Translúcido e Borda com Brilho */}
      <div className="w-full max-w-xl bg-gradient-to-b from-white/[0.13] via-[#2f0440]/60 to-[#1c0228]/80 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_45px_rgba(168,85,247,0.18),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col items-center text-center transition-all animate-fade-in my-8">
        
        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 tracking-wide text-white drop-shadow-sm">
          Crie sua conta
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-purple-200/90 mb-8 font-normal">
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
            <label className="block text-sm sm:text-base font-semibold text-purple-100 mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 font-medium transition-all border border-white/30 focus:border-purple-400"
              required
            />
          </div>

          {/* Campo: E-mail */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-purple-100 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 font-medium transition-all border border-white/30 focus:border-purple-400"
              required
            />
          </div>

          {/* Linha com Senha e Confirmar Senha lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Campo: Senha */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-purple-100 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 font-medium transition-all border border-white/30 focus:border-purple-400"
                required
              />
            </div>

            {/* Campo: Confirmar Senha */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-purple-100 mb-1.5">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 font-medium transition-all border border-white/30 focus:border-purple-400"
                required
              />
            </div>

          </div>

          {/* Checkbox Termos de Uso */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="w-5 h-5 accent-[#0d47a1] rounded cursor-pointer"
            />
            <label htmlFor="termos" className="text-xs sm:text-sm text-purple-100 select-none cursor-pointer">
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

          {/* Botão Criar Conta em Cristal Translúcido (Opção 3) */}
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
          <p className="text-sm sm:text-base text-purple-100 font-medium">
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
