"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Pessoal } from "@/lib/api/tipos";
import { data, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca, Selecao } from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS } from "@/lib/api/opcoes";

export default function PessoalPage() {
  const [busca, setBusca] = useState("");
  const [contrato, setContrato] = useState("");

  const lista = useRequisicao(
    () =>
      api.listar<Pessoal>("pessoal", {
        search: busca || undefined,
        tipo_contrato: contrato || undefined,
        page_size: 100,
      }),
    [busca, contrato],
  );

  const criacao = useCriacao(lista.recarregar);
  const registros = lista.dados?.results ?? [];
  const folha = registros.reduce((soma, p) => soma + Number(p.salario), 0);

  const colunas: Coluna<Pessoal>[] = [
    {
      chave: "nome",
      cabecalho: "Nome",
      larguraMinima: "190px",
      render: (p) => (
        <span className="font-medium text-slate-800">{p.nome_completo}</span>
      ),
    },
    { chave: "cpf", cabecalho: "CPF", render: (p) => p.cpf },
    { chave: "cargo", cabecalho: "Cargo", render: (p) => p.cargo ?? "—" },
    {
      chave: "contrato",
      cabecalho: "Contrato",
      render: (p) => (
        <Badge cor={p.tipo_contrato === 1 ? "azul" : "roxo"}>
          {p.tipo_contrato_display}
        </Badge>
      ),
    },
    {
      chave: "admissao",
      cabecalho: "Admissão",
      render: (p) => (p.data_admissao ? data(p.data_admissao) : "—"),
    },
    { chave: "contato", cabecalho: "Contato", render: (p) => p.celular ?? "—" },
    {
      chave: "salario",
      cabecalho: "Salário",
      alinhamento: "direita",
      render: (p) => <Dinheiro valor={p.salario} />,
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Pessoal"
        subtitulo="Cadastro de funcionários e equipe"
        icone="UserCog"
        acoes={<BotaoNovo rotulo="Novo Funcionário" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Novo Funcionário"
          recurso="pessoal"
          rotuloAcao="Salvar funcionário"
          campos={[
            { nome: "nome_completo", rotulo: "Nome completo", tipo: "texto", obrigatorio: true, largura: "inteira" },
            { nome: "cpf", rotulo: "CPF", tipo: "texto", obrigatorio: true },
            { nome: "rg", rotulo: "RG", tipo: "texto" },
            { nome: "data_nascimento", rotulo: "Data de nascimento", tipo: "data" },
            { nome: "cargo", rotulo: "Cargo", tipo: "texto" },
            { nome: "data_admissao", rotulo: "Data de admissão", tipo: "data" },
            { nome: "tipo_contrato", rotulo: "Tipo de contrato", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoContrato, padrao: "1" },
            { nome: "pis_pasep", rotulo: "PIS/PASEP", tipo: "texto", secao: "Documentação" },
            { nome: "ctps", rotulo: "CTPS", tipo: "texto", secao: "Documentação" },
            { nome: "celular", rotulo: "Celular", tipo: "texto", secao: "Contato" },
            { nome: "email", rotulo: "E-mail", tipo: "texto", secao: "Contato" },
            { nome: "telefone_emergencia", rotulo: "Telefone de emergência", tipo: "texto", secao: "Contato", largura: "inteira" },
            { nome: "salario", rotulo: "Salário (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Financeiro" },
            { nome: "recorrencia_pagamento", rotulo: "Recorrência", tipo: "texto", secao: "Financeiro", placeholder: "Mensal" },
            { nome: "chave_pix", rotulo: "Chave Pix", tipo: "texto", secao: "Financeiro", largura: "inteira" },
            { nome: "cep", rotulo: "CEP", tipo: "texto", secao: "Endereço" },
            { nome: "uf", rotulo: "UF", tipo: "selecao", opcoes: OPCOES_FIXAS.ufs, secao: "Endereço" },
            { nome: "cidade", rotulo: "Cidade", tipo: "texto", secao: "Endereço" },
            { nome: "bairro", rotulo: "Bairro", tipo: "texto", secao: "Endereço" },
            { nome: "endereco", rotulo: "Logradouro", tipo: "texto", secao: "Endereço" },
            { nome: "numero", rotulo: "Número", tipo: "texto", secao: "Endereço" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Funcionários",
            valor: String(registros.length),
            icone: "Users",
          },
          {
            rotulo: "Folha de Pagamento",
            valor: moeda(folha),
            descricao: "Soma dos salários cadastrados",
            cor: "ambar",
            icone: "DollarSign",
          },
          {
            rotulo: "Salário Médio",
            valor: moeda(registros.length ? folha / registros.length : 0),
            cor: "azul",
            icone: "Calculator",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por nome ou cargo..."
        />
        <Selecao
          valor={contrato}
          aoMudar={setContrato}
          rotuloVazio="Todos os contratos"
          opcoes={[
            { valor: "1", rotulo: "CLT" },
            { valor: "2", rotulo: "PJ" },
          ]}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(p) => p.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{ titulo: "Nenhum funcionário cadastrado" }}
      />

      <p className="mt-4 text-xs text-slate-400">
        Este é um cadastro. O pagamento de salários entra pelo fluxo de caixa
        como saída classificada — a planilha não descreve cálculo de folha.
      </p>
    </>
  );
}
