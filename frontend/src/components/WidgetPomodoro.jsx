import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Check, Minimize2, Maximize2, Flame, Coffee } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { parseTarefaNome, tocarSomAlerta } from '../utils/tarefaParser.js';

const MODOS_POMODORO = {
  foco: { id: 'foco', label: '🍅 Foco (25m)', segundos: 25 * 60, cor: 'from-rose-500 to-purple-600' },
  curta: { id: 'curta', label: '☕ Pausa (5m)', segundos: 5 * 60, cor: 'from-emerald-500 to-teal-600' },
  longa: { id: 'longa', label: '🌴 Descanso (15m)', segundos: 15 * 60, cor: 'from-blue-500 to-indigo-600' },
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
              modo === 'foco' ? '🍅 Ciclo Pomodoro Concluído!' : '☕ Pausa Finalizada!',
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
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full border backdrop-blur-2xl shadow-2xl animate-fade-in ${
          ehDark
            ? 'bg-[#160c24]/95 border-purple-500/40 text-white shadow-[0_10px_30px_rgba(0,0,0,0.85)]'
            : 'bg-white/95 border-purple-300 text-gray-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
        }`}
      >
        <Flame className={`w-4 h-4 ${rodando ? 'text-rose-500 animate-pulse' : 'text-purple-400'}`} />
        <span className="font-mono font-extrabold text-sm tracking-wider">
          {minutos}:{segundos}
        </span>
        <span className="text-xs font-medium max-w-[120px] truncate opacity-80">
          {tituloLimpo}
        </span>
        <button
          type="button"
          onClick={() => setRodando(!rodando)}
          className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-all"
          title={rodando ? 'Pausar' : 'Continuar'}
        >
          {rodando ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => setMinimizado(false)}
          className="p-1 rounded-full hover:bg-purple-500/20 cursor-pointer"
          title="Expandir Pomodoro"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-80 sm:w-88 rounded-3xl border backdrop-blur-2xl overflow-hidden shadow-2xl animate-slide-up transition-all ${
        ehDark
          ? 'bg-[#140b22]/95 border-purple-500/40 text-purple-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.25)]'
          : 'bg-white/95 border-purple-200 text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Cabeçalho Gradiente */}
      <div className={`px-4 py-3 bg-gradient-to-r ${MODOS_POMODORO[modo].cor} text-white flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {modo === 'foco' ? <Flame className="w-4 h-4 animate-pulse" /> : <Coffee className="w-4 h-4" />}
          <span className="text-xs font-extrabold uppercase tracking-wider">Modo Foco Pomodoro</span>
          {ciclos > 0 && (
            <span className="px-2 py-0.2 bg-black/25 rounded-full text-[10px] font-bold">
              {ciclos} 🍅
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimizado(true)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={aoFechar}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
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
          ehDark ? 'bg-white/5 border-white/10' : 'bg-purple-50/60 border-purple-100'
        }`}>
          <div className="truncate font-semibold" title={tituloLimpo}>
            🎯 {tituloLimpo}
          </div>
          {tarefaAtiva && tarefaAtiva.status !== 'concluido' && (
            <button
              type="button"
              onClick={() => aoConcluirTarefa(tarefaAtiva)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer active:scale-95 transition-all"
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
            <button
              key={m.id}
              type="button"
              onClick={() => trocarModo(m.id)}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                modo === m.id
                  ? ehDark
                    ? 'bg-purple-500/30 text-white border-purple-400/50'
                    : 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : ehDark
                  ? 'bg-white/5 hover:bg-white/10 text-purple-200/70 border-white/10'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Display do Cronômetro */}
        <div className="text-center py-2">
          <div className={`text-5xl font-mono font-black tracking-tight ${ehDark ? 'text-white' : 'text-gray-900'}`}>
            {minutos}:{segundos}
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-3 ${ehDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <div
              className={`h-full transition-all duration-500 bg-gradient-to-r ${MODOS_POMODORO[modo].cor}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Controles do Cronômetro */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setRodando(!rodando)}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all bg-gradient-to-r ${MODOS_POMODORO[modo].cor}`}
          >
            {rodando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{rodando ? 'Pausar' : 'Iniciar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSegundosRestantes((s) => s + 5 * 60)}
            className={`px-3 py-2.5 rounded-2xl font-bold text-xs border cursor-pointer active:scale-95 transition-all ${
              ehDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-purple-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
            }`}
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
            className={`p-2.5 rounded-2xl border cursor-pointer active:scale-95 transition-all ${
              ehDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-purple-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
            }`}
            title="Reiniciar cronômetro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
