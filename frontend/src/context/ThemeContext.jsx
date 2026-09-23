import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  tema: 'violeta',
  alternarTema: () => {},
  setTema: () => {}
});

export function ThemeProvider({ children }) {
  const [tema, setTemaState] = useState(() => {
    if (typeof window !== 'undefined') {
      const temaSalvo = localStorage.getItem('app_tema');
      if (temaSalvo === 'dark' || temaSalvo === 'violeta') {
        return temaSalvo;
      }
      // Se não houver tema salvo, verifica preferência do sistema
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'violeta';
  });

  const setTema = (novoTema) => {
    if (novoTema === 'dark' || novoTema === 'violeta') {
      setTemaState(novoTema);
      localStorage.setItem('app_tema', novoTema);
    }
  };

  const alternarTema = () => {
    setTema(tema === 'violeta' ? 'dark' : 'violeta');
  };

  // Sincroniza classes no elemento raiz HTML para permitir seletores globais
  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-violeta');
    } else {
      root.classList.add('theme-violeta');
      root.classList.remove('theme-dark');
    }

    // Sincroniza a cor da barra de navegação/status no navegador do celular
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', tema === 'dark' ? '#07050a' : '#270237');
    }
  }, [tema]);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}

