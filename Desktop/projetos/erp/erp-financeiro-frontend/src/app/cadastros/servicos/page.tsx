"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Servico } from "@/lib/api/tipos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca } from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";

export default function ServicosPage() {
  const [busca, setBusca] = useState("");

  const lista = useRequisicao(
    () =>
      api.listar<Servico>("servicos", {
        search: busca || undefined,
        page_size: 100,
      }),
    [busca],
  );

  const criacao = useCriacao(lista.recarregar);
  const registros = lista.dados?.results ?? [];

  const colunas: Coluna<Servico>[] = [
    {
      chave: "codigo",
      cabecalho: "Código",
      render: (s) => (
        <span className="font-mono text-xs text-slate-500">{s.codigo ?? "—"}</span>
      ),
    },
    {
      chave: "nome",
      cabecalho: "Serviço",
      larguraMinima: "220px",
      render: (s) => <span className="font-medium text-slate-800">{s.nome}</span>,
    },
    {
      chave: "descricao",
      cabecalho: "Descrição",
      render: (s) => <span className="text-slate-600">{s.descricao ?? "—"}</span>,
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (s) => (
        <Badge cor={s.ativo ? "verde" : "vermelho"}>
          {s.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Serviços"
        subtitulo="Cadastro de serviços oferecidos"
        icone="Briefcase"
        acoes={<BotaoNovo rotulo="Novo Serviço" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Novo Serviço"
          recurso="servicos"
          rotuloAcao="Salvar serviço"
          campos={[
            { nome: "codigo", rotulo: "Código", tipo: "texto", placeholder: "S001" },
            { nome: "nome", rotulo: "Nome do serviço", tipo: "texto", obrigatorio: true },
            { nome: "descricao", rotulo: "Descrição", tipo: "textarea" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total de Serviços",
            valor: String(registros.length),
            icone: "Briefcase",
          },
          {
            rotulo: "Ativos",
            valor: String(registros.filter((s) => s.ativo).length),
            cor: "verde",
            icone: "CheckCircle",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por nome ou código..."
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(s) => s.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhum serviço cadastrado" }}
      />

      <p className="mt-4 text-xs text-slate-400">
        A planilha define Código, Nome e Descrição. Campos como categoria,
        unidade, custo e margem aparecem apenas no protótipo e aguardam validação.
      </p>
    </>
  );
}
