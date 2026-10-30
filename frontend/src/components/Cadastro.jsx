import { Tecla } from './Tecla.jsx';
import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/theme.js';
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
    <div className="min-h-screen min-h-dvh w-full flex flex-col items-center justify-center px-4 py-6 sm:py-10 text-(--ink) transition-colors duration-500">

      {/* Botão Voltar Adaptativo */}
      <div className="w-full max-w-xl flex justify-start mb-2 sm:mb-4">
        <button
          type="button"
          onClick={aoVoltarParaLogin}
          className={"ui-button " + ("flex items-center gap-1.5 text-(--ink) hover:text-(--ink) font-semibold text-sm sm:text-base transition-colors cursor-pointer active:scale-95 bg-(--surface) hover:bg-(--surface)  px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-(--border) ")}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Voltar
        </button>
      </div>

      {/* Card Estilizado de Cadastro com Glassmorphism Translúcido e Borda com Brilho */}
      <div className={`bg-(--surface) w-full max-w-xl  rounded-2xl sm:rounded-3xl p-5 sm:p-10 flex flex-col items-center text-center transition-colors duration-500 my-auto ${
        ehDark
          ? '    border border-(--border) '
          : '    border border-(--border) '
      }`}>

        {/* Título Principal */}
        <h1 className="text-2xl text-2xl font-bold mb-2  text-(--ink)  ">
          Crie sua conta
        </h1>

        {/* Subtítulo */}
        <p className={`text-sm sm:text-lg mb-6 sm:mb-8 font-normal   ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
          Preencha os dados abaixo para criar sua conta
        </p>

        {/* Alerta de Erro */}
        {erro && (
          <div className="w-full mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-2xl  text-left">
            {erro}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">

          {/* Campo: Nome Completo */}
          <div className=" ">
            <label htmlFor="cadastro-nome" className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
              Nome Completo
            </label>
            <input
              type="text"
              id="cadastro-nome" autoComplete="name" value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              className={`w-full px-5 py-3 rounded-full focus:outline-none focus:ring-4 transition-colors duration-200 font-medium border  focus:scale-[1.01] ${
                ehDark
                  ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                  : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
              }`}
              required
            />
          </div>

          {/* Campo: E-mail */}
          <div className=" ">
            <label htmlFor="cadastro-email" className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
              E-mail
            </label>
            <input
              type="email"
              id="cadastro-email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className={`w-full px-5 py-3 rounded-full focus:outline-none focus:ring-4 transition-colors duration-200 font-medium border  focus:scale-[1.01] ${
                ehDark
                  ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                  : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
              }`}
              required
            />
          </div>

          {/* Linha com Senha e Confirmar Senha lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4  ">

            {/* Campo: Senha */}
            <div>
              <label htmlFor="cadastro-senha" className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  aria-describedby="cadastro-requisitos" maxLength={128} id="cadastro-senha" autoComplete="new-password" value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-5 pr-12 py-3 rounded-full focus:outline-none focus:ring-4 transition-colors font-medium border  ${
                    ehDark
                      ? 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-(--muted) border-(--border) focus:border-(--border) focus:ring-(--accent)'
                      : 'bg-(--surface) hover:bg-(--surface) focus:bg-(--surface) text-(--ink) placeholder-gray-500 border-(--border) focus:border-(--border) focus:ring-(--accent)'
                  }`}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className={"ui-button " + (`absolute right-3.5 p-1 rounded-full transition-colors cursor-pointer focus:outline-none ${
                    ehDark
                      ? 'text-(--ink) hover:text-(--ink) hover:bg-(--surface)'
                      : 'text-(--muted) hover:text-(--ink) hover:bg-(--surface-muted)'
                  }`)}
                  title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Campo: Confirmar Senha */}
            <div>
              <label htmlFor="cadastro-confirmar" className={`block text-sm sm:text-base font-semibold mb-1.5 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
                Confirmar senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  id="cadastro-confirmar" autoComplete="new-password" value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-5 pr-12 py-3 rounded-full focus:outline-none focus:ring-4 transition-colors font-medium border  ${
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

          </div>

          {/* Indicadores Visuais de Requisitos da Senha - Aparece apenas quando a caixa da senha for clicada/focada */}
          {(
            <div className={`text-xs space-y-1.5 border rounded-2xl p-3 text-left transition-colors   ${
              ehDark ? 'bg-black/40 border-(--border) text-(--ink)' : 'bg-(--surface) border-(--border) text-(--ink)'
            }`}>
              <p id="cadastro-requisitos" className={`font-semibold text-xs mb-1 ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>Requisitos de segurança:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <span className={`flex items-center gap-1.5 ${senha.length >= 8 ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                  {senha.length >= 8 ? '' : '○'} Mínimo 8 caracteres
                </span>
                <span className={`flex items-center gap-1.5 ${/[A-Z]/.test(senha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                  {/[A-Z]/.test(senha) ? '' : '○'} 1 Letra maiúscula
                </span>
                <span className={`flex items-center gap-1.5 ${/[0-9]/.test(senha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                  {/[0-9]/.test(senha) ? '' : '○'} 1 Número
                </span>
                <span className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(senha) ? 'text-(--accent) font-semibold' : 'text-(--muted)'}`}>
                  {/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/'"]/.test(senha) ? '' : '○'} 1 Caractere especial
                </span>
              </div>
            </div>
          )}

          {/* Checkbox Termos de Uso */}
          <div className="flex items-center gap-3 pt-2  ">
            <input
              type="checkbox"
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="w-5 h-5 accent-(--accent) rounded cursor-pointer"
            />
            <label htmlFor="termos" className={`text-xs sm:text-sm select-none cursor-pointer ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
              Li e concordo com os{' '}
              <button
                type="button"
                onClick={() => aoAbrirTermos?.(() => setAceitouTermos(true))}
                className={"ui-button " + ("text-(--accent) hover:text-(--accent) font-semibold underline cursor-pointer")}
              >
                Termos de Uso
              </button>{' '}
              e{' '}
              <button
                type="button"
                onClick={() => aoAbrirTermos?.(() => setAceitouTermos(true))}
                className={"ui-button " + ("text-(--accent) hover:text-(--accent) font-semibold underline cursor-pointer")}
              >
                Política de Privacidade
              </button>
            </label>
          </div>

          {/* Botão Criar Conta com Shimmer */}
          <div className="flex justify-center pt-4  ">
            <button
              type="submit"
              disabled={carregando}
              className={"ui-button ui-primary " + ("primary-button w-full")}
            >
              {carregando ? 'Criando conta...' : 'Criar Conta'}
             <Tecla>Enter</Tecla></button>
          </div>

        </form>

        {/* Rodapé: Link para Login */}
        <div className="mt-8 pt-6 border-t border-(--border) w-full  ">
          <p className={`text-sm sm:text-base font-medium ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={aoVoltarParaLogin}
              className={"ui-button " + ("text-(--accent) hover:text-(--accent) font-bold hover:underline cursor-pointer transition-colors")}
            >
              Faça Login
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
