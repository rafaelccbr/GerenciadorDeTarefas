import { useState, useEffect, useCallback } from 'react';
import { obterSessao, salvarSessao, limparSessao, acordarServidorApi } from './services/api.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { SeletorTema } from './components/SeletorTema.jsx';
import { Login } from './components/Login.jsx';
import { Cadastro } from './components/Cadastro.jsx';
import { ListaTarefas } from './components/ListaTarefas.jsx';
import { ModalSucesso } from './components/ModalSucesso.jsx';
import { ModalTermos } from './components/ModalTermos.jsx';
import { ModalRecuperarSenha } from './components/ModalRecuperarSenha.jsx';
import { ModalGerenciarConta } from './components/ModalGerenciarConta.jsx';

/**
 * ============================================================================
 * COMPONENTE CONTEÚDO (APP CONTEÚDO)
 * ============================================================================
 * Gerencia o estado global de navegação e autenticação:
 * 
 * Telas (estado `telaAtual`):
 * - 'login': Renderiza o componente Login (Login.png)
 * - 'cadastro': Renderiza o componente Cadastro (Cadastro.png)
 * - 'tarefas': Renderiza o Dashboard com a tabela (Lista de Tarefas.png)
 * 
 * Modais:
 * - `modalSucessoAberto`: Exibe o Modal de Sucesso com o e-mail (Autenticação.png)
 * - `modalTermosAberto`: Exibe os Termos de Uso (Termos de uso.png)
 */
function AppConteudo() {
  const { tema } = useTheme();
  // Dispara um ping silencioso ao carregar o app para acordar o backend no Render (elimina espera do cold start)
  useEffect(() => {
    acordarServidorApi();
  }, []);

  // Inicialização preguiçosa (lazy state) para restaurar a sessão sem re-render desnecessário
  const [usuario, setUsuario] = useState(() => {
    const sessao = obterSessao();
    return sessao.token && sessao.usuario ? sessao.usuario : null;
  });

  // Estado que controla qual tela está sendo exibida no momento
  const [telaAtual, setTelaAtual] = useState(() => {
    const sessao = obterSessao();
    return sessao.token && sessao.usuario ? 'tarefas' : 'login';
  });

  // Sistema de transição suave entre telas
  const [transicao, setTransicao] = useState(false);

  // Transição com fade-out → troca → fade-in
  const navegarPara = useCallback((novaTela) => {
    setTransicao(true);
    setTimeout(() => {
      setTelaAtual(novaTela);
      setTransicao(false);
    }, 250); // Duração do fadeSlideOut
  }, []);

  // Controle dos modais globais
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [emailCadastrado, setEmailCadastrado] = useState('');
  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  const [onConfirmarTermos, setOnConfirmarTermos] = useState(null);
  const [modalRecuperarSenhaAberto, setModalRecuperarSenhaAberto] = useState(false);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [abaContaInicial, setAbaContaInicial] = useState('perfil');

  // Trata retornos de e-mail do Supabase (Confirmação de Conta ou Redefinição de Senha via #access_token)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (accessToken) {
        try {
          // Decodifica o payload JWT para obter id, nome e e-mail
          const base64Url = accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const usuarioToken = {
            id: payload.sub,
            email: payload.email,
            nome: payload.user_metadata?.nome || payload.email?.split('@')[0] || 'Usuário'
          };

          salvarSessao(accessToken, usuarioToken);
          setUsuario(usuarioToken);

          if (type === 'recovery') {
            setAbaContaInicial('senha');
            setModalContaAberto(true);
            setTelaAtual('tarefas');
          } else {
            setTelaAtual('tarefas');
          }
        } catch (err) {
          console.error('Erro ao processar token de autenticação da URL:', err);
        }

        // Limpa o hash da URL para não expor o token na barra de endereços
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Handler executado quando o usuário realiza login com sucesso
  const handleLoginSucesso = (dadosUsuario) => {
    setUsuario(dadosUsuario);
    setTelaAtual('tarefas');
    navegarPara('tarefas');
  };

  // Handler executado quando o cadastro é concluído com sucesso
  const handleCadastroSucesso = (email) => {
    setEmailCadastrado(email);
    setModalSucessoAberto(true);
  };

  // Fecha o modal de sucesso e redireciona para a tela de login
  const handleFecharModalSucesso = () => {
    setModalSucessoAberto(false);
    setTelaAtual('login');
    navegarPara('login');
  };

  // Handler para encerrar a sessão (Logout)
  const handleDeslogar = () => {
    limparSessao();
    setUsuario(null);
    setTelaAtual('login');
    navegarPara('login');
  };

  // Atualiza os dados locais do usuário quando editados no modal de conta
  const handleAtualizarUsuario = (dadosAtualizados) => {
    setUsuario((prev) => {
      const novo = { ...prev, ...dadosAtualizados };
      localStorage.setItem('usuario', JSON.stringify(novo));
      return novo;
    });
  };

  // Executado quando o usuário exclui sua conta permanentemente
  const handleExcluirContaSucesso = () => {
    limparSessao();
    setUsuario(null);
    setModalContaAberto(false);
    setTelaAtual('login');
  };

  return (
    <main className="w-full min-h-screen isolate selection:bg-purple-400 selection:text-purple-950 font-sans relative overflow-x-hidden">
      
      {/* Background vivo com respiração 100% acelerada pela GPU (sem repintura, sem faixas) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Camada base sólida do tema que garante cobertura total em qualquer circunstância */}
        <div className={`absolute inset-0 transition-colors duration-500 ${tema === 'dark' ? 'bg-[#07050a]' : 'bg-[#270237]'}`} />
        
        {/* Camada viva dos gradientes que respira suavemente via transform/opacity na GPU */}
        <div className={`absolute -inset-6 transition-colors duration-500 animate-breathe ${tema === 'dark' ? 'bg-theme-dark' : 'bg-theme-violeta'}`} />
      </div>

      {/* Seletor de Tema discreto no canto superior direito nas telas de login e cadastro */}
      {(telaAtual === 'login' || telaAtual === 'cadastro') && (
        <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 animate-slide-up">
          <SeletorTema />
        </div>
      )}

      {/* Container com transição suave entre telas (crossfade limpo) */}
      <div className={`w-full ${transicao ? 'animate-screen-exit' : 'animate-screen-enter'}`}>
        {/* 1. TELA DE LOGIN */}
        {telaAtual === 'login' && (
          <Login
            aoIrParaCadastro={() => navegarPara('cadastro')}
            aoLogarComSucesso={handleLoginSucesso}
            aoEsqueceuSenha={() => setModalRecuperarSenhaAberto(true)}
          />
        )}

        {/* 2. TELA DE CADASTRO */}
        {telaAtual === 'cadastro' && (
          <Cadastro
            aoVoltarParaLogin={() => navegarPara('login')}
            aoAbrirTermos={(cb) => {
              setOnConfirmarTermos(() => cb);
              setModalTermosAberto(true);
            }}
            aoCadastroSucesso={handleCadastroSucesso}
          />
        )}

        {/* 3. TELA DE LISTAGEM DE TAREFAS */}
        {telaAtual === 'tarefas' && (
          <ListaTarefas
            usuario={usuario}
            aoDeslogar={handleDeslogar}
            aoAbrirConta={() => setModalContaAberto(true)}
          />
        )}
      </div>

      {/* MODAL: SUCESSO DE CADASTRO (Autenticação.png) */}
      {modalSucessoAberto && (
        <ModalSucesso
          email={emailCadastrado}
          aoFechar={handleFecharModalSucesso}
        />
      )}

      {/* MODAL: TERMOS DE USO (Termos de uso.png) */}
      {modalTermosAberto && (
        <ModalTermos
          aoConfirmar={() => {
            if (typeof onConfirmarTermos === 'function') {
              onConfirmarTermos();
            }
          }}
          aoFechar={() => setModalTermosAberto(false)}
        />
      )}

      {/* MODAL: RECUPERAÇÃO DE SENHA */}
      {modalRecuperarSenhaAberto && (
        <ModalRecuperarSenha
          aoFechar={() => setModalRecuperarSenhaAberto(false)}
        />
      )}

      {/* MODAL: GERENCIAR CONTA (Perfil, Senha e Exclusão) */}
      {modalContaAberto && (
        <ModalGerenciarConta
          usuario={usuario}
          abaInicial={abaContaInicial}
          aoAtualizarUsuario={handleAtualizarUsuario}
          aoExcluirConta={handleExcluirContaSucesso}
          aoFechar={() => {
            setModalContaAberto(false);
            setAbaContaInicial('perfil');
          }}
        />
      )}

    </main>
  );
}

/**
 * Ponto de entrada do App com o provedor de tema global
 */
function App() {
  return (
    <ThemeProvider>
      <AppConteudo />
    </ThemeProvider>
  );
}

export default App;

