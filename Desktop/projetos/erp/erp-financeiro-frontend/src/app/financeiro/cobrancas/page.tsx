"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Titulo } from "@/lib/api/tipos";
import { data, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  Dinheiro,
  Tabela,
  corDoStatus,
  type Coluna,
} from "@/components/data";
import { BarraFiltros, CampoBusca, Selecao } from "@/components/data/Filtros";

interface Totais {
  valor_vencido: string;
  valor_a_vencer: string;
  titulos_vencidos: number;
}

/**
 * Cobranças trabalha sobre os mesmos títulos a receber — não é um cadastro
 * próprio. É por isso que o endpoint é somente leitura: a baixa acontece em
 * Contas a Receber, e duplicar o título abriria espaço para divergência.
 */
export default function CobrancasPage() {
  const [busca, setBusca] = useState("");
  const [vencido, setVencido] = useState("");

  const filtros = {
    search: busca || undefined,
    vencido: vencido || undefined,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<Titulo>("cobrancas", filtros),
    [busca, vencido],
  );
  const totais = useRequisicao(
    () => api.buscar<Totais>("cobrancas/totais", filtros),
    [busca, vencido],
  );

  const colunas: Coluna<Titulo>[] = [
    {
      chave: "cliente",
      cabecalho: "Cliente",
      larguraMinima: "180px",
      render: (t) => (
        <span className="font-medium text-slate-800">{t.parceiro_nome}</span>
      ),
    },
    { chave: "documento", cabecalho: "Documento", render: (t) => t.numero_documento },
    {
      chave: "vencimento",
      cabecalho: "Vencimento",
      render: (t) => (
        <span className={t.esta_vencido ? "font-medium text-red-600" : ""}>
          {data(t.vencimento)}
        </span>
      ),
    },
    {
      chave: "atraso",
      cabecalho: "Dias Atraso",
      alinhamento: "centro",
      render: (t) =>
        t.dias_atraso > 0 ? (
          <span className="font-medium text-red-600">{t.dias_atraso} dias</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      chave: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      render: (t) => <Dinheiro valor={t.valor} forcarCor="verde" />,
    },
    {
      chave: "encargos",
      cabecalho: "Juros / Multa",
      alinhamento: "direita",
      render: (t) => (
        <span className="text-xs text-slate-500">
          {moeda(t.juros)} / {moeda(t.multa)}
        </span>
      ),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (t) => (
        <Badge cor={corDoStatus(t.status_efetivo)}>{t.status_efetivo}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Cobranças"
        subtitulo="Gestão de cobranças e acompanhamento de inadimplência"
        icone="BadgeDollarSign"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Títulos Vencidos",
            valor: String(totais.dados?.titulos_vencidos ?? 0),
            cor: "vermelho",
            icone: "AlertTriangle",
            destaque: true,
          },
          {
            rotulo: "Valor Vencido",
            valor: moeda(totais.dados?.valor_vencido),
            cor: "vermelho",
            icone: "Receipt",
          },
          {
            rotulo: "Valor a Vencer",
            valor: moeda(totais.dados?.valor_a_vencer),
            cor: "ambar",
            icone: "Clock",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar cliente..." />
        <Selecao
          valor={vencido}
          aoMudar={setVencido}
          rotuloVazio="Todos os títulos"
          opcoes={[
            { valor: "true", rotulo: "Somente vencidos" },
            { valor: "false", rotulo: "Somente em dia" },
          ]}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={lista.dados?.results ?? []}
        chave={(t) => t.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhuma cobrança encontrada" }}
      />
    </>
  );
}
