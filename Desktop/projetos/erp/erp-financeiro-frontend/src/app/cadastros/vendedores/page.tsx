"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Vendedor } from "@/lib/api/tipos";
import { moeda, percentual } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca } from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS } from "@/lib/api/opcoes";

export default function VendedoresPage() {
  const [busca, setBusca] = useState("");

  const lista = useRequisicao(
    () =>
      api.listar<Vendedor>("vendedores", {
        search: busca || undefined,
        page_size: 100,
      }),
    [busca],
  );

  const criacao = useCriacao(lista.recarregar);
  const registros = lista.dados?.results ?? [];
  const comComissao = registros.filter((v) => v.participa_comissao);
  const mediaComissao = comComissao.length
    ? comComissao.reduce((soma, v) => soma + Number(v.aliquota_comissao), 0) /
      comComissao.length
    : 0;

  const colunas: Coluna<Vendedor>[] = [
    {
      chave: "codigo",
      cabecalho: "Código",
      render: (v) => (
        <span className="font-mono text-xs text-slate-500">{v.codigo ?? "—"}</span>
      ),
    },
    {
      chave: "nome",
      cabecalho: "Nome",
      larguraMinima: "180px",
      render: (v) => (
        <span className="font-medium text-slate-800">{v.nome}</span>
      ),
    },
    { chave: "documento", cabecalho: "CPF/CNPJ", render: (v) => v.cpf_cnpj ?? "—" },
    {
      chave: "contato",
      cabecalho: "Contato",
      render: (v) => (
        <span>
          <span className="block">{v.celular ?? v.telefone ?? "—"}</span>
          {v.email && (
            <span className="block text-xs text-slate-400">{v.email}</span>
          )}
        </span>
      ),
    },
    {
      chave: "comissao",
      cabecalho: "Comissão",
      alinhamento: "direita",
      render: (v) =>
        v.tipo_comissao === 2 ? (
          <span className="font-medium text-violet-600">
            {moeda(v.comissao_fixa)} fixo
          </span>
        ) : (
          <span className="font-medium text-violet-600">
            {percentual(v.aliquota_comissao)}
          </span>
        ),
    },
    {
      chave: "participa",
      cabecalho: "Participa",
      alinhamento: "centro",
      render: (v) => (
        <Badge cor={v.participa_comissao ? "verde" : "cinza"}>
          {v.participa_comissao ? "SIM" : "NÃO"}
        </Badge>
      ),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (v) => (
        <Badge cor={v.ativo ? "verde" : "vermelho"}>
          {v.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Vendedores"
        subtitulo="Cadastro de vendedores e representantes"
        icone="UserCheck"
        acoes={<BotaoNovo rotulo="Novo Vendedor" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Novo Vendedor"
          recurso="vendedores"
          rotuloAcao="Salvar vendedor"
          descricao="A seção de comissionamento é o que o cálculo mensal de comissão consulta."
          campos={[
            { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: "inteira" },
            { nome: "codigo", rotulo: "Código", tipo: "texto" },
            { nome: "cpf_cnpj", rotulo: "CPF / CNPJ", tipo: "texto" },
            { nome: "telefone", rotulo: "Telefone", tipo: "texto", secao: "Contato" },
            { nome: "celular", rotulo: "Celular", tipo: "texto", secao: "Contato" },
            { nome: "email", rotulo: "E-mail", tipo: "texto", secao: "Contato", largura: "inteira" },
            { nome: "participa_comissao", rotulo: "Participa de comissão", tipo: "booleano", padrao: "true", secao: "Comissionamento" },
            { nome: "tipo_comissao", rotulo: "Tipo de comissão", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoComissao, padrao: "1", secao: "Comissionamento" },
            { nome: "aliquota_comissao", rotulo: "Alíquota (%)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Comissionamento", ajuda: "Usada quando o tipo é Percentual." },
            { nome: "comissao_fixa", rotulo: "Comissão fixa (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Comissionamento", ajuda: "Usada quando o tipo é Fixo." },
            { nome: "limite_maximo_desconto", rotulo: "Limite de desconto (%)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Comissionamento" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Vendedores",
            valor: String(registros.length),
            icone: "Users",
          },
          {
            rotulo: "Participam de Comissão",
            valor: String(comComissao.length),
            cor: "verde",
            icone: "UserCheck",
          },
          {
            rotulo: "Comissão Média",
            valor: percentual(mediaComissao),
            cor: "roxo",
            icone: "Percent",
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
        chave={(v) => v.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhum vendedor cadastrado" }}
      />
    </>
  );
}
