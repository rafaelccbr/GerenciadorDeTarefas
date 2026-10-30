import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/theme.js';

export function SeletorTema({ mostrarTexto = true, className = '' }) {
  const { tema, alternarTema } = useTheme();
  const escuro = tema === 'dark';
  const destino = escuro ? 'violeta' : 'noturno';
  return (
    <button type="button" onClick={alternarTema} className={"ui-button " + ('theme-switch ' + className)} title={'Mudar para tema ' + destino} aria-label={'Mudar para tema ' + destino}>
      {escuro ? <Sun size={16} /> : <Moon size={16} />}
      {mostrarTexto && <span className="hidden sm:inline">Tema {destino}</span>}
    </button>
  );
}
