
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      {/* Card do Modal com Glassmorphism Translúcido e Borda com Brilho */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-white/[0.14] via-[#2f0440]/65 to-[#1c0228]/85 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 sm:p-10 text-center text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_45px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] animate-fade-in">
        
        {/* Título Principal */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white drop-shadow-sm">
          Sua conta foi criada com sucesso!
        </h2>

        {/* Mensagem Explicativa */}
        <p className="text-base sm:text-lg text-purple-100 mb-2">
          Foi enviado um link para verificação no e-mail:
        </p>

        {/* E-mail cadastrado em destaque */}
        <div className="p-3 bg-white/10 border border-white/15 rounded-2xl my-4 max-w-md mx-auto">
          <p className="text-base sm:text-lg font-semibold text-yellow-300 break-all">
            {email || 'seu e-mail registrado'}
          </p>
        </div>

        {/* Alerta de Caixa de Spam */}
        <p className="text-sm text-purple-200/80 mb-8">
          (Verifique também a caixa de spam caso não tenha recebido)
        </p>

        {/* Botão de Conclusão / Ir para o Login (Opção 3: Cristal Translúcido) */}
        <button
          onClick={aoFechar}
          className="w-full sm:w-auto px-10 py-3.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.6),0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md border border-white/35 hover:border-white/55 transition-all duration-300 cursor-pointer"
        >
          Entendido, ir para Login
        </button>

      </div>
    </div>
  );
}
