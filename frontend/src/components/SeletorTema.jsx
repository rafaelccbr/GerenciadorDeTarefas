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
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer group text-xs sm:text-sm font-medium shadow-sm ${
        ehDark
          ? 'bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-200 hover:text-white border border-zinc-600/60 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
          : 'bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 hover:border-white/40 shadow-sm'
      } ${className}`}
    >
      {ehDark ? (
        <>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
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

