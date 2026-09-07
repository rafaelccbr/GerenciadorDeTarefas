import { useState } from 'react';
import { loginApi, salvarSessao } from '../services/api.js';

/**
 * ============================================================================
 * TELA DE LOGIN
 * ============================================================================
 * Baseado no design do Figma: 'Login.png'
 * 
 * Responsabilidades:
 * 1. Coletar e-mail e senha do usuário.
 * 2. Enviar requisição para POST /auth/login.
 * 3. Se autenticado, salvar o Token JWT no localStorage e redirecionar
 *    para o dashboard de tarefas.
 * 4. Permitir navegar para a tela de Cadastro.
 */
export function Login({ aoIrParaCadastro, aoLogarComSucesso, aoEsqueceuSenha }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setCarregando(true);
      // Chama o endpoint de login no backend Fastify
      const resposta = await loginApi(email, senha);

      // Salva o token JWT e os dados do usuário no localStorage
      salvarSessao(resposta.token, resposta.usuario);

      // Notifica o componente pai (App.jsx) que o login foi bem-sucedido
      aoLogarComSucesso(resposta.usuario);
    } catch (err) {
      setErro(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-figma-gradient text-white">
      {/* Card Estilizado de Login com Glassmorphism Translúcido e Borda com Brilho */}
      <div className="w-full max-w-md bg-gradient-to-b from-white/[0.13] via-[#2f0440]/60 to-[#1c0228]/80 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_45px_rgba(168,85,247,0.18),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col items-center text-center transition-all animate-fade-in">
        
        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 tracking-wide text-white drop-shadow-sm">
          Login
        </h1>

        {/* Subtítulo de Boas-vindas */}
        <p className="text-base sm:text-lg text-purple-200/90 mb-8 font-normal">
          Seja Bem Vindo de Volta!
        </p>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="w-full mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-2xl animate-fade-in">
            {erro}
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-5">
          
          {/* Campo: E-mail */}
          <div className="w-full flex flex-col items-center">
            <label className="text-base sm:text-lg font-medium text-purple-100 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full max-w-sm px-6 py-3.5 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full text-center focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
              required
            />
          </div>

          {/* Campo: Senha */}
          <div className="w-full flex flex-col items-center">
            <label className="text-base sm:text-lg font-medium text-purple-100 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full max-w-sm px-6 py-3.5 bg-[#d9d9d9]/95 hover:bg-white focus:bg-white text-gray-900 rounded-full text-center focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-md placeholder-gray-500 transition-all font-medium border border-white/30 focus:border-purple-400"
              required
            />
            {/* Link Esqueceu a Senha */}
            <div className="w-full max-w-sm flex justify-end mt-2 pr-1">
              <button
                type="button"
                onClick={aoEsqueceuSenha}
                className="text-xs sm:text-sm text-purple-200/90 hover:text-white hover:underline cursor-pointer transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          {/* Botão Entrar em Cristal Translúcido (Opção 3) */}
          <div className="pt-3 w-full flex justify-center">
            <button
              type="submit"
              disabled={carregando}
              className="px-14 py-3.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-lg font-semibold rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

        </form>

        {/* Rodapé: Link para Cadastro com divisor suave */}
        <div className="mt-8 pt-6 border-t border-white/15 w-full">
          <p className="text-sm sm:text-base text-purple-100 font-medium">
            Tem uma conta?{' '}
            <button
              type="button"
              onClick={aoIrParaCadastro}
              className="text-[#e2583e] hover:text-[#ff7043] font-bold hover:underline cursor-pointer transition-colors"
            >
              Crie uma Agora
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
