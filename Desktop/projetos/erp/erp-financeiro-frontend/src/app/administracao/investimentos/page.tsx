"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Investimento, LinhaNegocio, QuantidadeVendida } from "@/lib/api/tipos";
import { competencia, data, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { useOpcoes } from "@/lib/api/opcoes";
import { cn } from "@/lib/utils";

type Aba = "investimentos" | "quantidades";

/**
 * Duas entradas manuais que os relatórios precisam e que nenhum outro módulo
 * produz: os investimentos do ROI e a quantidade vendida do Ponto de
 * Equilíbrio.
 */
export default function InvestimentosPage() {
  const [aba, setAba] = useState<Aba>("investimentos");

  const investimentos = useRequisicao(() =>
    api.listar<Investimento>("investimentos", { page_size: 100 }),
  );
  const quantidades = useRequisicao(() =>
    api.listar<QuantidadeVendida>("quantidades-vendidas", { page_size: 100 }),
  );
  const linhas = useRequisicao(() =>
    api.listar<LinhaNegocio>("linhas-negocio", { page_size: 100 }),
  );

  const opcoes = useOpcoes();
  const criacao = useCriacao(() => {
    investimentos.recarregar();
    quantidades.recarregar();
  });

  const registros = investimentos.dados?.results ?? [];
  const totalInvestido = registros.reduce(
    (soma, i) => soma + Number(i.valor_investido),
    0,
  );

  const colunasInvestimento: Coluna<Investimento>[] = [
    {
      chave: "nome",
      cabecalho: "Investimento",
      larguraMinima: "200px",
      render: (i) => (
        <span>
          <span className="block font-medium text-slate-800">{i.nome}</span>
          {i.centro_custo_nome && (
            <span className="block text-xs text-slate-400">
              {i.centro_custo_nome}
            </span>
          )}
        </span>
      ),
    },
    { chave: "inicio", cabecalho: "Início", render: (i) => data(i.data_inicio) },
    {
      chave: "periodo",
      cabecalho: "Período",
      render: (i) => (i.periodo_meses ? `${i.periodo_meses} meses` : "—"),
    },
    {
      chave: "investido",
      cabecalho: "Investido",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.valor_investido} />,
    },
    {
      chave: "receita",
      cabecalho: "Receita Gerada",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.receita_gerada} forcarCor="verde" />,
    },
    {
      chave: "custos",
      cabecalho: "Custos",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.custos_operacionais} forcarCor="vermelho" />,
    },
    {
      chave: "lucro",
      cabecalho: "Lucro Obtido",
      alinhamento: "direita",
      render: (i) => <Dinheiro valor={i.lucro_obtido} colorir />,
    },
  ];

  const colunasQuantidade: Coluna<QuantidadeVendida>[] = [
    {
      chave: "linha",
      cabecalho: "Linha de Negócio",
      render: (q) => (
        <span className="font-medium text-slate-800">{q.linha_negocio_nome}</span>
      ),
    },
    {
      chave: "periodo",
      cabecalho: "Competência",
      render: (q) => competencia(q.periodo),
    },
    {
      chave: "quantidade",
      cabecalho: "Quantidade Vendida",
      alinhamento: "direita",
      render: (q) => (
        <span className="font-medium tabular-nums text-slate-800">
          {q.quantidade}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Investimentos e Quantidades"
        subtitulo="Entradas manuais usadas pelo ROI e pelo Ponto de Equilíbrio"
        icone="PieChart"
        acoes={
          <BotaoNovo
            rotulo={
              aba === "investimentos" ? "Novo Investimento" : "Nova Quantidade"
            }
            aoClicar={criacao.abrir}
          />
        }
      />

      {criacao.aberto &&
        (aba === "investimentos" ? (
          <ModalFormulario
            titulo="Novo Investimento"
            recurso="investimentos"
            rotuloAcao="Salvar investimento"
            descricao="A planilha não define origem automática para investimentos, então o cadastro é manual."
            campos={[
              { nome: "nome", rotulo: "Nome do investimento", tipo: "texto", obrigatorio: true, largura: "inteira" },
              { nome: "valor_investido", rotulo: "Valor investido (R$)", tipo: "numero", passo: "0.01", obrigatorio: true },
              { nome: "data_inicio", rotulo: "Data de início", tipo: "data", obrigatorio: true },
              { nome: "receita_gerada", rotulo: "Receita gerada (R$)", tipo: "numero", passo: "0.01", padrao: "0" },
              { nome: "custos_operacionais", rotulo: "Custos operacionais (R$)", tipo: "numero", passo: "0.01", padrao: "0" },
              { nome: "periodo_meses", rotulo: "Período (meses)", tipo: "numero", ajuda: "Base do retorno anualizado." },
              { nome: "centro_custo", rotulo: "Centro de custo", tipo: "selecao", opcoes: opcoes.centros },
              { nome: "descricao", rotulo: "Descrição", tipo: "textarea" },
            ]}
            aoFechar={criacao.fechar}
            aoConcluir={criacao.concluir}
          />
        ) : (
          <ModalFormulario
            titulo="Nova Quantidade Vendida"
            recurso="quantidades-vendidas"
            rotuloAcao="Salvar quantidade"
            descricao="Sem a quantidade vendida não há preço médio, e o ponto de equilíbrio da linha não pode ser calculado."
            campos={[
              { nome: "linha_negocio", rotulo: "Linha de negócio", tipo: "selecao", opcoes: opcoes.linhas, obrigatorio: true, largura: "inteira" },
              { nome: "periodo", rotulo: "Competência", tipo: "mes", obrigatorio: true, ajuda: "Formato AAAA-MM." },
              { nome: "quantidade", rotulo: "Quantidade vendida", tipo: "numero", obrigatorio: true, padrao: "0" },
            ]}
            aoFechar={criacao.fechar}
            aoConcluir={criacao.concluir}
          />
        ))}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Investimentos",
            valor: String(registros.length),
            icone: "PieChart",
          },
          {
            rotulo: "Total Investido",
            valor: moeda(totalInvestido),
            cor: "ambar",
            icone: "DollarSign",
          },
          {
            rotulo: "Linhas de Negócio",
            valor: String(linhas.dados?.count ?? 0),
            cor: "roxo",
            icone: "Layers",
          },
          {
            rotulo: "Períodos Informados",
            valor: String(quantidades.dados?.count ?? 0),
            descricao: "Quantidade vendida",
            cor: "azul",
            icone: "List",
          },
        ]}
      />

      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {(
          [
            { chave: "investimentos", rotulo: "Investimentos (ROI)" },
            { chave: "quantidades", rotulo: "Quantidade Vendida (Ponto de Equilíbrio)" },
          ] as { chave: Aba; rotulo: string }[]
        ).map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setAba(item.chave)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              aba === item.chave
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === "investimentos" ? (
        <Tabela
          colunas={colunasInvestimento}
          registros={registros}
          chave={(i) => i.id}
          carregando={investimentos.carregando}
          erro={investimentos.erro}
          aoTentarNovamente={investimentos.recarregar}
          vazio={{
            titulo: "Nenhum investimento cadastrado",
            descricao:
              "A planilha não define uma origem automática para os investimentos, então o cadastro é manual.",
          }}
        />
      ) : (
        <Tabela
          colunas={colunasQuantidade}
          registros={quantidades.dados?.results ?? []}
          chave={(q) => q.id}
          carregando={quantidades.carregando}
          erro={quantidades.erro}
          aoTentarNovamente={quantidades.recarregar}
          vazio={{
            titulo: "Nenhuma quantidade informada",
            descricao:
              "Sem a quantidade vendida não há preço médio, e o ponto de equilíbrio da linha não pode ser calculado.",
          }}
        />
      )}
    </>
  );
}
