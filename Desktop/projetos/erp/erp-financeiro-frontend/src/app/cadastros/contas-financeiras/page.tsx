"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaFinanceira } from "@/lib/api/tipos";
import { moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca } from "@/components/data/Filtros";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS } from "@/lib/api/opcoes";
import { Plus } from "lucide-react";

const CORES_PROVEDOR: Record<number, "cinza" | "azul" | "roxo"> = {
  1: "cinza",
  2: "azul",
  3: "roxo",
};

export default function ContasFinanceirasPage() {
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);

  const lista = useRequisicao(
    () =>
      api.listar<ContaFinanceira>("contas-financeiras", {
        search: busca || undefined,
        page_size: 100,
      }),
    [busca],
  );

  const registros = lista.dados?.results ?? [];
  const saldoInicial = registros.reduce(
    (soma, c) => soma + Number(c.saldo_inicial),
    0,
  );

  const colunas: Coluna<ContaFinanceira>[] = [
    {
      chave: "nome",
      cabecalho: "Conta",
      larguraMinima: "200px",
      render: (c) => (
        <span className="font-medium text-slate-800">{c.nome}</span>
      ),
    },
    { chave: "banco", cabecalho: "Banco", render: (c) => c.banco },
    { chave: "tipo", cabecalho: "Tipo", render: (c) => c.tipo_display },
    { chave: "agencia", cabecalho: "Agência", render: (c) => c.agencia ?? "—" },
    {
      chave: "conta",
      cabecalho: "Nº Conta",
      render: (c) => (
        <span className="font-mono text-xs">{c.numero_conta ?? "—"}</span>
      ),
    },
    {
      chave: "provedor",
      cabecalho: "Integração",
      render: (c) => (
        <Badge cor={CORES_PROVEDOR[c.provedor] ?? "cinza"}>
          {c.provedor_display}
        </Badge>
      ),
    },
    {
      chave: "saldo",
      cabecalho: "Saldo Inicial",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.saldo_inicial} />,
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (c) => (
        <Badge cor={c.ativo ? "verde" : "vermelho"}>
          {c.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Contas Financeiras"
        subtitulo="Cadastro de contas e instituições financeiras"
        icone="Landmark"
        acoes={
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="botao-primario"
          >
            <Plus className="h-4 w-4" />
            Nova Conta
          </button>
        }
      />

      {criando && (
        <ModalFormulario
          titulo="Nova Conta Financeira"
          recurso="contas-financeiras"
          rotuloAcao="Salvar conta"
          descricao="O provedor define de onde a conciliação bancária busca o extrato desta conta."
          campos={[
            { nome: "nome", rotulo: "Nome da conta", tipo: "texto", obrigatorio: true, largura: "inteira" },
            { nome: "banco", rotulo: "Banco", tipo: "texto", obrigatorio: true },
            { nome: "tipo", rotulo: "Tipo de conta", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoConta, obrigatorio: true, padrao: "1" },
            { nome: "agencia", rotulo: "Agência", tipo: "texto" },
            { nome: "numero_conta", rotulo: "Nº da conta", tipo: "texto" },
            { nome: "saldo_inicial", rotulo: "Saldo inicial (R$)", tipo: "numero", passo: "0.01", padrao: "0", ajuda: "Compõe o Saldo Inicial do DRE." },
            { nome: "provedor", rotulo: "Origem do extrato", tipo: "selecao", opcoes: OPCOES_FIXAS.provedor, padrao: "1" },
            { nome: "identificador_externo", rotulo: "ID no provedor", tipo: "texto", ajuda: "Só quando houver integração." },
          ]}
          aoFechar={() => setCriando(false)}
          aoConcluir={() => {
            setCriando(false);
            lista.recarregar();
          }}
        />
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Contas Cadastradas",
            valor: String(registros.length),
            icone: "Landmark",
          },
          {
            rotulo: "Saldo Total Inicial",
            valor: moeda(saldoInicial),
            cor: "ambar",
            icone: "DollarSign",
          },
          {
            rotulo: "Com Integração",
            valor: String(registros.filter((c) => c.provedor !== 1).length),
            descricao: "Asaas ou C6",
            cor: "azul",
            icone: "Plug",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por nome, banco ou número..."
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={registros}
        chave={(c) => c.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Nenhuma conta cadastrada",
          descricao:
            "A conta define o provedor usado na conciliação bancária (Asaas, C6 ou arquivo).",
        }}
      />

      <p className="mt-4 text-xs text-slate-400">
        O saldo atual não é armazenado: ele é sempre derivado do saldo inicial,
        dos lançamentos liquidados e dos ajustes. Veja em Financeiro › Caixa e
        Bancos.
      </p>
    </>
  );
}
