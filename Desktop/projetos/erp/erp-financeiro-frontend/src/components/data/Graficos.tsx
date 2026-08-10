"use client";

import { useEffect, useState } from "react";

import { moeda, paraNumero } from "@/lib/format";
import { usePrefereMenosMovimento } from "@/lib/animacao";

/**
 * Gráficos em SVG puro.
 *
 * Sem biblioteca de charts: o que os relatórios precisam são barras
 * comparativas e uma rosca de participação. Escrever isso em SVG evita
 * ~100 kB de JavaScript e mantém o controle total sobre a acessibilidade.
 *
 * A animação é de desenho — as barras crescem e a rosca se preenche —, o que
 * ajuda a ler a proporção entre as fatias em vez de só enfeitar.
 */

const PALETA = [
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#ec4899",
  "#14b8a6",
];

/** Dispara a animação no quadro seguinte à montagem. */
function useEntrada(): boolean {
  const semMovimento = usePrefereMenosMovimento();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (semMovimento) {
      setPronto(true);
      return;
    }
    const quadro = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(quadro);
  }, [semMovimento]);

  return pronto;
}

export interface Fatia {
  nome: string;
  valor: string | number;
  percentual?: string | number;
}

export function GraficoRosca({
  fatias,
  titulo,
}: {
  fatias: Fatia[];
  titulo?: string;
}) {
  const pronto = useEntrada();
  const [destacada, setDestacada] = useState<string | null>(null);

  const valores = fatias.map((f) => paraNumero(f.valor));
  const total = valores.reduce((soma, valor) => soma + valor, 0);

  if (total <= 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Sem dados no período.
      </p>
    );
  }

  const raio = 70;
  const circunferencia = 2 * Math.PI * raio;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0">
        <svg
          viewBox="0 0 200 200"
          className="h-44 w-44 -rotate-90"
          role="img"
          aria-label={titulo ?? "Gráfico de participação"}
        >
          {fatias.map((fatia, indice) => {
            const valor = paraNumero(fatia.valor);
            const proporcao = valor / total;
            const traco = proporcao * circunferencia;
            const deslocamento = -acumulado * circunferencia;
            acumulado += proporcao;

            const esmaecida = destacada !== null && destacada !== fatia.nome;

            return (
              <circle
                key={fatia.nome}
                cx="100"
                cy="100"
                r={raio}
                fill="none"
                strokeWidth={destacada === fatia.nome ? 32 : 28}
                stroke={PALETA[indice % PALETA.length]}
                // Preenche o arco a partir do zero quando entra em cena.
                strokeDasharray={
                  pronto
                    ? `${traco} ${circunferencia - traco}`
                    : `0 ${circunferencia}`
                }
                strokeDashoffset={deslocamento}
                opacity={esmaecida ? 0.3 : 1}
                className="transition-all duration-500 ease-saida"
                style={{ transitionDelay: `${indice * 60}ms` }}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-sm font-bold tabular-nums text-slate-700">
            {moeda(total)}
          </span>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-1">
        {fatias.map((fatia, indice) => (
          <li key={fatia.nome}>
            <button
              type="button"
              onMouseEnter={() => setDestacada(fatia.nome)}
              onMouseLeave={() => setDestacada(null)}
              onFocus={() => setDestacada(fatia.nome)}
              onBlur={() => setDestacada(null)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1
                         text-sm transition-colors duration-150 hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: PALETA[indice % PALETA.length],
                    transform: destacada === fatia.nome ? "scale(1.4)" : "scale(1)",
                  }}
                />
                <span className="truncate text-slate-600">{fatia.nome}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-slate-800">
                {moeda(fatia.valor)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface BarraMensal {
  rotulo: string;
  entradas: string | number;
  saidas: string | number;
}

export function GraficoBarras({
  meses,
  titulo,
}: {
  meses: BarraMensal[];
  titulo?: string;
}) {
  const pronto = useEntrada();

  if (!meses.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Sem movimento no período.
      </p>
    );
  }

  const maximo = Math.max(
    ...meses.flatMap((m) => [paraNumero(m.entradas), paraNumero(m.saidas)]),
    1,
  );

  return (
    <div>
      <div
        className="flex h-56 items-end justify-around gap-2 overflow-x-auto px-2"
        role="img"
        aria-label={titulo ?? "Entradas e saídas por mês"}
      >
        {meses.map((mes, indice) => {
          const entradas = paraNumero(mes.entradas);
          const saidas = paraNumero(mes.saidas);
          const atraso = `${indice * 45}ms`;

          return (
            <div
              key={mes.rotulo}
              className="group flex min-w-[44px] flex-1 flex-col items-center gap-1"
            >
              <div className="flex h-48 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 origin-bottom rounded-t bg-emerald-500 transition-all duration-500
                             ease-saida group-hover:bg-emerald-400"
                  style={{
                    height: `${Math.max((entradas / maximo) * 100, 1)}%`,
                    transform: pronto ? "scaleY(1)" : "scaleY(0)",
                    transitionDelay: atraso,
                  }}
                  title={`Entradas: ${moeda(entradas)}`}
                />
                <div
                  className="w-1/2 origin-bottom rounded-t bg-red-500 transition-all duration-500
                             ease-saida group-hover:bg-red-400"
                  style={{
                    height: `${Math.max((saidas / maximo) * 100, 1)}%`,
                    transform: pronto ? "scaleY(1)" : "scaleY(0)",
                    transitionDelay: atraso,
                  }}
                  title={`Saídas: ${moeda(saidas)}`}
                />
              </div>
              <span className="text-xs text-slate-400 transition-colors group-hover:text-slate-700">
                {mes.rotulo}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Saídas
        </span>
      </div>
    </div>
  );
}

/** Barras horizontais comparativas — usado no Ponto de Equilíbrio. */
export function GraficoComparativo({
  itens,
}: {
  itens: { rotulo: string; valor: string | number; cor: string }[];
}) {
  const pronto = useEntrada();
  const maximo = Math.max(...itens.map((i) => paraNumero(i.valor)), 1);

  return (
    <div className="space-y-3">
      {itens.map((item, indice) => (
        <div key={item.rotulo}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{item.rotulo}</span>
            <span className="font-medium tabular-nums text-slate-800">
              {moeda(item.valor)}
            </span>
          </div>
          <div className="h-6 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded transition-[width] duration-700 ease-saida"
              style={{
                width: pronto
                  ? `${(paraNumero(item.valor) / maximo) * 100}%`
                  : "0%",
                backgroundColor: item.cor,
                transitionDelay: `${indice * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
