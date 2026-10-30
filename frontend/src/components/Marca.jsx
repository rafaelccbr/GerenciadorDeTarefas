export function Marca({ escopo = 'Tarefas, rotina e foco' }) {
  return (
    <div className="brand">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path d="M5 8h8M5 15h5M5 22h8M17 14l4 4 6-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Organizador <small>{escopo}</small></span>
    </div>
  );
}
