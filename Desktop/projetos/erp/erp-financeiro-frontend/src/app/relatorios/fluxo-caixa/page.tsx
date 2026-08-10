"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaFinanceira, FluxoCaixa, MesFluxo } from "@/lib/api/tipos";
import { competencia, moeda, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
  EstadoVazio,
} from "@/components/data";
import { GraficoBarras } from "@/components/data/Graficos";
import { BarraFiltros, FiltroPeriodo, Selecao } from "@/components/data/Filtros";
import { cn } from "@/lib/utils";

/**
 * Fluxo de Caixa do realizado, agrupado por centro de custo com as
 * subcategorias recolhíveis — o layout que a planilha descreve.
 *
 * O protótipo mostrava "Projetado vs Realizado", mas a planilha não tem
 * nenhum conceito de projeção ou orçamento; seguir o protótipo aqui exigiria
 * inventar um dado que não existe.
 */
export default function FluxoCaixaPage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [conta, setConta] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const fluxo = useRequisicao(
    () =>
      api.buscar<FluxoCaixa>("relatorios/fluxo-caixa", {
        inicio,
        fim,
        conta: conta || undefined,
      }),
    [inicio, fim, conta],
  );

  const mensal = useRequisicao(
    () =>
      api.buscar<{ meses: MesFluxo[] }>("relatorios/fluxo-caixa-mensal", {
        inicio,
        fim,
        conta: conta || undefined,
      }),
    [inicio, fim, conta],
  );

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  return (
    <>
      <PageHeader
        titulo="Fluxo de Caixa"
        subtitulo="Movimento realizado, agrupado por centro de custo"
        icone="TrendingUp"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Saldo Inicial",
            valor: moeda(fluxo.dados?.saldo_inicial),
            descricao: "Acumulado até o início do período",
            icone: "Wallet",
          },
          {
            rotulo: "Total de Entradas",
            valor: moeda(fluxo.dados?.total_entradas),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Total de Saídas",
            valor: moeda(fluxo.dados?.total_saidas),
            cor: "vermelho",
            icone: "TrendingDown",
          },
          {
            rotulo: "Saldo Final",
            valor: moeda(fluxo.dados?.saldo_final),
            cor:
              Number(fluxo.dados?.saldo_final ?? 0) >= 0 ? "verde" : "vermelho",
            icone: "Calculator",
          },
        ]}
      />

      <BarraFiltros>
        <Selecao
          valor={conta}
          aoMudar={setConta}
          rotuloVazio="Todas as contas"
          opcoes={(contas.dados?.results ?? []).map((c) => ({
            valor: String(c.id),
            rotulo: c.nome,
          }))}
        />
        <FiltroPeriodo
          inicio={inicio}
          fim={fim}
          aoMudarInicio={setInicio}
          aoMudarFim={setFim}
        />
      </BarraFiltros>

      <div className="cartao mb-6 p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Evolução Mensal</h2>
        <GraficoBarras
          meses={(mensal.dados?.meses ?? []).map((mes) => ({
            rotulo: competencia(mes.competencia).split("/")[0],
            entradas: mes.entradas,
            saidas: mes.saidas,
          }))}
        />
      </div>

      <div className="cartao overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            {fluxo.dados?.empresa ?? "R&S"} · {fluxo.dados?.conta ?? "—"}
          </h2>
          <p className="text-sm text-slate-500">
            {fluxo.dados?.periodo.rotulo ?? ""}
          </p>
        </div>

        {fluxo.carregando ? (
          <EstadoCarregando linhas={6} />
        ) : fluxo.erro ? (
          <EstadoErro mensagem={fluxo.erro} aoTentarNovamente={fluxo.recarregar} />
        ) : !fluxo.dados?.centros_custo.length ? (
          <EstadoVazio
            titulo="Sem movimento no período"
            descricao="Registre lançamentos classificados por centro de custo para vê-los aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                  <th className="px-5 py-3 text-left font-medium">
                    Centro de Custo / Subcategoria
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Entradas (R$)</th>
                  <th className="px-5 py-3 text-right font-medium">Saídas (R$)</th>
                  <th className="px-5 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fluxo.dados.centros_custo.map((centro) => {
                  const aberto = abertos[centro.centro_custo] ?? false;
                  return (
                    <>
                      <tr
                        key={centro.centro_custo}
                        className="cursor-pointer bg-slate-50/40 hover:bg-slate-100/60"
                        onClick={() =>
                          setAbertos((a) => ({
                            ...a,
                            [centro.centro_custo]: !aberto,
                          }))
                        }
                      >
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          <span className="flex items-center gap-2">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-slate-400 transition-transform",
                                aberto && "rotate-180",
                              )}
                            />
                            {centro.centro_custo}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-emerald-600">
                          {moeda(centro.entradas)}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-red-600">
                          {moeda(centro.saidas)}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-right font-semibold tabular-nums",
                            Number(centro.saldo) >= 0
                              ? "text-slate-800"
                              : "text-red-600",
                          )}
                        >
                          {moeda(centro.saldo)}
                        </td>
                      </tr>

                      {aberto &&
                        centro.subcategorias.map((sub) => (
                          <tr key={`${centro.centro_custo}-${sub.subcategoria}`}>
                            <td className="py-2 pl-12 pr-5 text-slate-600">
                              {sub.subcategoria}
                            </td>
                            <td className="px-5 py-2 text-right tabular-nums text-emerald-600">
                              {Number(sub.entradas) ? moeda(sub.entradas) : "—"}
                            </td>
                            <td className="px-5 py-2 text-right tabular-nums text-red-600">
                              {Number(sub.saidas) ? moeda(sub.saidas) : "—"}
                            </td>
                            <td className="px-5 py-2 text-right tabular-nums text-slate-600">
                              {moeda(sub.saldo)}
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100">
                <tr>
                  <td className="px-5 py-3 font-bold text-slate-900">TOTAIS</td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-emerald-700">
                    {moeda(fluxo.dados.total_entradas)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-red-700">
                    {moeda(fluxo.dados.total_saidas)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                    {moeda(fluxo.dados.saldo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
