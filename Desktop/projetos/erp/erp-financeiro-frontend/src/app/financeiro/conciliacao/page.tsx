"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type {
  Categoria,
  CentroCusto,
  ContaFinanceira,
  ImportacaoExtrato,
  ItemExtrato,
  Natureza,
  Subcategoria,
} from "@/lib/api/tipos";
import { data, moeda, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  Dinheiro,
  EstadoCarregando,
  EstadoVazio,
  Tabela,
  corDoStatus,
  type Coluna,
} from "@/components/data";
import { BarraFiltros, Selecao } from "@/components/data/Filtros";

type Acao = "importar" | "conciliar" | "ignorar";

interface Decisao {
  acao: Acao;
  natureza?: string;
  centro_custo?: string;
  categoria?: string;
  subcategoria?: string;
}

/**
 * Conciliação bancária em duas fases, como a planilha exige:
 * primeiro o extrato vira itens pendentes, depois o usuário escolhe quais
 * importar e classifica cada um. Nada afeta o caixa até a confirmação.
 */
export default function ConciliacaoPage() {
  const [importacaoId, setImportacaoId] = useState<number | null>(null);

  const importacoes = useRequisicao(() =>
    api.listar<ImportacaoExtrato>("conciliacao/importacoes", { page_size: 50 }),
  );

  return (
    <>
      <PageHeader
        titulo="Conciliação Bancária"
        subtitulo="Importação de extratos e conciliação com os lançamentos do sistema"
        icone="SlidersHorizontal"
      />

      {importacaoId ? (
        <DetalheImportacao
          id={importacaoId}
          aoVoltar={() => {
            setImportacaoId(null);
            importacoes.recarregar();
          }}
        />
      ) : (
        <>
          <FormularioImportacao
            aoImportar={(id) => {
              importacoes.recarregar();
              setImportacaoId(id);
            }}
          />

          <Tabela
            titulo="Importações de extrato"
            colunas={colunasImportacao(setImportacaoId)}
            registros={importacoes.dados?.results ?? []}
            chave={(i) => i.id}
            carregando={importacoes.carregando}
            erro={importacoes.erro}
            aoTentarNovamente={importacoes.recarregar}
            vazio={{
              titulo: "Nenhum extrato importado",
              descricao:
                "Importe um extrato acima — pela API do banco ou por arquivo OFX/CSV.",
            }}
          />
        </>
      )}
    </>
  );
}

function colunasImportacao(
  abrir: (id: number) => void,
): Coluna<ImportacaoExtrato>[] {
  return [
    {
      chave: "conta",
      cabecalho: "Conta",
      render: (i) => (
        <span className="font-medium text-slate-800">{i.conta_nome}</span>
      ),
    },
    { chave: "origem", cabecalho: "Origem", render: (i) => i.origem_display },
    {
      chave: "periodo",
      cabecalho: "Período",
      render: (i) => `${data(i.periodo_inicio)} a ${data(i.periodo_fim)}`,
    },
    {
      chave: "itens",
      cabecalho: "Itens",
      alinhamento: "centro",
      render: (i) => i.total_itens,
    },
    {
      chave: "pendentes",
      cabecalho: "Pendentes",
      alinhamento: "centro",
      render: (i) =>
        i.pendentes > 0 ? (
          <Badge cor="ambar">{i.pendentes}</Badge>
        ) : (
          <Badge cor="verde">0</Badge>
        ),
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (i) => (
        <Badge cor={i.status === 2 ? "verde" : "azul"}>{i.status_display}</Badge>
      ),
    },
    {
      chave: "acoes",
      cabecalho: "Ações",
      alinhamento: "centro",
      render: (i) => (
        <button
          type="button"
          onClick={() => abrir(i.id)}
          className="text-xs font-medium text-brand hover:underline"
        >
          Abrir
        </button>
      ),
    },
  ];
}

function FormularioImportacao({
  aoImportar,
}: {
  aoImportar: (id: number) => void;
}) {
  const padrao = periodoPadrao();
  const [conta, setConta] = useState("");
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  async function importar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const corpo = new FormData();
      corpo.append("conta_financeira", conta);
      corpo.append("periodo_inicio", inicio);
      corpo.append("periodo_fim", fim);
      if (arquivo) {
        corpo.append("arquivo", arquivo);
        corpo.append("forcar_arquivo", "true");
      }

      const resposta = await api.acao<{ data: ImportacaoExtrato }>(
        "conciliacao/importacoes/importar",
        corpo,
      );
      aoImportar(resposta.data.id);
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.message
          : "Não foi possível importar o extrato.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={importar} className="cartao mb-6 p-5">
      <h2 className="mb-4 font-semibold text-slate-900">Importar extrato</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="conta-import" className="rotulo-campo">
            Conta
          </label>
          <select
            id="conta-import"
            value={conta}
            onChange={(e) => setConta(e.target.value)}
            className="campo"
            required
          >
            <option value="">Selecione...</option>
            {(contas.dados?.results ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.provedor_display})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="inicio-import" className="rotulo-campo">
            De
          </label>
          <input
            id="inicio-import"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="campo"
            required
          />
        </div>

        <div>
          <label htmlFor="fim-import" className="rotulo-campo">
            Até
          </label>
          <input
            id="fim-import"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="campo"
            required
          />
        </div>

        <div>
          <label htmlFor="arquivo-import" className="rotulo-campo">
            Arquivo (opcional)
          </label>
          <input
            id="arquivo-import"
            type="file"
            accept=".ofx,.csv,.txt"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="campo file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Sem arquivo, o extrato é buscado na API do provedor cadastrado na conta
        (Asaas ou C6). Com arquivo, a leitura é feita do OFX/CSV enviado.
      </p>

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="mt-4">
        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? "Importando..." : "Importar extrato"}
        </button>
      </div>
    </form>
  );
}

function DetalheImportacao({
  id,
  aoVoltar,
}: {
  id: number;
  aoVoltar: () => void;
}) {
  const [decisoes, setDecisoes] = useState<Record<number, Decisao>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const importacao = useRequisicao(
    () => api.obter<ImportacaoExtrato>("conciliacao/importacoes", id),
    [id],
  );

  const naturezas = useRequisicao(() =>
    api.listar<Natureza>("naturezas", { page_size: 100 }),
  );
  const centros = useRequisicao(() =>
    api.listar<CentroCusto>("centros-custo", { page_size: 100 }),
  );
  const categorias = useRequisicao(() =>
    api.listar<Categoria>("categorias", { page_size: 100 }),
  );
  const subcategorias = useRequisicao(() =>
    api.listar<Subcategoria>("subcategorias", { page_size: 300 }),
  );

  function decisao(item: ItemExtrato): Decisao {
    return (
      decisoes[item.id] ?? {
        acao: item.sugestao ? "conciliar" : "importar",
      }
    );
  }

  function atualizar(itemId: number, mudanca: Partial<Decisao>) {
    setDecisoes((atual) => ({
      ...atual,
      [itemId]: { ...(atual[itemId] ?? { acao: "importar" }), ...mudanca },
    }));
  }

  async function confirmar() {
    const pendentes = (importacao.dados?.itens ?? []).filter(
      (item) => item.situacao === 1,
    );
    if (!pendentes.length) return;

    setErro(null);
    setEnviando(true);
    try {
      await api.acao(`conciliacao/importacoes/${id}/confirmar`, {
        itens: pendentes.map((item) => {
          const escolha = decisao(item);
          return {
            item: item.id,
            acao: escolha.acao,
            lancamento: item.sugestao?.id,
            natureza: escolha.natureza ? Number(escolha.natureza) : undefined,
            centro_custo: escolha.centro_custo
              ? Number(escolha.centro_custo)
              : undefined,
            categoria: escolha.categoria ? Number(escolha.categoria) : undefined,
            subcategoria: escolha.subcategoria
              ? Number(escolha.subcategoria)
              : undefined,
          };
        }),
      });
      aoVoltar();
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.message
          : "Não foi possível concluir a importação.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (importacao.carregando) return <EstadoCarregando linhas={6} />;
  if (!importacao.dados) {
    return (
      <div className="cartao">
        <EstadoVazio titulo="Importação não encontrada" />
      </div>
    );
  }

  const itens = importacao.dados.itens ?? [];
  const pendentes = itens.filter((item) => item.situacao === 1);
  const concluida = importacao.dados.status === 2;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={aoVoltar} className="botao-secundario">
          ← Voltar
        </button>
        {!concluida && pendentes.length > 0 && (
          <button
            type="button"
            onClick={confirmar}
            className="botao-primario"
            disabled={enviando}
          >
            {enviando
              ? "Processando..."
              : `Confirmar ${pendentes.length} item(ns)`}
          </button>
        )}
      </div>

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Itens no extrato",
            valor: String(itens.length),
            icone: "List",
          },
          {
            rotulo: "Pendentes",
            valor: String(pendentes.length),
            cor: "ambar",
            icone: "Clock",
          },
          {
            rotulo: "Já tratados",
            valor: String(itens.length - pendentes.length),
            cor: "verde",
            icone: "CheckCircle",
          },
        ]}
      />

      {erro && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="cartao overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            {importacao.dados.conta_nome} · {importacao.dados.origem_display}
          </h2>
          <p className="text-sm text-slate-500">
            {data(importacao.dados.periodo_inicio)} a{" "}
            {data(importacao.dados.periodo_fim)}
          </p>
        </div>

        {itens.length === 0 ? (
          <EstadoVazio titulo="Extrato sem transações" />
        ) : (
          <div className="divide-y divide-slate-100">
            {itens.map((item) => {
              const escolha = decisao(item);
              const editavel = item.situacao === 1 && !concluida;
              const subsDaCategoria = (subcategorias.dados?.results ?? []).filter(
                (s) =>
                  !escolha.categoria ||
                  String(s.categoria) === escolha.categoria,
              );

              return (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {item.descricao}
                      </p>
                      <p className="text-xs text-slate-500">
                        {data(item.data)} · {item.tipo_display}
                        {item.documento && ` · doc ${item.documento}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Dinheiro
                        valor={item.valor}
                        forcarCor={item.tipo === 1 ? "verde" : "vermelho"}
                      />
                      <Badge cor={corDoStatus(item.situacao_display)}>
                        {item.situacao_display.toLowerCase()}
                      </Badge>
                    </div>
                  </div>

                  {item.sugestao && editavel && (
                    <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      Possível correspondência: {item.sugestao.destinatario} ·{" "}
                      {moeda(item.sugestao.valor)} em {data(item.sugestao.data)}
                    </p>
                  )}

                  {editavel && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <select
                        value={escolha.acao}
                        onChange={(e) =>
                          atualizar(item.id, { acao: e.target.value as Acao })
                        }
                        aria-label="Ação"
                        className="campo"
                      >
                        <option value="importar">Importar como lançamento</option>
                        <option value="conciliar" disabled={!item.sugestao}>
                          Conciliar com existente
                        </option>
                        <option value="ignorar">Ignorar</option>
                      </select>

                      {escolha.acao === "importar" && (
                        <>
                          <select
                            value={escolha.natureza ?? ""}
                            onChange={(e) =>
                              atualizar(item.id, { natureza: e.target.value })
                            }
                            aria-label="Natureza"
                            className="campo"
                          >
                            <option value="">Natureza...</option>
                            {(naturezas.dados?.results ?? []).map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.nome}
                              </option>
                            ))}
                          </select>

                          <select
                            value={escolha.centro_custo ?? ""}
                            onChange={(e) =>
                              atualizar(item.id, { centro_custo: e.target.value })
                            }
                            aria-label="Centro de custo"
                            className="campo"
                          >
                            <option value="">Centro de custo...</option>
                            {(centros.dados?.results ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </select>

                          <select
                            value={escolha.categoria ?? ""}
                            onChange={(e) =>
                              atualizar(item.id, {
                                categoria: e.target.value,
                                subcategoria: "",
                              })
                            }
                            aria-label="Categoria"
                            className="campo"
                          >
                            <option value="">Categoria...</option>
                            {(categorias.dados?.results ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </select>

                          <select
                            value={escolha.subcategoria ?? ""}
                            onChange={(e) =>
                              atualizar(item.id, { subcategoria: e.target.value })
                            }
                            aria-label="Subcategoria"
                            className="campo"
                          >
                            <option value="">Subcategoria...</option>
                            {subsDaCategoria.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nome}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
