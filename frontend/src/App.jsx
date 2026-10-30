import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { obterSessao, salvarSessao, limparSessao, sessaoAtualApi, logoutApi } from './services/api.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SeletorTema } from './components/SeletorTema.jsx';
const ModalRedefinirSenha = lazy(() => import('./components/ModalRedefinirSenha.jsx').then(m => ({ default: m.ModalRedefinirSenha })));
import { Login } from './components/Login.jsx';
const Cadastro = lazy(() => import('./components/Cadastro.jsx').then(m => ({ default: m.Cadastro })));
const ListaTarefas = lazy(() => import('./components/ListaTarefas.jsx').then(m => ({ default: m.ListaTarefas })));
const ModalSucesso = lazy(() => import('./components/ModalSucesso.jsx').then(m => ({ default: m.ModalSucesso })));
const ModalTermos = lazy(() => import('./components/ModalTermos.jsx').then(m => ({ default: m.ModalTermos })));
const ModalRecuperarSenha = lazy(() => import('./components/ModalRecuperarSenha.jsx').then(m => ({ default: m.ModalRecuperarSenha })));
const ModalGerenciarConta = lazy(() => import('./components/ModalGerenciarConta.jsx').then(m => ({ default: m.ModalGerenciarConta })));

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

  const [tokenRecuperacao, setTokenRecuperacao] = useState(() => new URLSearchParams(window.location.search).get('token'));
  useEffect(() => {
    let ativo = true;
    sessaoAtualApi().then(dados => {
      if (!ativo) return;
      if (dados) { salvarSessao('cookie', dados); setUsuario(dados); setTelaAtual('tarefas'); }
      else { limparSessao(); setUsuario(null); setTelaAtual('login'); }
    }).catch(() => { /* Um erro de rede será apresentado ao carregar as tarefas ou ao entrar. */ });
    const expirar = () => { limparSessao(); setUsuario(null); setTelaAtual('login'); };
    window.addEventListener('sessao-expirada', expirar);
    return () => { ativo = false; window.removeEventListener('sessao-expirada', expirar); };
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
  const handleDeslogar = async () => {
    try { await logoutApi(); }
    catch { window.alert('Não foi possível encerrar a sessão. Confira a conexão e tente novamente.'); return; }
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
    <main className="app-root">
      {/* Seletor de Tema discreto no canto superior direito nas telas de login e cadastro */}
      {(telaAtual === 'login' || telaAtual === 'cadastro') && (
        <div className="auth-theme">
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

      {tokenRecuperacao && <ModalRedefinirSenha token={tokenRecuperacao} aoFechar={() => { setTokenRecuperacao(null); window.history.replaceState(null, '', window.location.pathname); }} />}
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
      <Suspense fallback={<div className="p-8 text-(--muted)" role="status">Carregando seu espaço…</div>}>
      <AppConteudo />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
