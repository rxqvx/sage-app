"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ResumoCategorias } from "@/lib/api/tipos";
import { moeda, percentual, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
} from "@/components/data";
import { GraficoRosca } from "@/components/data/Graficos";
import { BarraFiltros, FiltroPeriodo, Selecao } from "@/components/data/Filtros";

export default function ResumoCategoriasPage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [agrupamento, setAgrupamento] = useState("categoria");

  const resumo = useRequisicao(
    () =>
      api.buscar<ResumoCategorias>("relatorios/resumo-categorias", {
        inicio,
        fim,
        agrupar_por: agrupamento,
      }),
    [inicio, fim, agrupamento],
  );

  return (
    <>
      <PageHeader
        titulo="Resumo por Categoria"
        subtitulo="Receitas e despesas agrupadas por categoria, subcategoria ou centro de custo"
        icone="PieChart"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Receitas",
            valor: moeda(resumo.dados?.total_receitas),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Total Despesas",
            valor: moeda(resumo.dados?.total_despesas),
            cor: "vermelho",
            icone: "TrendingDown",
          },
          {
            rotulo: "Saldo",
            valor: moeda(resumo.dados?.saldo),
            cor: Number(resumo.dados?.saldo ?? 0) >= 0 ? "verde" : "vermelho",
            icone: "Calculator",
          },
        ]}
      />

      <BarraFiltros>
        <Selecao
          valor={agrupamento}
          aoMudar={setAgrupamento}
          rotuloVazio="Agrupar por..."
          opcoes={[
            { valor: "categoria", rotulo: "Categoria" },
            { valor: "subcategoria", rotulo: "Subcategoria" },
            { valor: "centro_custo", rotulo: "Centro de Custo" },
            { valor: "natureza", rotulo: "Natureza" },
          ]}
        />
        <FiltroPeriodo
          inicio={inicio}
          fim={fim}
          aoMudarInicio={setInicio}
          aoMudarFim={setFim}
        />
      </BarraFiltros>

      {resumo.carregando ? (
        <EstadoCarregando linhas={8} />
      ) : resumo.erro || !resumo.dados ? (
        <div className="cartao">
          <EstadoErro
            mensagem={resumo.erro ?? "Sem dados."}
            aoTentarNovamente={resumo.recarregar}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="cartao p-5">
              <h2 className="mb-4 font-semibold text-slate-900">
                Receitas por {rotuloAgrupamento(agrupamento)}
              </h2>
              <GraficoRosca
                fatias={resumo.dados.receitas.map((r) => ({
                  nome: r.nome,
                  valor: r.valor,
                }))}
              />
            </div>
            <div className="cartao p-5">
              <h2 className="mb-4 font-semibold text-slate-900">
                Despesas por {rotuloAgrupamento(agrupamento)}
              </h2>
              <GraficoRosca
                fatias={resumo.dados.despesas.map((d) => ({
                  nome: d.nome,
                  valor: d.valor,
                }))}
              />
            </div>
          </div>

          <div className="cartao overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Detalhamento</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">
                      {rotuloAgrupamento(agrupamento)}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumo.dados.receitas.map((item) => (
                    <tr key={`r-${item.id}-${item.nome}`}>
                      <td className="px-4 py-3">
                        <Badge cor="verde">RECEITA</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.nome}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-600">
                        {moeda(item.valor)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {percentual(item.percentual)}
                      </td>
                    </tr>
                  ))}
                  {resumo.dados.despesas.map((item) => (
                    <tr key={`d-${item.id}-${item.nome}`}>
                      <td className="px-4 py-3">
                        <Badge cor="vermelho">DESPESA</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.nome}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-red-600">
                        {moeda(item.valor)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {percentual(item.percentual)}
                      </td>
                    </tr>
                  ))}
                  {resumo.dados.receitas.length === 0 &&
                    resumo.dados.despesas.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-slate-400"
                        >
                          Sem movimento no período.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function rotuloAgrupamento(chave: string) {
  const rotulos: Record<string, string> = {
    categoria: "Categoria",
    subcategoria: "Subcategoria",
    centro_custo: "Centro de Custo",
    natureza: "Natureza",
  };
  return rotulos[chave] ?? "Categoria";
}
