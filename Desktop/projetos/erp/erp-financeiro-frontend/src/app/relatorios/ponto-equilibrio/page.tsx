"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { LinhaPontoEquilibrio, PontoEquilibrio } from "@/lib/api/tipos";
import { moeda, numero, percentual, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
  EstadoVazio,
} from "@/components/data";
import { GraficoComparativo } from "@/components/data/Graficos";
import { BarraFiltros, FiltroPeriodo } from "@/components/data/Filtros";

/**
 * Ponto de Equilíbrio por linha de negócio.
 *
 * A planilha calcula separadamente para Superendividamento e Defesa,
 * rateando os custos pela participação de cada uma no faturamento — por isso
 * a tela mostra um bloco por linha, e não um número único.
 */
export default function PontoEquilibrioPage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);

  const relatorio = useRequisicao(
    () =>
      api.buscar<PontoEquilibrio>("relatorios/ponto-equilibrio", { inicio, fim }),
    [inicio, fim],
  );

  return (
    <>
      <PageHeader
        titulo="Ponto de Equilíbrio"
        subtitulo="Análise por linha de negócio, com rateio pela participação no faturamento"
        icone="BarChart3"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Faturamento Total",
            valor: moeda(relatorio.dados?.faturamento_total),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Custos e Despesas Fixas",
            valor: moeda(relatorio.dados?.despesas.custos_fixos),
            cor: "ambar",
            icone: "Target",
          },
          {
            rotulo: "Despesas Variáveis",
            valor: moeda(relatorio.dados?.despesas.variaveis),
            cor: "vermelho",
            icone: "TrendingDown",
          },
          {
            rotulo: "Lucro Desejado",
            valor: moeda(relatorio.dados?.lucro_desejado),
            descricao: "Base do Ponto de Lucro",
            cor: "roxo",
            icone: "Goal",
          },
        ]}
      />

      <BarraFiltros>
        <FiltroPeriodo
          inicio={inicio}
          fim={fim}
          aoMudarInicio={setInicio}
          aoMudarFim={setFim}
        />
      </BarraFiltros>

      {relatorio.carregando ? (
        <EstadoCarregando linhas={8} />
      ) : relatorio.erro || !relatorio.dados ? (
        <div className="cartao">
          <EstadoErro
            mensagem={relatorio.erro ?? "Sem dados."}
            aoTentarNovamente={relatorio.recarregar}
          />
        </div>
      ) : relatorio.dados.linhas_negocio.length === 0 ? (
        <div className="cartao">
          <EstadoVazio
            titulo="Nenhuma linha de negócio cadastrada"
            descricao="Cadastre as linhas em Cadastros para calcular o ponto de equilíbrio."
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {relatorio.dados.linhas_negocio.map((linha) => (
            <BlocoLinha key={linha.linha_negocio_id} linha={linha} />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        A quantidade vendida de cada linha é informada em Administração ›
        Investimentos e quantidades. O Lucro Desejado é definido em Parâmetros
        Fiscais.
      </p>
    </>
  );
}

function BlocoLinha({ linha }: { linha: LinhaPontoEquilibrio }) {
  const semCalculo = linha.ponto_equilibrio === null;

  return (
    <section className="cartao overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-amber-50/60 px-5 py-3">
        <h2 className="font-semibold text-slate-900">{linha.linha_negocio}</h2>
        <span className="text-sm text-slate-500">
          {percentual(linha.participacao)} do faturamento
        </span>
      </div>

      {semCalculo ? (
        <div className="px-5 py-6">
          <p className="text-sm text-slate-500">{linha.observacao}</p>
          <dl className="mt-4 space-y-1 text-sm">
            <Linha rotulo="Faturamento" valor={moeda(linha.faturamento)} />
            <Linha
              rotulo="Quantidade vendida"
              valor={numero(linha.quantidade_vendida)}
            />
          </dl>
        </div>
      ) : (
        <>
          <dl className="divide-y divide-slate-100 text-sm">
            <Linha rotulo="Faturamento" valor={moeda(linha.faturamento)} />
            <Linha
              rotulo="Quantidade vendida"
              valor={String(linha.quantidade_vendida)}
            />
            <Linha
              rotulo="(+) Preço médio de venda"
              valor={moeda(linha.preco_medio)}
            />
            <Linha
              rotulo="(-) Despesas de comercialização"
              valor={moeda(linha.despesas_comercializacao_unitaria)}
              negativo
            />
            <Linha
              rotulo="(-) Despesas variáveis"
              valor={moeda(linha.despesas_variaveis_unitaria)}
              negativo
            />
            <Linha
              rotulo="(=) Margem de contribuição"
              valor={moeda(linha.margem_contribuicao)}
              destaque
            />
            <Linha
              rotulo="(%) MC / Preço de venda"
              valor={percentual(linha.percentual_margem)}
            />
            <Linha
              rotulo="(-) Custos e despesas fixas (unit.)"
              valor={moeda(linha.custos_fixos_unitario)}
              negativo
            />
            <Linha
              rotulo="Lucro unitário"
              valor={moeda(linha.lucro_unitario)}
              destaque
            />
          </dl>

          <div className="grid grid-cols-2 gap-px bg-slate-200">
            <div className="bg-slate-900 px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Ponto de Equilíbrio
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {numero(linha.ponto_equilibrio)} un.
              </p>
            </div>
            <div className="bg-slate-900 px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Ponto de Lucro
              </p>
              <p className="mt-1 text-xl font-bold text-brand">
                {numero(linha.ponto_lucro)} un.
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            <GraficoComparativo
              itens={[
                {
                  rotulo: "Custos fixos rateados",
                  valor: linha.custos_fixos_rateados,
                  cor: "#f59e0b",
                },
                {
                  rotulo: "Faturamento da linha",
                  valor: linha.faturamento,
                  cor: "#10b981",
                },
              ]}
            />
          </div>
        </>
      )}
    </section>
  );
}

function Linha({
  rotulo,
  valor,
  negativo,
  destaque,
}: {
  rotulo: string;
  valor: string;
  negativo?: boolean;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-2.5 ${
        destaque ? "bg-slate-50 font-semibold" : ""
      }`}
    >
      <dt className="text-slate-600">{rotulo}</dt>
      <dd
        className={`tabular-nums ${
          negativo ? "text-red-600" : "text-slate-800"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
