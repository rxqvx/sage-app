"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { NotaFiscal } from "@/lib/api/tipos";
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
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS, useOpcoes } from "@/lib/api/opcoes";

interface Totais {
  valor_total: string;
  iss: string;
  pis: string;
  cofins: string;
  canceladas: string;
}

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
];

/**
 * NFs de entrada e saída — registro e consulta.
 *
 * A planilha trata notas fiscais como relatório com filtros de período, UF e
 * serviço; emissão fiscal integrada não faz parte do escopo.
 */
export function ListaNotasFiscais({ tipo }: { tipo: 1 | 2 }) {
  const ehSaida = tipo === 2;
  const padrao = periodoPadrao();

  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("");
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);

  const filtros = {
    tipo,
    search: busca || undefined,
    uf: uf || undefined,
    inicio,
    fim,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<NotaFiscal>("notas-fiscais", filtros),
    [tipo, busca, uf, inicio, fim],
  );
  const totais = useRequisicao(
    () => api.buscar<Totais>("notas-fiscais/totais", filtros),
    [tipo, busca, uf, inicio, fim],
  );

  const opcoes = useOpcoes();
  const criacao = useCriacao(() => {
    lista.recarregar();
    totais.recarregar();
  });

  const colunas: Coluna<NotaFiscal>[] = [
    {
      chave: "numero",
      cabecalho: "Número",
      render: (n) => <span className="font-mono text-xs">{n.numero}</span>,
    },
    {
      chave: "parceiro",
      cabecalho: ehSaida ? "Cliente" : "Fornecedor",
      larguraMinima: "180px",
      render: (n) => (
        <span className="font-medium text-slate-800">{n.parceiro_nome}</span>
      ),
    },
    {
      chave: "servico",
      cabecalho: "Serviço",
      render: (n) => n.servico_nome ?? n.descricao_servico ?? "—",
    },
    { chave: "uf", cabecalho: "UF", render: (n) => n.uf ?? "—" },
    { chave: "emissao", cabecalho: "Emissão", render: (n) => data(n.emissao) },
    {
      chave: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      render: (n) => (
        <Dinheiro valor={n.valor} forcarCor={ehSaida ? "verde" : "vermelho"} />
      ),
    },
    {
      chave: "iss",
      cabecalho: "ISS",
      alinhamento: "direita",
      render: (n) => moeda(n.iss),
    },
    {
      chave: "pis",
      cabecalho: "PIS",
      alinhamento: "direita",
      render: (n) => moeda(n.pis),
    },
    {
      chave: "cofins",
      cabecalho: "COFINS",
      alinhamento: "direita",
      render: (n) => moeda(n.cofins),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (n) => (
        <Badge cor={corDoStatus(n.status_display)}>
          {n.status_display.toLowerCase()}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo={ehSaida ? "NFs de Saída" : "NFs de Entrada"}
        subtitulo={
          ehSaida
            ? "Notas fiscais de saída emitidas"
            : "Notas fiscais de entrada recebidas de fornecedores"
        }
        icone="FileText"
        acoes={<BotaoNovo rotulo="Registrar NF" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo={ehSaida ? "Registrar NF de Saída" : "Registrar NF de Entrada"}
          recurso="notas-fiscais"
          rotuloAcao="Salvar nota"
          descricao="O sistema registra e consulta notas fiscais. A emissão junto à prefeitura não faz parte do escopo."
          campos={[
            { nome: "tipo", rotulo: "Tipo", tipo: "selecao", opcoes: [{ valor: "1", rotulo: "Entrada" }, { valor: "2", rotulo: "Saída" }], obrigatorio: true, padrao: String(tipo) },
            { nome: "numero", rotulo: "Número da NF", tipo: "texto", obrigatorio: true },
            { nome: "parceiro", rotulo: ehSaida ? "Cliente" : "Fornecedor", tipo: "selecao", opcoes: ehSaida ? opcoes.clientes : opcoes.fornecedores, obrigatorio: true, largura: "inteira" },
            { nome: "servico", rotulo: "Serviço", tipo: "selecao", opcoes: opcoes.servicos },
            { nome: "descricao_servico", rotulo: "Descrição do serviço", tipo: "texto" },
            { nome: "emissao", rotulo: "Emissão", tipo: "data", obrigatorio: true },
            { nome: "uf", rotulo: "UF", tipo: "selecao", opcoes: OPCOES_FIXAS.ufs },
            { nome: "valor", rotulo: "Valor (R$)", tipo: "numero", passo: "0.01", obrigatorio: true },
            { nome: "status", rotulo: "Situação", tipo: "selecao", opcoes: OPCOES_FIXAS.statusNota, padrao: ehSaida ? "1" : "2" },
            { nome: "iss", rotulo: "ISS (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Tributos" },
            { nome: "pis", rotulo: "PIS (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Tributos" },
            { nome: "cofins", rotulo: "COFINS (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Tributos" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: ehSaida ? "NFs Emitidas" : "NFs Recebidas",
            valor: String(lista.dados?.count ?? 0),
            icone: "FileText",
          },
          {
            rotulo: "Valor Total",
            valor: moeda(totais.dados?.valor_total),
            cor: ehSaida ? "verde" : "vermelho",
            icone: "DollarSign",
          },
          {
            rotulo: "Tributos (ISS+PIS+COFINS)",
            valor: moeda(
              Number(totais.dados?.iss ?? 0) +
                Number(totais.dados?.pis ?? 0) +
                Number(totais.dados?.cofins ?? 0),
            ),
            cor: "ambar",
            icone: "Receipt",
          },
          {
            rotulo: "Canceladas",
            valor: moeda(totais.dados?.canceladas),
            cor: "vermelho",
            icone: "XCircle",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder={
            ehSaida ? "Buscar por número ou cliente..." : "Buscar por número ou fornecedor..."
          }
        />
        <Selecao
          valor={uf}
          aoMudar={setUf}
          rotuloVazio="Todas as UFs"
          opcoes={UFS.map((sigla) => ({ valor: sigla, rotulo: sigla }))}
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
        registros={lista.dados?.results ?? []}
        chave={(n) => n.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhuma nota fiscal no período" }}
      />
    </>
  );
}
