import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useState } from 'react';
import { redefinirSenhaApi } from '../services/api.js';

export function ModalRedefinirSenha({ token, aoFechar }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  async function salvar(event) {
    event.preventDefault();
    setErro('');
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setSalvando(true);
    try { await redefinirSenhaApi(token, senha); setSucesso(true); }
    catch (error) { setErro(error.message); }
    finally { setSalvando(false); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
    <section ref={dialogRef} role="dialog" aria-modal="true" className="dialog-surface bg-(--surface) rounded-3xl p-6 w-full max-w-md" aria-labelledby="reset-title">
      <h2 id="reset-title" className="text-xl mb-5">Redefinir senha</h2>
      {sucesso ? <><p className="mb-5">Senha atualizada. Entre com sua nova senha.</p><button aria-keyshortcuts="Escape" className={"ui-button ui-primary " + ("primary-button")} onClick={aoFechar}>Voltar ao login <Tecla>Esc</Tecla></button></> : <form onSubmit={salvar} className="flex flex-col gap-5">
        {erro && <p role="alert" className="form-error">{erro}</p>}
        <div className="field"><label htmlFor="reset-password">Nova senha</label><input autoFocus id="reset-password" autoComplete="new-password" type="password" minLength={8} maxLength={128} required value={senha} onChange={e => setSenha(e.target.value)} aria-describedby="reset-requirements" /><p id="reset-requirements" className="text-xs text-(--muted)">Use entre 8 e 128 caracteres.</p></div>
        <div className="field"><label htmlFor="reset-confirm">Confirmar senha</label><input id="reset-confirm" autoComplete="new-password" type="password" required value={confirmar} onChange={e => setConfirmar(e.target.value)} /></div>
        <button className={"ui-button ui-primary " + ("primary-button")} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar nova senha'}</button>
        <button aria-keyshortcuts="Escape" type="button" className={"ui-button " + ("text-button")} onClick={aoFechar}>Cancelar <Tecla>Esc</Tecla></button>
      </form>}
    </section>
  </div>;
}
