import { useState, useEffect } from 'react';
import { ThemeContext } from './theme.js';

export function ThemeProvider({ children }) {
  const [tema, setTemaState] = useState(() => {
    if (typeof window !== 'undefined') {
      const temaSalvo = localStorage.getItem('app_tema');
      if (temaSalvo === 'violeta') return 'light';
      if (temaSalvo === 'dark' || temaSalvo === 'light') {
        return temaSalvo;
      }
      // Se não houver tema salvo, verifica preferência do sistema
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const setTema = (novoTema) => {
    if (novoTema === 'dark' || novoTema === 'light') {
      setTemaState(novoTema);
      localStorage.setItem('app_tema', novoTema);
    }
  };

  const alternarTema = () => {
    setTema(tema === 'light' ? 'dark' : 'light');
  };

  // Sincroniza classes no elemento raiz HTML para permitir seletores globais
  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light', 'theme-violeta');
    } else {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    }

    // Sincroniza a cor da barra de navegação/status no navegador do celular
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', tema === 'dark' ? '#170d24' : '#3b1758');
    }
  }, [tema]);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}
