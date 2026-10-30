import { Tecla } from './Tecla.jsx';
import { useDialogShortcuts } from '../hooks/useDialogShortcuts.js';
import { useTheme } from '../context/theme.js';

/**
 * ============================================================================
 * MODAL DE TERMOS DE USO
 * ============================================================================
 * Baseado no design do Figma: 'Termos de uso.png'
 *
 * Exibe as regras e diretrizes de uso do Organizador de Tarefas para o usuário
 * antes que ele finalize a criação de conta.
 */
export function ModalTermos({ aoConfirmar, aoFechar }) {
  const dialogRef = useDialogShortcuts(aoFechar);
  const { tema } = useTheme();
  const ehDark = tema === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65  p-4">
      {/* Container do Modal com Glassmorphism Translúcido e Borda com Brilho */}
      <div ref={dialogRef} role="dialog" aria-modal="true" className={`dialog-surface bg-(--surface) relative w-full max-w-2xl  rounded-3xl p-6 sm:p-8 text-(--ink) transition-colors duration-500  flex flex-col max-h-[90vh] ${
        ehDark
          ? '    border border-(--border) '
          : '    border border-(--border) '
      }`}>

        {/* Botão Fechar no Topo Direito */}
        <button aria-label="Fechar diálogo" aria-keyshortcuts="Escape"
          onClick={aoFechar}
          type="button"
          className={"ui-button dialog-close " + ("absolute top-5 right-5 text-(--ink) hover:text-(--ink) bg-(--surface) hover:bg-(--surface) rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer")}
          title="Fechar"
        >
            <span>Fechar</span> <Tecla>Esc</Tecla>
          </button>

        {/* Cabeçalho */}
        <h2 className="text-2xl sm:text-2xl font-bold mb-4 text-(--ink) text-left  ">
          Termos de Uso
        </h2>

        {/* Texto dos Termos com scroll ativo e barra de rolagem oculta (no-scrollbar) */}
        <div className="space-y-4 text-(--ink) text-sm sm:text-base leading-relaxed overflow-y-auto pr-3 text-left no-scrollbar scroll-smooth flex-1">

          <p>
            Bem-vindo ao nosso Organizador de Tarefas. Ao utilizar este site, você concorda com os presentes Termos de Uso.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            1. Sobre o serviço
          </h3>
          <p>
            O site é uma ferramenta destinada à organização pessoal de tarefas. Por meio dele, o usuário pode criar uma conta, adicionar tarefas, acompanhar seu progresso e organizar suas atividades.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            2. Cadastro e conta
          </h3>
          <p>
            Para utilizar determinadas funcionalidades, pode ser necessário criar uma conta informando dados básicos, como nome e endereço de e-mail.
          </p>
          <p>
            O usuário é responsável por manter seus dados de acesso seguros e por todas as atividades realizadas em sua conta.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            3. Uso do serviço
          </h3>
          <p>
            O usuário concorda em utilizar o site de forma adequada e somente para fins legais.
          </p>
          <p className="font-medium text-(--ink)">Não é permitido utilizar o serviço para:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-(--ink)">
            <li>Praticar atividades ilegais;</li>
            <li>Tentar acessar contas ou dados de outros usuários;</li>
            <li>Interferir no funcionamento do site;</li>
            <li>Inserir conteúdos maliciosos ou que possam prejudicar outros usuários.</li>
          </ul>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            4. Tarefas e conteúdos
          </h3>
          <p>
            As tarefas adicionadas pelo usuário são de sua responsabilidade. O usuário deve evitar inserir informações sensíveis ou dados pessoais desnecessários nas tarefas.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            5. Disponibilidade
          </h3>
          <p>
            O site poderá passar por atualizações, manutenções ou períodos de indisponibilidade. Não garantimos que o serviço estará disponível de forma ininterrupta.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            6. Alterações nos termos
          </h3>
          <p>
            Estes Termos de Uso podem ser alterados para acompanhar mudanças no serviço ou na legislação. A versão mais recente estará sempre disponível nesta página.
          </p>

          {/* Divisor Visual entre Termos e Política */}
          <hr className="border-(--border) my-6" />

          {/* Seção da Política de Privacidade */}
          <h2 className="text-xl sm:text-2xl font-bold text-(--ink) ">
            Política de Privacidade
          </h2>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            1. Informações coletadas
          </h3>
          <p>Podemos coletar algumas informações necessárias para o funcionamento do serviço, como:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-(--ink)">
            <li>Nome;</li>
            <li>Endereço de e-mail;</li>
            <li>Senha, armazenada de forma protegida;</li>
            <li>Tarefas e informações adicionadas pelo usuário.</li>
          </ul>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            2. Como utilizamos as informações
          </h3>
          <p>As informações coletadas são utilizadas para:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-(--ink)">
            <li>Criar e administrar a conta do usuário;</li>
            <li>Permitir o acesso ao sistema;</li>
            <li>Salvar e exibir as tarefas cadastradas;</li>
            <li>Melhorar o funcionamento do serviço;</li>
            <li>Entrar em contato com o usuário quando necessário.</li>
          </ul>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            3. Compartilhamento de informações
          </h3>
          <p>
            Não vendemos ou compartilhamos informações pessoais dos usuários com terceiros para fins comerciais.
          </p>
          <p>
            As informações poderão ser compartilhadas quando necessário para o funcionamento do serviço ou quando houver uma obrigação legal.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            4. Segurança
          </h3>
          <p>
            Adotamos medidas razoáveis para proteger as informações armazenadas contra acesso, alteração ou divulgação não autorizada.
          </p>
          <p>
            Apesar disso, nenhum sistema é completamente seguro, e não podemos garantir segurança absoluta dos dados.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            5. Cookies
          </h3>
          <p>
            O site poderá utilizar cookies ou tecnologias semelhantes para manter o usuário conectado, armazenar preferências e melhorar a experiência de utilização.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            6. Exclusão da conta
          </h3>
          <p>
            O usuário poderá solicitar a exclusão de sua conta e dos dados associados a ela, respeitando eventuais obrigações legais de armazenamento.
          </p>

          <h3 className="font-bold text-(--ink) text-base sm:text-lg pt-2">
            7. Alterações nesta política
          </h3>
          <p>
            Esta Política de Privacidade poderá ser atualizada sempre que necessário. A versão mais recente estará disponível nesta página.
          </p>

        </div>

        {/* Botão de Ação: Confirmar em Cristal Translúcido */}
        <div className="flex justify-center pt-5 border-t border-(--border) mt-4">
          <button
            type="button"
            onClick={() => {
              aoConfirmar?.();
              aoFechar();
            }}
            className={"ui-button " + ("px-14 py-3.5 bg-(--surface) hover:bg-(--surface) active:scale-95 text-(--ink) font-semibold text-base sm:text-lg rounded-full    border border-(--border) hover:border-(--border) transition-colors duration-300 cursor-pointer")}
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
