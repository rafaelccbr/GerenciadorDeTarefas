import { Tecla } from './Tecla.jsx';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, ListChecks, Timer, Columns3, ArrowRight } from 'lucide-react';
import { loginApi, salvarSessao, configuracaoLoginApi, loginGoogleApi } from '../services/api.js';
import { Marca } from './Marca.jsx';

export function Login({ aoIrParaCadastro, aoLogarComSucesso, aoEsqueceuSenha }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [configuracao, setConfiguracao] = useState(null);
  useEffect(() => {
    let ativo = true;
    configuracaoLoginApi().then(config => { if (ativo) setConfiguracao(config); }).catch(() => { if (ativo) setErro('Não foi possível verificar as opções de acesso. Atualize a página para tentar novamente.'); });
    return () => { ativo = false; };
  }, []);
  const entrarComGoogle = async () => {
    setErro(''); setCarregando(true);
    try { await loginGoogleApi(); }
    catch (error) { setErro(error.message); setCarregando(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const resposta = await loginApi(email.trim(), senha);
      salvarSessao(resposta.token, resposta.usuario);
      aoLogarComSucesso(resposta.usuario);
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-shell">
      <header><Marca /></header>
      <div className="auth-layout">
        <section className="auth-story" aria-labelledby="rotina-title">
          <h2 id="rotina-title">Menos na cabeça.<br />Mais no seu dia.</h2>
          <p>Suas tarefas, seus prazos e um tempo para focar. Organize a rotina no seu ritmo.</p>
          <div className="routine-strip">
            <h3>Da ideia ao feito.</h3>
            <div className="routine-step"><ListChecks size={16} /><span>Organize o próximo passo</span><span>Tarefas</span></div>
            <div className="routine-step"><Columns3 size={16} /><span>Veja o trabalho avançar</span><span>Kanban</span></div>
            <div className="routine-step"><Timer size={16} /><span>Uma coisa de cada vez</span><span>Pomodoro</span></div>
          </div>
        </section>
        <section className="auth-form" aria-labelledby="login-title">
          <h1 id="login-title">Entre no seu espaço</h1>
          <p>Retome de onde parou.</p>
          {erro && <div className="form-error" role="alert">{erro}</div>}
          {configuracao?.google && <>
            <button type="button" className={"ui-button " + ("google-button")} onClick={entrarComGoogle} disabled={carregando}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.35ZM12 22c2.7 0 4.96-.9 6.61-2.42l-3.23-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22ZM6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.51l3.34-2.59ZM12 5.96c1.47 0 2.79.5 3.82 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" /></svg>
              {carregando ? 'Conectando…' : 'Continuar com Google'}
            </button>
            <p className="login-divider">Ou use sua senha do Organizador</p>
          </>}
          <form onSubmit={handleSubmit} aria-busy={carregando}>
            <div className="field">
              <label htmlFor="login-email">E-mail</label>
              <input id="login-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required disabled={carregando} />
            </div>
            <div className="field">
              <label htmlFor="login-password">Senha</label>
              <div className="password-field">
                <input id="login-password" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required disabled={carregando} />
                <button className={"ui-button " + ("password-toggle")} type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha}>{mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {configuracao?.recuperacaoEmail && <button type="button" className={"ui-button " + ("forgot-password")} onClick={aoEsqueceuSenha}>Esqueceu a senha?</button>}
            {configuracao?.google && !configuracao.recuperacaoEmail && <p className="text-[13px] text-(--muted)">Esqueceu sua senha? Você pode continuar com o Google.</p>}
            <button type="submit" className={"ui-button ui-primary " + ("primary-button")} disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar'}{!carregando && <ArrowRight size={16} />} <Tecla>Enter</Tecla></button>
          </form>
          {configuracao?.cadastroEmail ? <div className="auth-register">Primeira vez aqui? <button type="button" className={"ui-button " + ("text-button")} onClick={aoIrParaCadastro}>Criar conta</button></div> : configuracao?.google ? <p className="auth-register">No primeiro acesso com Google, sua conta é criada. Depois, você pode configurar uma senha em Minha conta.</p> : null}
        </section>
      </div>
      <footer className="auth-footer"><span>Organizador de Tarefas Pro</span><span>Planeje. Faça. Respire.</span></footer>
    </div>
  );
}
