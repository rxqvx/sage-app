"use client";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaContabil } from "@/lib/api/tipos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Tabela, type Coluna } from "@/components/data";

export default function PlanoContasPage() {
  const lista = useRequisicao(() =>
    api.listar<ContaContabil>("contas-contabeis", { page_size: 100 }),
  );

  const registros = lista.dados?.results ?? [];
  const semOrigem = registros.filter(
    (c) => c.origem_display === "Nao definida",
  ).length;

  const colunas: Coluna<ContaContabil>[] = [
    {
      chave: "codigo",
      cabecalho: "Código",
      render: (c) => (
        <span className="font-mono text-xs text-slate-500">{c.codigo}</span>
      ),
    },
    {
      chave: "nome",
      cabecalho: "Conta Contábil",
      larguraMinima: "200px",
      render: (c) => (
        <span className="font-medium text-slate-800">{c.nome}</span>
      ),
    },
    { chave: "grupo", cabecalho: "Grupo", render: (c) => c.grupo_display },
    {
      chave: "natureza",
      cabecalho: "Natureza",
      render: (c) => (
        <Badge cor={c.natureza_display === "Devedora" ? "azul" : "roxo"}>
          {c.natureza_display}
        </Badge>
      ),
    },
    {
      chave: "origem",
      cabecalho: "Origem dos Valores",
      render: (c) =>
        c.origem_display === "Nao definida" ? (
          <Badge cor="ambar">a definir</Badge>
        ) : (
          <span className="text-slate-600">{c.origem_display}</span>
        ),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (c) => (
        <Badge cor={c.ativo ? "verde" : "vermelho"}>
          {c.ativo ? "Ativa" : "Inativa"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Plano de Contas"
        subtitulo="Contas contábeis do Balancete e o módulo que alimenta cada uma"
        icone="Layers"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Contas Cadastradas",
            valor: String(registros.length),
            icone: "Layers",
          },
          {
            rotulo: "Com Origem Definida",
            valor: String(registros.length - semOrigem),
            cor: "verde",
            icone: "CheckCircle",
          },
          {
            rotulo: "Origem a Definir",
            valor: String(semOrigem),
            descricao: "Ficam zeradas no balancete",
            cor: "ambar",
            icone: "AlertTriangle",
          },
        ]}
      />

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(c) => c.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Plano de contas vazio",
          descricao: "Rode o comando seed_plano_contas no backend para carregá-lo.",
        }}
      />

      <p className="mt-4 text-xs text-slate-400">
        O balancete é derivado: cada conta é calculada a partir do módulo
        indicado em Origem dos Valores, como especifica a planilha.
      </p>
    </>
  );
}
