"use client";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { DashboardResumo } from "@/lib/api/tipos";
import { competencia, data, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  Dinheiro,
  EstadoCarregando,
  EstadoErro,
  corDoStatus,
} from "@/components/data";
import { GraficoBarras, GraficoRosca } from "@/components/data/Graficos";

export default function DashboardPage() {
  const { dados, carregando, erro, recarregar } = useRequisicao(() =>
    api.buscar<DashboardResumo>("dashboard/resumo"),
  );

  if (carregando) {
    return (
      <>
        <PageHeader
          titulo="Visão Geral Financeira"
          subtitulo="Resumo consolidado das contas, saldos e movimentações"
        />
        <EstadoCarregando linhas={8} />
      </>
    );
  }

  if (erro || !dados) {
    return (
      <>
        <PageHeader titulo="Visão Geral Financeira" />
        <div className="cartao">
          <EstadoErro
            mensagem={erro ?? "Sem dados."}
            aoTentarNovamente={recarregar}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Visão Geral Financeira"
        subtitulo="Resumo consolidado das contas, saldos e movimentações"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Saldo em Bancos",
            valor: moeda(dados.saldo_em_bancos),
            descricao: `${dados.quantidade_contas} conta(s) ativa(s)`,
            icone: "Landmark",
          },
          {
            rotulo: "Entradas Líquidas",
            valor: moeda(dados.entradas_liquidas),
            descricao: "Recebimentos liquidados",
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Saídas Líquidas",
            valor: moeda(dados.saidas_liquidas),
            descricao: "Pagamentos efetuados",
            cor: "vermelho",
            icone: "TrendingDown",
          },
          {
            rotulo: "Inadimplência",
            valor: moeda(dados.inadimplencia),
            descricao: "Títulos já vencidos",
            cor: "vermelho",
            icone: "AlertTriangle",
            destaque: true,
          },
        ]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="cartao p-5">
          <p className="text-sm text-slate-500">Contas a Pagar</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
            {moeda(dados.contas_pagar)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Abertas e a vencer</p>
        </div>
        <div className="cartao p-5">
          <p className="text-sm text-slate-500">Contas a Receber</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-blue-600">
            {moeda(dados.contas_receber)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Abertas e a receber</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <div className="cartao p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-900">
            Fluxo de Caixa — Evolução Mensal
          </h2>
          <GraficoBarras
            meses={dados.evolucao_mensal.map((mes) => ({
              rotulo: competencia(mes.competencia).split("/")[0],
              entradas: mes.entradas,
              saidas: mes.saidas,
            }))}
          />
        </div>

        <div className="cartao p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">
            Despesas por Categoria
          </h2>
          <GraficoRosca
            fatias={dados.despesas_por_categoria.map((item) => ({
              nome: item.nome,
              valor: item.valor,
            }))}
          />
        </div>
      </div>

      <div className="cartao">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Lançamentos Recentes no Fluxo de Caixa
          </h2>
        </div>
        {dados.lancamentos_recentes.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Nenhum lançamento registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Destinatário</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados.lancamentos_recentes.map((lancamento) => (
                  <tr key={lancamento.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">{data(lancamento.data)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        cor={lancamento.tipo === "Entrada" ? "verde" : "vermelho"}
                      >
                        {lancamento.tipo.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {lancamento.destinatario}
                      </span>
                      {lancamento.descricao && (
                        <span className="block text-xs text-slate-400">
                          {lancamento.descricao}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lancamento.banco}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Dinheiro valor={lancamento.valor} colorir />
                    </td>
                    <td className="px-4 py-3">
                      <Badge cor={corDoStatus(lancamento.status)}>
                        {lancamento.status.toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
