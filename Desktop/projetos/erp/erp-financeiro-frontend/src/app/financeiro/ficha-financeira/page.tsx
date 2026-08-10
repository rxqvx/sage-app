"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type {
  ContaFinanceira,
  FichaFinanceira,
  Parceiro,
} from "@/lib/api/tipos";
import { data, moeda, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, FiltroPeriodo, Selecao } from "@/components/data/Filtros";

type Linha = FichaFinanceira["linhas"][number];

export default function FichaFinanceiraPage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [conta, setConta] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [tipo, setTipo] = useState("");

  const ficha = useRequisicao(
    () =>
      api.buscar<FichaFinanceira>("relatorios/ficha-financeira", {
        inicio,
        fim,
        conta: conta || undefined,
        parceiro: parceiro || undefined,
        tipo: tipo || undefined,
      }),
    [inicio, fim, conta, parceiro, tipo],
  );

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );
  const parceiros = useRequisicao(() =>
    api.listar<Parceiro>("parceiros", { page_size: 200 }),
  );

  const colunas: Coluna<Linha>[] = [
    { chave: "data", cabecalho: "Data", render: (l) => data(l.data) },
    {
      chave: "tipo",
      cabecalho: "Tipo",
      render: (l) => (
        <Badge cor={l.tipo === "Entrada" ? "verde" : "vermelho"}>
          {l.tipo.toUpperCase()}
        </Badge>
      ),
    },
    {
      chave: "destinatario",
      cabecalho: "Destinatário",
      larguraMinima: "170px",
      render: (l) => (
        <span className="font-medium text-slate-800">{l.destinatario}</span>
      ),
    },
    {
      chave: "descricao",
      cabecalho: "Descrição",
      render: (l) => l.descricao ?? "—",
    },
    { chave: "banco", cabecalho: "Banco", render: (l) => l.banco },
    {
      chave: "categoria",
      cabecalho: "Categoria",
      render: (l) => l.categoria ?? "—",
    },
    {
      chave: "entrada",
      cabecalho: "Entradas",
      alinhamento: "direita",
      render: (l) =>
        Number(l.entrada) > 0 ? (
          <Dinheiro valor={l.entrada} forcarCor="verde" />
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      chave: "saida",
      cabecalho: "Saídas",
      alinhamento: "direita",
      render: (l) =>
        Number(l.saida) > 0 ? (
          <Dinheiro valor={l.saida} forcarCor="vermelho" />
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      chave: "acumulado",
      cabecalho: "Saldo Acum.",
      alinhamento: "direita",
      render: (l) => <Dinheiro valor={l.saldo_acumulado} colorir />,
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Ficha Financeira"
        subtitulo="Histórico financeiro consolidado de entradas e saídas"
        icone="FileCheck"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Entradas",
            valor: moeda(ficha.dados?.total_entradas),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Total Saídas",
            valor: moeda(ficha.dados?.total_saidas),
            cor: "vermelho",
            icone: "TrendingDown",
          },
          {
            rotulo: "Saldo Líquido",
            valor: moeda(ficha.dados?.saldo_liquido),
            cor:
              Number(ficha.dados?.saldo_liquido ?? 0) >= 0 ? "verde" : "vermelho",
            icone: "Calculator",
          },
        ]}
      />

      <BarraFiltros>
        <Selecao
          valor={conta}
          aoMudar={setConta}
          rotuloVazio="Todos os bancos"
          opcoes={(contas.dados?.results ?? []).map((c) => ({
            valor: String(c.id),
            rotulo: c.nome,
          }))}
        />
        <Selecao
          valor={parceiro}
          aoMudar={setParceiro}
          rotuloVazio="Cliente / Fornecedor"
          opcoes={(parceiros.dados?.results ?? []).map((p) => ({
            valor: String(p.id),
            rotulo: p.nome,
          }))}
        />
        <Selecao
          valor={tipo}
          aoMudar={setTipo}
          rotuloVazio="Todos os tipos"
          opcoes={[
            { valor: "1", rotulo: "Entradas" },
            { valor: "2", rotulo: "Saídas" },
          ]}
        />
        <FiltroPeriodo
          inicio={inicio}
          fim={fim}
          aoMudarInicio={setInicio}
          aoMudarFim={setFim}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={ficha.dados?.linhas ?? []}
        chave={(l) => l.id}
        carregando={ficha.carregando}
        erro={ficha.erro}
        aoTentarNovamente={ficha.recarregar}
        vazio={{
          titulo: "Nenhum movimento no período",
          descricao: "A ficha mostra apenas lançamentos já liquidados.",
        }}
      />
    </>
  );
}
