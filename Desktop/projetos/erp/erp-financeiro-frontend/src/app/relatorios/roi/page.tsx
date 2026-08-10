"use client";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Roi } from "@/lib/api/tipos";
import { data, moeda, percentual } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";

type Item = Roi["investimentos"][number];

export default function RoiPage() {
  const roi = useRequisicao(() => api.buscar<Roi>("relatorios/roi"));

  const colunas: Coluna<Item>[] = [
    {
      chave: "nome",
      cabecalho: "Investimento",
      larguraMinima: "180px",
      render: (i) => (
        <span>
          <span className="block font-medium text-slate-800">{i.nome}</span>
          {i.centro_custo && (
            <span className="block text-xs text-slate-400">{i.centro_custo}</span>
          )}
        </span>
      ),
    },
    { chave: "inicio", cabecalho: "Início", render: (i) => data(i.data_inicio) },
    {
      chave: "periodo",
      cabecalho: "Período",
      render: (i) => (i.periodo_meses ? `${i.periodo_meses} meses` : "—"),
    },
    {
      chave: "investido",
      cabecalho: "Investido",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.valor_investido} />,
    },
    {
      chave: "receita",
      cabecalho: "Receita Gerada",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.receita_gerada} forcarCor="verde" />,
    },
    {
      chave: "custos",
      cabecalho: "Custos",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.custos_operacionais} forcarCor="vermelho" />,
    },
    {
      chave: "lucro",
      cabecalho: "Lucro Obtido",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.lucro_obtido} colorir />,
    },
    {
      chave: "roi",
      cabecalho: "ROI (planilha)",
      alinhamento: "direita",
      render: (i) => (
        <span
          className={
            Number(i.roi ?? 0) >= 0
              ? "font-medium text-emerald-600"
              : "font-medium text-red-600"
          }
        >
          {i.roi === null ? "—" : percentual(i.roi)}
        </span>
      ),
    },
    {
      chave: "roi_conv",
      cabecalho: "ROI (convencional)",
      alinhamento: "direita",
      render: (i) => (
        <span className="text-slate-600">
          {i.roi_convencional === null ? "—" : percentual(i.roi_convencional)}
        </span>
      ),
    },
    {
      chave: "anual",
      cabecalho: "Retorno Anual",
      alinhamento: "direita",
      render: (i) =>
        i.retorno_anual === null ? "—" : `${percentual(i.retorno_anual)}/ano`,
    },
  ];

  return (
    <>
      <PageHeader
        titulo="ROI — Retorno sobre Investimento"
        subtitulo="Análise de retorno sobre investimentos realizados"
        icone="PieChart"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Investido",
            valor: moeda(roi.dados?.total_investido),
            cor: "ambar",
            icone: "DollarSign",
          },
          {
            rotulo: "Receita Gerada",
            valor: moeda(roi.dados?.receita_gerada),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Lucro Obtido",
            valor: moeda(roi.dados?.lucro_obtido),
            descricao: "Receita − Custos",
            cor: "azul",
            icone: "Calculator",
          },
          {
            rotulo: "ROI Geral",
            valor:
              roi.dados?.roi_convencional === null ||
              roi.dados?.roi_convencional === undefined
                ? "—"
                : percentual(roi.dados.roi_convencional),
            descricao: "Lucro / Investimento",
            cor: "roxo",
            icone: "PieChart",
          },
        ]}
      />

      <Tabela
        titulo="Investimentos"
        colunas={colunas}
        registros={roi.dados?.investimentos ?? []}
        chave={(i) => i.id}
        carregando={roi.carregando}
        erro={roi.erro}
        aoTentarNovamente={roi.recarregar}
        vazio={{
          titulo: "Nenhum investimento cadastrado",
          descricao:
            "Cadastre os investimentos em Administração › Investimentos para acompanhar o retorno.",
        }}
      />

      <p className="mt-4 text-xs text-slate-400">
        A planilha define ROI como (Lucro − Investimento) / Investimento, o que
        é atípico — a fórmula usual é Lucro / Investimento. As duas são exibidas
        até que a definição seja validada.
      </p>
    </>
  );
}
