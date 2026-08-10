"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ListaPreco } from "@/lib/api/tipos";
import { moeda, percentual } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca } from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { useOpcoes } from "@/lib/api/opcoes";

export default function ListaPrecosPage() {
  const [busca, setBusca] = useState("");
  const opcoes = useOpcoes();

  const lista = useRequisicao(
    () =>
      api.listar<ListaPreco>("lista-precos", {
        search: busca || undefined,
        page_size: 100,
      }),
    [busca],
  );

  const criacao = useCriacao(lista.recarregar);
  const registros = lista.dados?.results ?? [];
  const valores = registros.map((p) => Number(p.valor_final));
  const media = valores.length
    ? valores.reduce((s, v) => s + v, 0) / valores.length
    : 0;

  const colunas: Coluna<ListaPreco>[] = [
    {
      chave: "codigo",
      cabecalho: "Código",
      render: (p) => (
        <span className="font-mono text-xs text-slate-500">
          {p.servico_codigo ?? "—"}
        </span>
      ),
    },
    {
      chave: "servico",
      cabecalho: "Serviço",
      larguraMinima: "200px",
      render: (p) => (
        <span className="font-medium text-slate-800">{p.servico_nome}</span>
      ),
    },
    {
      chave: "forma",
      cabecalho: "Forma de Pagamento",
      render: (p) => p.forma_pagamento_nome ?? "—",
    },
    {
      chave: "valor",
      cabecalho: "Preço Base",
      alinhamento: "direita",
      render: (p) => <Dinheiro valor={p.valor} />,
    },
    {
      chave: "desconto",
      cabecalho: "Desconto",
      alinhamento: "direita",
      render: (p) =>
        Number(p.desconto) > 0 ? (
          <span className="font-medium text-red-600">
            -{percentual(p.desconto)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      chave: "final",
      cabecalho: "Preço Final",
      alinhamento: "direita",
      render: (p) => <Dinheiro valor={p.valor_final} forcarCor="verde" />,
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (p) => (
        <Badge cor={p.ativo ? "verde" : "vermelho"}>
          {p.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Lista de Preços"
        subtitulo="Tabela de preços por serviço e forma de pagamento"
        icone="Tag"
        acoes={<BotaoNovo rotulo="Novo Preço" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Novo Preço"
          recurso="lista-precos"
          rotuloAcao="Salvar preço"
          campos={[
            { nome: "servico", rotulo: "Serviço", tipo: "selecao", opcoes: opcoes.servicos, obrigatorio: true, largura: "inteira" },
            { nome: "forma_pagamento", rotulo: "Forma de pagamento", tipo: "selecao", opcoes: opcoes.formas },
            { nome: "valor", rotulo: "Preço base (R$)", tipo: "numero", passo: "0.01", obrigatorio: true },
            { nome: "desconto", rotulo: "Desconto (%)", tipo: "numero", passo: "0.01", padrao: "0", ajuda: "O preço final é calculado no backend." },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          { rotulo: "Total de Itens", valor: String(registros.length), icone: "Layers" },
          {
            rotulo: "Preço Médio",
            valor: moeda(media),
            cor: "verde",
            icone: "DollarSign",
          },
          {
            rotulo: "Com Desconto",
            valor: String(registros.filter((p) => Number(p.desconto) > 0).length),
            cor: "ambar",
            icone: "Tag",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por serviço ou código..."
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(p) => p.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhum preço cadastrado" }}
      />

      <p className="mt-4 text-xs text-slate-400">
        A planilha define Serviço, Valor, Forma de pagamento e Desconto. Faixa,
        quantidade mínima e vigência aparecem apenas no protótipo e aguardam
        validação.
      </p>
    </>
  );
}
