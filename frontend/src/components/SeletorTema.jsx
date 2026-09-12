import { Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * ============================================================================
 * COMPONENTE SELETOR DE TEMA
 * ============================================================================
 * Permite alternar instantaneamente entre o 'Tema Violeta' (Figma original)
 * e o 'Tema Dark' (Obsidian / Meia-noite).
 */
export function SeletorTema({ mostrarTexto = true, className = '' }) {
  const { tema, alternarTema } = useTheme();
  const ehDark = tema === 'dark';

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={ehDark ? 'Mudar para o Tema Violeta' : 'Mudar para o Tema Dark'}
      aria-label="Alternar tema visual"
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm font-medium ${
        ehDark
          ? 'bg-[#180e28]/80 hover:bg-[#22133a]/90 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]'
          : 'bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 hover:border-white/40 shadow-sm'
      } ${className}`}
    >
      {ehDark ? (
        <>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] group-hover:rotate-12 transition-transform duration-300 shrink-0" />
          {mostrarTexto && (
            <span className="hidden xs:inline sm:inline">
              Tema <strong className="font-semibold text-purple-200">Violeta</strong>
            </span>
          )}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 group-hover:-rotate-12 transition-transform duration-300 shrink-0" />
          {mostrarTexto && (
            <span className="hidden xs:inline sm:inline">
              Tema <strong className="font-semibold text-white">Dark</strong>
            </span>
          )}
        </>
      )}
    </button>
  );
}

