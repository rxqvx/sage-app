"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type {
  Categoria,
  CentroCusto,
  FormaPagamento,
  LinhaNegocio,
  Natureza,
  Subcategoria,
} from "@/lib/api/tipos";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  EstadoCarregando,
  Tabela,
  type Coluna,
} from "@/components/data";
import { cn } from "@/lib/utils";

type Aba = "categorias" | "naturezas" | "centros" | "formas" | "linhas";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "categorias", rotulo: "Categorias e Subcategorias" },
  { chave: "naturezas", rotulo: "Naturezas" },
  { chave: "centros", rotulo: "Centros de Custo" },
  { chave: "formas", rotulo: "Formas de Pagamento" },
  { chave: "linhas", rotulo: "Linhas de Negócio" },
];

/**
 * Os quatro eixos de classificação que sustentam os relatórios.
 *
 * Vale a pena manter tudo numa tela só: quem classifica um lançamento precisa
 * entender como esses eixos se relacionam — natureza alimenta o Ponto de
 * Equilíbrio, categoria/subcategoria monta o DRE e centro de custo agrupa o
 * Fluxo de Caixa.
 */
export default function ClassificacaoPage() {
  const [aba, setAba] = useState<Aba>("categorias");

  const categorias = useRequisicao(() =>
    api.listar<Categoria>("categorias", { page_size: 100 }),
  );
  const subcategorias = useRequisicao(() =>
    api.listar<Subcategoria>("subcategorias", { page_size: 300 }),
  );
  const naturezas = useRequisicao(() =>
    api.listar<Natureza>("naturezas", { page_size: 100 }),
  );
  const centros = useRequisicao(() =>
    api.listar<CentroCusto>("centros-custo", { page_size: 100 }),
  );
  const formas = useRequisicao(() =>
    api.listar<FormaPagamento>("formas-pagamento", { page_size: 100 }),
  );
  const linhas = useRequisicao(() =>
    api.listar<LinhaNegocio>("linhas-negocio", { page_size: 100 }),
  );

  const colunasNatureza: Coluna<Natureza>[] = [
    {
      chave: "nome",
      cabecalho: "Natureza",
      render: (n) => <span className="font-medium text-slate-800">{n.nome}</span>,
    },
    {
      chave: "tipo",
      cabecalho: "Tipo (usado no Ponto de Equilíbrio)",
      render: (n) => <Badge cor="roxo">{n.tipo_display}</Badge>,
    },
  ];

  const colunasSimples = <T extends { nome: string; ativo: boolean }>(
    cabecalho: string,
  ): Coluna<T>[] => [
    {
      chave: "nome",
      cabecalho,
      render: (item) => (
        <span className="font-medium text-slate-800">{item.nome}</span>
      ),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (item) => (
        <Badge cor={item.ativo ? "verde" : "vermelho"}>
          {item.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Classificação"
        subtitulo="Os eixos que alimentam DRE, Fluxo de Caixa e Ponto de Equilíbrio"
        icone="Layers"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Categorias",
            valor: String(categorias.dados?.count ?? 0),
            descricao: "Grupos do DRE",
            icone: "Layers",
          },
          {
            rotulo: "Subcategorias",
            valor: String(subcategorias.dados?.count ?? 0),
            descricao: "Linhas do DRE",
            cor: "azul",
            icone: "List",
          },
          {
            rotulo: "Centros de Custo",
            valor: String(centros.dados?.count ?? 0),
            descricao: "Grupos do Fluxo de Caixa",
            cor: "roxo",
            icone: "Building2",
          },
          {
            rotulo: "Naturezas",
            valor: String(naturezas.dados?.count ?? 0),
            descricao: "Base do Ponto de Equilíbrio",
            cor: "ambar",
            icone: "Target",
          },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {ABAS.map((item) => (
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

      {aba === "categorias" &&
        (categorias.carregando ? (
          <EstadoCarregando linhas={8} />
        ) : (
          <div className="space-y-3">
            {(categorias.dados?.results ?? []).map((categoria) => {
              const filhas = (subcategorias.dados?.results ?? []).filter(
                (s) => s.categoria === categoria.id,
              );
              return (
                <div key={categoria.id} className="cartao p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {categoria.nome}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge cor={categoria.tipo === 1 ? "verde" : "vermelho"}>
                        {categoria.tipo_display}
                      </Badge>
                      {categoria.grupo_dre && (
                        <span className="font-mono text-xs text-slate-400">
                          {categoria.grupo_dre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filhas.length === 0 ? (
                      <span className="text-sm text-slate-400">
                        Sem subcategorias
                      </span>
                    ) : (
                      filhas.map((sub) => (
                        <span
                          key={sub.id}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {sub.nome}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {aba === "naturezas" && (
        <Tabela
          colunas={colunasNatureza}
          registros={naturezas.dados?.results ?? []}
          chave={(n) => n.id}
          carregando={naturezas.carregando}
          erro={naturezas.erro}
          vazio={{ titulo: "Nenhuma natureza cadastrada" }}
        />
      )}

      {aba === "centros" && (
        <Tabela
          colunas={colunasSimples<CentroCusto>("Centro de Custo")}
          registros={centros.dados?.results ?? []}
          chave={(c) => c.id}
          carregando={centros.carregando}
          erro={centros.erro}
          vazio={{ titulo: "Nenhum centro de custo cadastrado" }}
        />
      )}

      {aba === "formas" && (
        <Tabela
          colunas={colunasSimples<FormaPagamento>("Forma de Pagamento")}
          registros={formas.dados?.results ?? []}
          chave={(f) => f.id}
          carregando={formas.carregando}
          erro={formas.erro}
          vazio={{ titulo: "Nenhuma forma de pagamento cadastrada" }}
        />
      )}

      {aba === "linhas" && (
        <Tabela
          colunas={colunasSimples<LinhaNegocio>("Linha de Negócio")}
          registros={linhas.dados?.results ?? []}
          chave={(l) => l.id}
          carregando={linhas.carregando}
          erro={linhas.erro}
          vazio={{ titulo: "Nenhuma linha de negócio cadastrada" }}
        />
      )}
    </>
  );
}
