"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaFinanceira, Titulo } from "@/lib/api/tipos";
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
import { ModalBaixa } from "./ModalBaixa";
import { camposTitulo } from "./camposTitulo";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { useOpcoes } from "@/lib/api/opcoes";

interface Totais {
  em_aberto: string;
  vencido: string;
  liquidado: string;
}

/**
 * Contas a Pagar e Contas a Receber usam a mesma tela.
 *
 * A planilha define os dois módulos com campos idênticos, mudando apenas
 * Fornecedor/Cliente — a mesma razão pela qual o backend tem uma base
 * abstrata `TituloFinanceiro`.
 */
export function ListaTitulos({ tipo }: { tipo: "pagar" | "receber" }) {
  const ehPagar = tipo === "pagar";
  const recurso = ehPagar ? "contas-pagar" : "contas-receber";
  const padrao = periodoPadrao();

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [tituloBaixa, setTituloBaixa] = useState<Titulo | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const filtros = {
    search: busca || undefined,
    status: status || undefined,
    inicio,
    fim,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<Titulo>(recurso, filtros),
    [recurso, busca, status, inicio, fim],
  );

  const totais = useRequisicao(
    () => api.buscar<Totais>(`${recurso}/totais`, filtros),
    [recurso, busca, status, inicio, fim],
  );

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  const opcoes = useOpcoes();
  const criacao = useCriacao(() => {
    lista.recarregar();
    totais.recarregar();
  });

  async function estornar(titulo: Titulo) {
    try {
      await api.acao(`${recurso}/${titulo.id}/estornar`);
      setMensagem(`Baixa do título ${titulo.numero_documento} estornada.`);
      lista.recarregar();
      totais.recarregar();
    } catch (erro) {
      setMensagem(
        erro instanceof ApiError ? erro.message : "Não foi possível estornar.",
      );
    }
  }

  const colunas: Coluna<Titulo>[] = [
    {
      chave: "parceiro",
      cabecalho: ehPagar ? "Fornecedor" : "Cliente",
      larguraMinima: "180px",
      render: (t) => (
        <span className="font-medium text-slate-800">{t.parceiro_nome}</span>
      ),
    },
    { chave: "documento", cabecalho: "Documento", render: (t) => t.numero_documento },
    { chave: "emissao", cabecalho: "Emissão", render: (t) => data(t.emissao) },
    {
      chave: "competencia",
      cabecalho: "Competência",
      render: (t) => data(t.competencia),
    },
    {
      chave: "vencimento",
      cabecalho: "Vencimento",
      render: (t) => (
        <span className={t.esta_vencido ? "font-medium text-red-600" : ""}>
          {data(t.vencimento)}
          {t.esta_vencido && (
            <span className="block text-xs">{t.dias_atraso} dias</span>
          )}
        </span>
      ),
    },
    {
      chave: "categoria",
      cabecalho: "Categoria",
      render: (t) => t.categoria_nome ?? "—",
    },
    {
      chave: "forma",
      cabecalho: "Pagamento",
      render: (t) => t.forma_pagamento_nome ?? "—",
    },
    {
      chave: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      render: (t) => (
        <span>
          <Dinheiro valor={t.valor} forcarCor={ehPagar ? "vermelho" : "verde"} />
          {t.valor_total !== t.valor && (
            <span className="block text-xs text-slate-400">
              c/ encargos: {moeda(t.valor_total)}
            </span>
          )}
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
    {
      chave: "acoes",
      cabecalho: "Ações",
      alinhamento: "centro",
      render: (t) =>
        t.status === 2 ? (
          <button
            type="button"
            onClick={() => estornar(t)}
            className="text-xs font-medium text-slate-500 hover:text-red-600"
          >
            Estornar
          </button>
        ) : t.status === 3 ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <button
            type="button"
            onClick={() => setTituloBaixa(t)}
            className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark"
          >
            {ehPagar ? "Pagar" : "Receber"}
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo={ehPagar ? "Contas a Pagar" : "Contas a Receber"}
        subtitulo={
          ehPagar
            ? "Gestão de contas a pagar e despesas"
            : "Gestão de contas a receber e recebimentos"
        }
        icone={ehPagar ? "Receipt" : "DollarSign"}
        acoes={
          <BotaoNovo
            rotulo={ehPagar ? "Nova Conta" : "Nova Cobrança"}
            aoClicar={criacao.abrir}
          />
        }
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo={ehPagar ? "Nova Conta a Pagar" : "Nova Conta a Receber"}
          recurso={recurso}
          campos={camposTitulo(tipo, opcoes)}
          descricao="O título entra por competência. Ele só afeta o saldo quando for baixado."
          rotuloAcao="Salvar título"
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      {mensagem && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {mensagem}
          <button
            type="button"
            onClick={() => setMensagem(null)}
            className="ml-3 text-xs text-slate-400 underline"
          >
            fechar
          </button>
        </div>
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total em Aberto",
            valor: moeda(totais.dados?.em_aberto),
            descricao: "Abertas e a vencer",
            cor: "ambar",
            icone: "DollarSign",
          },
          {
            rotulo: "Vencido",
            valor: moeda(totais.dados?.vencido),
            descricao: "Títulos já vencidos",
            cor: "vermelho",
            icone: "AlertCircle",
            destaque: true,
          },
          {
            rotulo: ehPagar ? "Pago" : "Recebido",
            valor: moeda(totais.dados?.liquidado),
            descricao: "Liquidado no período",
            cor: "verde",
            icone: "CheckCircle",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder={
            ehPagar
              ? "Buscar por fornecedor ou documento..."
              : "Buscar por cliente ou documento..."
          }
        />
        <Selecao
          valor={status}
          aoMudar={setStatus}
          rotuloVazio="Todas"
          opcoes={[
            { valor: "1", rotulo: "Aberta" },
            { valor: "2", rotulo: ehPagar ? "Paga" : "Recebida" },
            { valor: "3", rotulo: "Cancelada" },
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
        registros={lista.dados?.results ?? []}
        chave={(t) => t.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Nenhum título no período",
          descricao: "Ajuste o período ou os filtros para ver outros títulos.",
        }}
      />

      {tituloBaixa && (
        <ModalBaixa
          titulo={tituloBaixa}
          recurso={recurso}
          contas={contas.dados?.results ?? []}
          aoFechar={() => setTituloBaixa(null)}
          aoConcluir={() => {
            setTituloBaixa(null);
            setMensagem("Título baixado e lançamento de caixa gerado.");
            lista.recarregar();
            totais.recarregar();
          }}
        />
      )}
    </>
  );
}
