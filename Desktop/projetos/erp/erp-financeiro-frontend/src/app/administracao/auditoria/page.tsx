"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { LogAuditoria } from "@/lib/api/tipos";
import { dataHora } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca, Selecao } from "@/components/data/Filtros";

interface Totais {
  total: number;
  criacoes: number;
  atualizacoes: number;
  exclusoes: number;
}

const CORES_ACAO: Record<string, "verde" | "azul" | "vermelho" | "roxo" | "ambar"> = {
  criou: "verde",
  atualizou: "azul",
  excluiu: "vermelho",
  baixou: "verde",
  estornou: "ambar",
  importou: "roxo",
  ajustou: "ambar",
};

export default function AuditoriaPage() {
  const [busca, setBusca] = useState("");
  const [acao, setAcao] = useState("");

  const filtros = {
    search: busca || undefined,
    acao: acao || undefined,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<LogAuditoria>("auditoria", filtros),
    [busca, acao],
  );
  const totais = useRequisicao(
    () => api.buscar<Totais>("auditoria/totais", filtros),
    [busca, acao],
  );

  const colunas: Coluna<LogAuditoria>[] = [
    {
      chave: "data",
      cabecalho: "Data/Hora",
      render: (l) => dataHora(l.created_at),
    },
    {
      chave: "usuario",
      cabecalho: "Usuário",
      render: (l) => l.usuario_nome ?? "Sistema",
    },
    {
      chave: "acao",
      cabecalho: "Ação",
      render: (l) => (
        <Badge cor={CORES_ACAO[l.acao] ?? "cinza"}>{l.acao}</Badge>
      ),
    },
    {
      chave: "entidade",
      cabecalho: "Entidade",
      render: (l) => (
        <span className="font-mono text-xs text-slate-500">{l.entidade}</span>
      ),
    },
    {
      chave: "id",
      cabecalho: "ID Registro",
      render: (l) => (
        <span className="font-mono text-xs text-slate-400">
          {l.entidade_id ?? "—"}
        </span>
      ),
    },
    {
      chave: "detalhe",
      cabecalho: "Detalhes",
      larguraMinima: "260px",
      render: (l) => <span className="text-slate-600">{l.detalhe ?? "—"}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Audit Log"
        subtitulo="Registro de auditoria das operações financeiras"
        icone="History"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Registros",
            valor: String(totais.dados?.total ?? 0),
            icone: "History",
          },
          {
            rotulo: "Criações",
            valor: String(totais.dados?.criacoes ?? 0),
            cor: "verde",
            icone: "Plus",
          },
          {
            rotulo: "Atualizações",
            valor: String(totais.dados?.atualizacoes ?? 0),
            cor: "azul",
            icone: "FileText",
          },
          {
            rotulo: "Exclusões",
            valor: String(totais.dados?.exclusoes ?? 0),
            cor: "vermelho",
            icone: "Trash2",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por usuário, entidade ou detalhe..."
        />
        <Selecao
          valor={acao}
          aoMudar={setAcao}
          rotuloVazio="Todas as ações"
          opcoes={[
            { valor: "criou", rotulo: "Criou" },
            { valor: "atualizou", rotulo: "Atualizou" },
            { valor: "excluiu", rotulo: "Excluiu" },
            { valor: "baixou", rotulo: "Baixou" },
            { valor: "estornou", rotulo: "Estornou" },
            { valor: "importou", rotulo: "Importou" },
            { valor: "ajustou", rotulo: "Ajustou" },
          ]}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={lista.dados?.results ?? []}
        chave={(l) => l.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Nenhum registro de auditoria",
          descricao:
            "Ajustes de saldo, baixas e importações aparecem aqui conforme forem executados.",
        }}
      />
    </>
  );
}
