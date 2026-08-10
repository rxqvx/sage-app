"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Parceiro } from "@/lib/api/tipos";
import { data } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca, Selecao } from "@/components/data/Filtros";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS, useOpcoes } from "@/lib/api/opcoes";

export default function ParceirosPage() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const opcoes = useOpcoes();

  const lista = useRequisicao(
    () =>
      api.listar<Parceiro>("parceiros", {
        search: busca || undefined,
        tipo: tipo || undefined,
        page_size: 100,
      }),
    [busca, tipo],
  );

  const criacao = useCriacao(lista.recarregar);
  const registros = lista.dados?.results ?? [];
  const clientes = registros.filter((p) => p.tipo === 1 || p.tipo === 3).length;
  const fornecedores = registros.filter((p) => p.tipo === 2 || p.tipo === 3).length;

  const colunas: Coluna<Parceiro>[] = [
    {
      chave: "codigo",
      cabecalho: "Código",
      render: (p) => (
        <span className="font-mono text-xs text-slate-500">{p.codigo ?? "—"}</span>
      ),
    },
    {
      chave: "nome",
      cabecalho: "Nome / Razão Social",
      larguraMinima: "200px",
      render: (p) => (
        <span>
          <span className="block font-medium text-slate-800">{p.nome}</span>
          {p.nome_fantasia && (
            <span className="block text-xs text-slate-400">{p.nome_fantasia}</span>
          )}
        </span>
      ),
    },
    { chave: "documento", cabecalho: "CNPJ/CPF", render: (p) => p.cpf_cnpj ?? "—" },
    {
      chave: "tipo",
      cabecalho: "Tipo",
      render: (p) => (
        <Badge cor={p.tipo === 1 ? "azul" : p.tipo === 2 ? "roxo" : "ambar"}>
          {p.tipo_display.toUpperCase()}
        </Badge>
      ),
    },
    {
      chave: "cidade",
      cabecalho: "Cidade/UF",
      render: (p) => (p.cidade ? `${p.cidade}/${p.uf ?? "—"}` : "—"),
    },
    {
      chave: "desde",
      cabecalho: "Desde",
      render: (p) => (p.cliente_desde ? data(p.cliente_desde) : "—"),
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
        titulo="Clientes / Fornecedores"
        subtitulo="Cadastro de clientes e fornecedores"
        icone="Users"
        acoes={<BotaoNovo rotulo="Novo Cadastro" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Novo Cliente / Fornecedor"
          recurso="parceiros"
          rotuloAcao="Salvar cadastro"
          campos={[
            { nome: "nome", rotulo: "Nome / Razão social", tipo: "texto", obrigatorio: true, largura: "inteira" },
            { nome: "nome_fantasia", rotulo: "Nome fantasia", tipo: "texto" },
            { nome: "codigo", rotulo: "Código", tipo: "texto" },
            { nome: "tipo", rotulo: "Tipo", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoParceiro, obrigatorio: true, padrao: "1" },
            { nome: "tipo_pessoa", rotulo: "Pessoa", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoPessoa, padrao: "2" },
            { nome: "cpf_cnpj", rotulo: "CPF / CNPJ", tipo: "texto", secao: "Documentação" },
            { nome: "rg_inscricao_estadual", rotulo: "RG / Inscrição Estadual", tipo: "texto", secao: "Documentação" },
            { nome: "cliente_desde", rotulo: "Cliente desde", tipo: "data", secao: "Documentação" },
            { nome: "contribuinte", rotulo: "Contribuinte de ICMS", tipo: "booleano", secao: "Documentação" },
            { nome: "cep", rotulo: "CEP", tipo: "texto", secao: "Endereço" },
            { nome: "uf", rotulo: "UF", tipo: "selecao", opcoes: OPCOES_FIXAS.ufs, secao: "Endereço" },
            { nome: "cidade", rotulo: "Cidade", tipo: "texto", secao: "Endereço" },
            { nome: "bairro", rotulo: "Bairro", tipo: "texto", secao: "Endereço" },
            { nome: "endereco", rotulo: "Logradouro", tipo: "texto", secao: "Endereço" },
            { nome: "numero", rotulo: "Número", tipo: "texto", secao: "Endereço" },
            { nome: "telefone", rotulo: "Telefone", tipo: "texto", secao: "Contato" },
            { nome: "celular", rotulo: "Celular", tipo: "texto", secao: "Contato" },
            { nome: "email", rotulo: "E-mail", tipo: "texto", secao: "Contato" },
            { nome: "email_nfe", rotulo: "E-mail para NFe", tipo: "texto", secao: "Contato" },
            { nome: "vendedor_responsavel", rotulo: "Vendedor responsável", tipo: "selecao", opcoes: opcoes.vendedores, secao: "Comercial", ajuda: "Base do cálculo de comissão." },
            { nome: "limite_credito", rotulo: "Limite de crédito (R$)", tipo: "numero", passo: "0.01", padrao: "0", secao: "Comercial" },
            { nome: "observacoes", rotulo: "Observações", tipo: "textarea" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      <CardsIndicadores
        indicadores={[
          { rotulo: "Clientes", valor: String(clientes), cor: "azul", icone: "Users" },
          {
            rotulo: "Fornecedores",
            valor: String(fornecedores),
            cor: "roxo",
            icone: "Building2",
          },
          {
            rotulo: "Cadastros Ativos",
            valor: String(registros.filter((p) => p.ativo).length),
            cor: "verde",
            icone: "UserCheck",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por nome, CNPJ ou código..."
        />
        <Selecao
          valor={tipo}
          aoMudar={setTipo}
          rotuloVazio="Todos"
          opcoes={[
            { valor: "1", rotulo: "Clientes" },
            { valor: "2", rotulo: "Fornecedores" },
            { valor: "3", rotulo: "Ambos" },
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
        vazio={{ titulo: "Nenhum cadastro encontrado" }}
      />
    </>
  );
}
