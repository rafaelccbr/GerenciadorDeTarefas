import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Check, Minimize2, Maximize2, Flame, Coffee } from 'lucide-react';
import { useTheme } from '../context/theme.js';
import { parseTarefaNome, tocarSomAlerta } from '../utils/tarefaParser.js';

const MODOS_POMODORO = {
  foco: { id: 'foco', label: ' Foco (25m)', segundos: 25 * 60, cor: ' ' },
  curta: { id: 'curta', label: ' Pausa (5m)', segundos: 5 * 60, cor: ' ' },
  longa: { id: 'longa', label: ' Descanso (15m)', segundos: 15 * 60, cor: ' ' },
};

export function WidgetPomodoro({ tarefaAtiva, aoFechar, aoConcluirTarefa }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';

  const [modo, setModo] = useState('foco');
  const [segundosRestantes, setSegundosRestantes] = useState(MODOS_POMODORO.foco.segundos);
  const [rodando, setRodando] = useState(true);
  const [minimizado, setMinimizado] = useState(false);
  const [ciclos, setCiclos] = useState(0);

  const { tituloLimpo } = parseTarefaNome(tarefaAtiva?.nome || '');

  const trocarModo = (novoModo) => {
    setModo(novoModo);
    setSegundosRestantes(MODOS_POMODORO[novoModo].segundos);
    setRodando(false);
  };

  useEffect(() => {
    if (!rodando) return;

    const timer = setInterval(() => {
      setSegundosRestantes((atual) => {
        if (atual <= 1) {
          clearInterval(timer);
          setRodando(false);
          tocarSomAlerta('pomodoro');

          if (modo === 'foco') {
            setCiclos((c) => c + 1);
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(
              modo === 'foco' ? ' Ciclo Pomodoro Concluído!' : ' Pausa Finalizada!',
              {
                body: modo === 'foco'
                  ? `Excelente foco em "${tituloLimpo}"! Hora de fazer uma pausa.`
                  : `Pausa encerrada! Pronto para voltar para "${tituloLimpo}"?`,
              }
            );
          }
          return 0;
        }
        return atual - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rodando, modo, tituloLimpo]);

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0');
  const segundos = String(segundosRestantes % 60).padStart(2, '0');
  const totalModo = MODOS_POMODORO[modo].segundos;
  const progresso = Math.round(((totalModo - segundosRestantes) / totalModo) * 100);

  if (minimizado) {
    return (
      <div
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full border    ${
          ehDark
            ? 'bg-(--surface) border-(--border) text-(--ink) '
            : 'bg-(--surface) border-(--border) text-(--ink) '
        }`}
      >
        <Flame className={`w-4 h-4 ${rodando ? 'text-rose-500 ' : 'text-(--muted)'}`} />
        <span className="tabular-nums font-extrabold text-sm ">
          {minutos}:{segundos}
        </span>
        <span className="text-xs font-medium max-w-[120px] truncate opacity-80">
          {tituloLimpo}
        </span>
        <button
          type="button"
          onClick={() => setRodando(!rodando)}
          className={"ui-button ui-primary " + ("p-1.5 rounded-full bg-(--surface-muted) hover:bg-(--surface-muted) text-(--ink) cursor-pointer transition-colors")}
          title={rodando ? 'Pausar' : 'Continuar'}
        >
          {rodando ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => setMinimizado(false)}
          className={"ui-button ui-icon " + ("p-1 rounded-full hover:bg-(--surface-muted) cursor-pointer")}
          title="Expandir Pomodoro"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-80 sm:w-88 rounded-3xl border  overflow-hidden   transition-colors ${
        ehDark
          ? 'bg-(--surface) border-(--border) text-(--ink) '
          : 'bg-(--surface) border-(--border) text-(--ink) '
      }`}
    >
      {/* Cabeçalho Gradiente */}
      <div className={`px-4 py-3  ${MODOS_POMODORO[modo].cor} text-(--ink) flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {modo === 'foco' ? <Flame className="w-4 h-4 " /> : <Coffee className="w-4 h-4" />}
          <span className="text-xs font-extrabold  ">Modo Foco Pomodoro</span>
          {ciclos > 0 && (
            <span className="px-2 py-0.2 bg-black/25 rounded-full text-xs font-bold">
              {ciclos}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimizado(true)}
            className={"ui-button ui-icon " + ("p-1 rounded-lg hover:bg-(--surface) transition-colors cursor-pointer")}
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={aoFechar}
            className={"ui-button ui-icon " + ("p-1 rounded-lg hover:bg-(--surface) transition-colors cursor-pointer")}
            title="Fechar Pomodoro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Corpo do Timer */}
      <div className="p-4 space-y-3.5">
        {/* Tarefa em Foco */}
        <div className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
          ehDark ? 'bg-(--surface) border-(--border)' : 'bg-(--surface-muted) border-(--border)'
        }`}>
          <div className="truncate font-semibold" title={tituloLimpo}>
             {tituloLimpo}
          </div>
          {tarefaAtiva && tarefaAtiva.status !== 'concluido' && (
            <button
              type="button"
              onClick={() => aoConcluirTarefa(tarefaAtiva)}
              className={"ui-button ui-success " + ("shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-(--ink) text-xs font-bold cursor-pointer active:scale-95 transition-colors")}
              title="Concluir esta tarefa agora"
            >
              <Check className="w-3 h-3" />
              Concluir
            </button>
          )}
        </div>

        {/* Seletor de Modos */}
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(MODOS_POMODORO).map((m) => (
            <button aria-pressed={modo === m.id}
              key={m.id}
              type="button"
              onClick={() => trocarModo(m.id)}
              className={"ui-button " + (`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer border ${
                modo === m.id
                  ? ehDark
                    ? 'bg-(--surface-muted) text-(--ink) border-(--border)'
                    : 'bg-(--surface-muted) text-(--ink) border-(--border) '
                  : ehDark
                  ? 'bg-(--surface) hover:bg-(--surface) text-(--ink) border-(--border)'
                  : 'bg-(--surface-muted) hover:bg-(--surface-muted) text-(--muted) border-(--border)'
              }`)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Display do Cronômetro */}
        <div className="text-center py-2">
          <div className={`text-5xl tabular-nums font-black tracking-tight ${ehDark ? 'text-(--ink)' : 'text-(--ink)'}`}>
            {minutos}:{segundos}
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${ehDark ? 'bg-(--surface)' : 'bg-(--surface-muted)'}`}>
            <div
              className={`h-full transition-colors duration-500  ${MODOS_POMODORO[modo].cor}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Controles do Cronômetro */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setRodando(!rodando)}
            className={"ui-button ui-primary " + (`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs text-(--ink) flex items-center justify-center gap-1.5  cursor-pointer active:scale-95 transition-colors  ${MODOS_POMODORO[modo].cor}`)}
          >
            {rodando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{rodando ? 'Pausar' : 'Iniciar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSegundosRestantes((s) => s + 5 * 60)}
            className={"ui-button " + (`px-3 py-2.5 rounded-2xl font-bold text-xs border cursor-pointer active:scale-95 transition-colors ${
              ehDark ? 'bg-(--surface) hover:bg-(--surface) border-(--border) text-(--ink)' : 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--muted)'
            }`)}
            title="Adicionar +5 minutos"
          >
            +5m
          </button>

          <button
            type="button"
            onClick={() => {
              setRodando(false);
              setSegundosRestantes(MODOS_POMODORO[modo].segundos);
            }}
            className={"ui-button ui-icon ui-primary " + (`p-2.5 rounded-2xl border cursor-pointer active:scale-95 transition-colors ${
              ehDark ? 'bg-(--surface) hover:bg-(--surface) border-(--border) text-(--ink)' : 'bg-(--surface-muted) hover:bg-(--surface-muted) border-(--border) text-(--muted)'
            }`)}
            title="Reiniciar cronômetro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
