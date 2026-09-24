import { X, BarChart3, CheckCircle2, Clock, PlayCircle, AlertCircle, Flag, Tag, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { parseTarefaNome, PRIORIDADES, obterCorTag, verificarPrazoInteligente } from '../utils/tarefaParser.js';

export function ModalEstatisticas({ tarefas = [], aoFechar }) {
  const { tema } = useTheme();
  const ehDark = tema === 'dark';

  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.status === 'concluido').length;
  const emAndamento = tarefas.filter((t) => t.status === 'em_andamento').length;
  const pendentes = tarefas.filter((t) => t.status === 'pendente').length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // Tarefas atrasadas e para hoje
  let atrasadas = 0;
  let venceHoje = 0;

  // Distribuição por Prioridade e Tags
  const contagemPrio = { p1: { total: 0, feitas: 0 }, p2: { total: 0, feitas: 0 }, p3: { total: 0, feitas: 0 }, p4: { total: 0, feitas: 0 } };
  const mapaTags = {};

  tarefas.forEach((t) => {
    const parsed = parseTarefaNome(t.nome);
    const alerta = verificarPrazoInteligente(t.data_termi, t.status, parsed.hora);
    if (alerta === 'atrasada') atrasadas++;
    if (alerta === 'hoje') venceHoje++;

    const prio = parsed.prioridade || 'p4';
    if (contagemPrio[prio]) {
      contagemPrio[prio].total++;
      if (t.status === 'concluido') contagemPrio[prio].feitas++;
    }

    if (parsed.tags && parsed.tags.length > 0) {
      parsed.tags.forEach((tg) => {
        if (!mapaTags[tg]) mapaTags[tg] = { tag: tg, total: 0, feitas: 0 };
        mapaTags[tg].total++;
        if (t.status === 'concluido') mapaTags[tg].feitas++;
      });
    } else {
      if (!mapaTags['Sem Tag']) mapaTags['Sem Tag'] = { tag: 'Sem Tag', total: 0, feitas: 0 };
      mapaTags['Sem Tag'].total++;
      if (t.status === 'concluido') mapaTags['Sem Tag'].feitas++;
    }
  });

  const listaTags = Object.values(mapaTags).sort((a, b) => b.total - a.total);
  const pctConcluido = total > 0 ? (concluidas / total) * 100 : 0;
  const pctAndamento = total > 0 ? (emAndamento / total) * 100 : 0;
  const pctPendente = total > 0 ? (pendentes / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-4">
      <div
        className={`relative w-full max-w-2xl backdrop-blur-2xl rounded-3xl overflow-hidden animate-fade-in max-h-[90dvh] flex flex-col transition-all duration-500 ${
          ehDark
            ? 'bg-gradient-to-b from-[#180e25]/95 via-[#10091a]/95 to-[#09050e]/98 border border-purple-500/25 text-purple-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.15)]'
            : 'bg-white/95 border border-white/60 text-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
        }`}
      >
        {/* Cabeçalho */}
        <div
          className={`py-4 px-6 flex items-center justify-between shadow-md shrink-0 ${
            ehDark
              ? 'bg-gradient-to-r from-[#2a0e44] via-[#3d1264] to-[#2a0e44] border-b border-purple-500/30'
              : 'bg-gradient-to-r from-purple-800 via-[#3b075e] to-purple-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-white">
            <BarChart3 className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg sm:text-xl font-bold tracking-wide">
              Painel de Estatísticas & Desempenho
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar estatísticas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com Rolagem */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          {/* 1. Cards de KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border ${ehDark ? 'bg-white/5 border-white/10' : 'bg-purple-50/60 border-purple-100'}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-75 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Taxa Geral
              </div>
              <div className="text-2xl font-black text-purple-400">{taxaConclusao}%</div>
              <div className="text-[11px] opacity-60">{concluidas} de {total} feitas</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${ehDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluídas
              </div>
              <div className="text-2xl font-black text-emerald-500">{concluidas}</div>
              <div className="text-[11px] opacity-60">Finalizadas com sucesso</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${ehDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 mb-1">
                <Clock className="w-3.5 h-3.5" />
                Para Hoje
              </div>
              <div className="text-2xl font-black text-amber-500">{venceHoje}</div>
              <div className="text-[11px] opacity-60">{pendentes + emAndamento} ativas no total</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${ehDark ? 'bg-rose-500/10 border-rose-500/25' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Atrasadas
              </div>
              <div className="text-2xl font-black text-rose-500">{atrasadas}</div>
              <div className="text-[11px] opacity-60">Exigem atenção</div>
            </div>
          </div>

          {/* 2. Barra de Proporção por Status */}
          <div className={`p-4 rounded-2xl border ${ehDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="text-xs sm:text-sm font-bold mb-3 flex items-center justify-between">
              <span>Proporção por Status</span>
              <span className="text-xs font-normal opacity-70">{total} tarefas cadastradas</span>
            </h3>
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-gray-200 dark:bg-white/10">
              {pctConcluido > 0 && (
                <div style={{ width: `${pctConcluido}%` }} className="bg-emerald-500 transition-all duration-500" title={`Concluídas: ${concluidas}`} />
              )}
              {pctAndamento > 0 && (
                <div style={{ width: `${pctAndamento}%` }} className="bg-purple-500 transition-all duration-500" title={`Em andamento: ${emAndamento}`} />
              )}
              {pctPendente > 0 && (
                <div style={{ width: `${pctPendente}%` }} className="bg-amber-500 transition-all duration-500" title={`Pendentes: ${pendentes}`} />
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Concluído: <strong>{concluidas}</strong> ({Math.round(pctConcluido)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                Em andamento: <strong>{emAndamento}</strong> ({Math.round(pctAndamento)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Pendente: <strong>{pendentes}</strong> ({Math.round(pctPendente)}%)
              </span>
            </div>
          </div>

          {/* 3. Desempenho por Nível de Prioridade (P1 a P4) */}
          <div className={`p-4 rounded-2xl border ${ehDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="text-xs sm:text-sm font-bold mb-3 flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-purple-400" />
              Distribuição por Prioridade
            </h3>
            <div className="space-y-3">
              {Object.values(PRIORIDADES).map((p) => {
                const dados = contagemPrio[p.id] || { total: 0, feitas: 0 };
                const pct = total > 0 ? Math.round((dados.total / total) * 100) : 0;
                const pctFeitas = dados.total > 0 ? Math.round((dados.feitas / dados.total) * 100) : 0;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Flag className={`w-3.5 h-3.5 ${p.iconeCor}`} />
                        {p.rotulo} — {p.nome}
                      </span>
                      <span className="opacity-80">
                        <strong>{dados.total}</strong> tarefas ({dados.feitas} concluídas • {pctFeitas}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${ehDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.id === 'p1' ? 'bg-rose-500' : p.id === 'p2' ? 'bg-amber-500' : p.id === 'p3' ? 'bg-blue-500' : 'bg-purple-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Desempenho por Tags / Categorias */}
          <div className={`p-4 rounded-2xl border ${ehDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="text-xs sm:text-sm font-bold mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-400" />
              Produtividade por Categoria / Tag
            </h3>
            <div className="space-y-2.5">
              {listaTags.map((item) => {
                const pct = item.total > 0 ? Math.round((item.feitas / item.total) * 100) : 0;
                return (
                  <div key={item.tag} className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold border shrink-0 ${
                        item.tag === 'Sem Tag'
                          ? ehDark ? 'bg-white/5 text-purple-300/60 border-white/10' : 'bg-gray-200 text-gray-600 border-gray-300'
                          : obterCorTag(item.tag, ehDark)
                      }`}
                    >
                      {item.tag === 'Sem Tag' ? 'Sem Tag' : `#${item.tag}`}
                    </span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${ehDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[11px] opacity-80">
                      {item.feitas}/{item.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
