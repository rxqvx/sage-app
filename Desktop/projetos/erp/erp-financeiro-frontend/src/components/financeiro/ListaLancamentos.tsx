"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaFinanceira, LancamentoCaixa } from "@/lib/api/tipos";
import { data, moeda, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  Dinheiro,
  Tabela,
  corDoStatus,
  type Coluna,
} from "@/components/data";
import {
  BarraFiltros,
  CampoBusca,
  FiltroPeriodo,
  Selecao,
} from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalNovoLancamento } from "./ModalNovoLancamento";
import { ModalImportarExcel } from "./ModalImportarExcel";

interface Totais {
  entradas: string;
  saidas: string;
  pendentes: string;
  saldo: string;
}

/**
 * Entradas e Saídas usam a mesma tela.
 *
 * A planilha define as duas abas com exatamente os mesmos campos, mudando
 * apenas o sentido do dinheiro — por isso o componente é um só, parametrizado
 * pelo tipo.
 */
export function ListaLancamentos({ tipo }: { tipo: 1 | 2 }) {
  const ehEntrada = tipo === 1;
  const padrao = periodoPadrao();

  const [busca, setBusca] = useState("");
  const [conta, setConta] = useState("");
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);

  const filtros = {
    tipo,
    search: busca || undefined,
    conta_financeira: conta || undefined,
    inicio,
    fim,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<LancamentoCaixa>("lancamentos", filtros),
    [tipo, busca, conta, inicio, fim],
  );

  const totais = useRequisicao(
    () => api.buscar<Totais>("lancamentos/totais", filtros),
    [tipo, busca, conta, inicio, fim],
  );

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  const recarregar = () => {
    lista.recarregar();
    totais.recarregar();
  };
  const criacao = useCriacao(recarregar);
  const [importando, setImportando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const colunas: Coluna<LancamentoCaixa>[] = [
    {
      chave: "data",
      cabecalho: "Data Lanç.",
      render: (l) => data(l.data_lancamento),
    },
    {
      chave: "valor",
      cabecalho: "Valor (R$)",
      alinhamento: "direita",
      render: (l) => (
        <Dinheiro valor={l.valor} forcarCor={ehEntrada ? "verde" : "vermelho"} />
      ),
    },
    {
      chave: "destinatario",
      cabecalho: ehEntrada ? "Destinatário / Pagador" : "Favorecido / Fornecedor",
      larguraMinima: "180px",
      render: (l) => (
        <span className="font-medium text-slate-800">{l.destinatario}</span>
      ),
    },
    {
      chave: "descricao",
      cabecalho: "Descrição",
      render: (l) => (
        <span className="text-slate-600">{l.descricao ?? "—"}</span>
      ),
    },
    {
      chave: "banco",
      cabecalho: "Banco",
      render: (l) => l.conta_financeira_nome,
    },
    {
      chave: "classificacao",
      cabecalho: "Categoria / Sub",
      larguraMinima: "170px",
      render: (l) =>
        l.categoria_nome ? (
          <span>
            <span className="block text-slate-700">{l.categoria_nome}</span>
            <span className="block text-xs text-slate-400">
              {l.subcategoria_nome ?? "—"}
            </span>
          </span>
        ) : (
          <Badge cor="ambar">não classificado</Badge>
        ),
    },
    {
      chave: "centro",
      cabecalho: "Centro de Custo",
      render: (l) => l.centro_custo_nome ?? "—",
    },
    {
      chave: "forma",
      cabecalho: "Forma Pagto.",
      render: (l) => l.forma_pagamento_nome ?? "—",
    },
    {
      chave: "pagamento",
      cabecalho: "Data Pagto.",
      render: (l) => (l.data_pagamento ? data(l.data_pagamento) : "—"),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (l) => (
        <Badge cor={corDoStatus(l.status_display)}>
          {l.status_display.toLowerCase()}
        </Badge>
      ),
    },
  ];

  const registros = lista.dados?.results ?? [];

  return (
    <>
      <PageHeader
        titulo={ehEntrada ? "Entradas de Caixa (Recebimentos)" : "Saídas de Caixa (Pagamentos)"}
        subtitulo={
          ehEntrada
            ? "Fluxo diário de recebimentos e entradas vinculadas"
            : "Fluxo diário de pagamentos e saídas efetuadas"
        }
        icone={ehEntrada ? "TrendingUp" : "TrendingDown"}
        acoes={
          <>
            <button
              type="button"
              onClick={() => setImportando(true)}
              className="botao-secundario"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar Excel
            </button>
            <BotaoNovo
              rotulo={ehEntrada ? "Nova Entrada" : "Nova Saída"}
              aoClicar={criacao.abrir}
            />
          </>
        }
      />

      {aviso && (
        <div className="animate-surgir mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {aviso}
        </div>
      )}

      {criacao.aberto && (
        <ModalNovoLancamento
          tipoFixo={tipo}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      {importando && (
        <ModalImportarExcel
          tipo={tipo}
          aoFechar={() => setImportando(false)}
          aoConcluir={(importados) => {
            setImportando(false);
            setAviso(`${importados} lançamento(s) importado(s) da planilha.`);
            recarregar();
            setTimeout(() => setAviso(null), 5000);
          }}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: ehEntrada ? "Total de Entradas" : "Total de Saídas",
            valor: moeda(ehEntrada ? totais.dados?.entradas : totais.dados?.saidas),
            descricao: "Liquidados no período",
            cor: ehEntrada ? "verde" : "vermelho",
            icone: ehEntrada ? "TrendingUp" : "TrendingDown",
          },
          {
            rotulo: "Pendentes",
            valor: moeda(totais.dados?.pendentes),
            descricao: "Ainda sem data de pagamento",
            cor: "ambar",
            icone: "Clock",
          },
          {
            rotulo: "Registros",
            valor: String(
              lista.dados?.count ?? 0,
            ),
            descricao: "No filtro atual",
            icone: "List",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder={
            ehEntrada
              ? "Buscar por destinatário, cliente ou descrição..."
              : "Buscar por favorecido, fornecedor ou descrição..."
          }
        />
        <Selecao
          valor={conta}
          aoMudar={setConta}
          rotuloVazio="Todos os Bancos"
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

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(l) => l.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: ehEntrada
            ? "Nenhuma entrada no período"
            : "Nenhuma saída no período",
          descricao:
            "Ajuste o período ou registre um novo lançamento para vê-lo aqui.",
        }}
      />
    </>
  );
}
