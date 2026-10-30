import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useTheme } from '../context/theme.js';

/**
 * ============================================================================
 * MODAL DE SUCESSO DE CADASTRO
 * ============================================================================
 * Baseado no design do Figma: 'Autenticação.png'
 *
 * Exibido logo após a criação bem-sucedida de uma conta, informando ao
 * usuário que as instruções/confirmação foram enviadas para o seu e-mail.
 */
export function ModalSucesso({ email, aoFechar }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const { tema } = useTheme();
  const ehDark = tema === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65  p-4">
      {/* Card do Modal com Glassmorphism Translúcido e Borda com Brilho */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className={`dialog-surface bg-(--surface) relative w-full max-w-lg  rounded-3xl p-8 sm:p-10 text-center text-(--ink) transition-colors duration-500  ${
        ehDark
          ? '    border border-(--border) '
          : '    border border-(--border) '
      }`}>

        {/* Título Principal */}
        <h2 className="text-2xl sm:text-2xl font-bold mb-4 text-(--ink) ">
          Sua conta foi criada com sucesso!
        </h2>

        {/* Mensagem Explicativa */}
        <p className="text-base sm:text-lg text-(--ink) mb-2">
          Foi enviado um link para verificação no e-mail:
        </p>

        {/* E-mail cadastrado em destaque */}
        <div className="p-3 bg-(--surface) border border-(--border) rounded-2xl my-4 max-w-md mx-auto">
          <p className="text-base sm:text-lg font-semibold text-(--accent) break-all">
            {email || 'seu e-mail registrado'}
          </p>
        </div>

        {/* Alerta de Caixa de Spam */}
        <p className="text-sm text-(--ink) mb-8">
          (Verifique também a caixa de spam caso não tenha recebido)
        </p>

        {/* Botão de Conclusão / Ir para o Login (Opção 3: Cristal Translúcido) */}
        <button aria-keyshortcuts="Escape"
          onClick={aoFechar}
          className={"ui-button " + ("w-full sm:w-auto px-10 py-3.5 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) font-semibold rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer")}
        >
          Entendido, ir para Login
         <Tecla>Esc</Tecla></button>

      </div>
    </div>
  );
}
