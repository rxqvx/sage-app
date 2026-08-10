"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { AjusteSaldo, ContaFinanceira, SaldoConta } from "@/lib/api/tipos";
import { data, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, Selecao } from "@/components/data/Filtros";
import { Modal } from "@/components/ui/Modal";

interface Totais {
  positivos: string;
  negativos: string;
}

export default function AjusteSaldoPage() {
  const [conta, setConta] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(false);

  const lista = useRequisicao(
    () =>
      api.listar<AjusteSaldo>("ajustes-saldo", {
        conta_financeira: conta || undefined,
        page_size: 100,
      }),
    [conta],
  );
  const totais = useRequisicao(
    () =>
      api.buscar<Totais>("ajustes-saldo/totais", {
        conta_financeira: conta || undefined,
      }),
    [conta],
  );
  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  const colunas: Coluna<AjusteSaldo>[] = [
    { chave: "data", cabecalho: "Data", render: (a) => data(a.data) },
    {
      chave: "conta",
      cabecalho: "Conta Bancária",
      larguraMinima: "180px",
      render: (a) => (
        <span className="font-medium text-slate-800">{a.conta_nome}</span>
      ),
    },
    {
      chave: "anterior",
      cabecalho: "Saldo Anterior",
      alinhamento: "direita",
      render: (a) => <Dinheiro valor={a.saldo_anterior} />,
    },
    {
      chave: "ajustado",
      cabecalho: "Saldo Ajustado",
      alinhamento: "direita",
      render: (a) => <Dinheiro valor={a.saldo_ajustado} />,
    },
    {
      chave: "diferenca",
      cabecalho: "Diferença",
      alinhamento: "direita",
      render: (a) => <Dinheiro valor={a.diferenca} colorir />,
    },
    {
      chave: "justificativa",
      cabecalho: "Justificativa",
      larguraMinima: "240px",
      render: (a) => <span className="text-slate-600">{a.justificativa}</span>,
    },
    {
      chave: "usuario",
      cabecalho: "Usuário",
      render: (a) => a.usuario_nome ?? "—",
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Ajuste de Saldo"
        subtitulo="Ajustes manuais de saldo em contas bancárias"
        icone="Scale"
        acoes={
          <button
            type="button"
            onClick={() => setFormularioAberto(true)}
            className="botao-primario"
          >
            Novo Ajuste
          </button>
        }
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total de Ajustes",
            valor: String(lista.dados?.count ?? 0),
            icone: "Scale",
          },
          {
            rotulo: "Ajustes Positivos",
            valor: moeda(totais.dados?.positivos),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "Ajustes Negativos",
            valor: moeda(totais.dados?.negativos),
            cor: "vermelho",
            icone: "TrendingDown",
          },
        ]}
      />

      <BarraFiltros>
        <Selecao
          valor={conta}
          aoMudar={setConta}
          rotuloVazio="Todas as contas"
          opcoes={(contas.dados?.results ?? []).map((c) => ({
            valor: String(c.id),
            rotulo: c.nome,
          }))}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={lista.dados?.results ?? []}
        chave={(a) => a.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Nenhum ajuste registrado",
          descricao:
            "Ajustes servem para corrigir divergências — por exemplo, duplicidade de lançamento vinda do Asaas.",
        }}
      />

      {formularioAberto && (
        <FormularioAjuste
          contas={contas.dados?.results ?? []}
          aoFechar={() => setFormularioAberto(false)}
          aoConcluir={() => {
            setFormularioAberto(false);
            lista.recarregar();
            totais.recarregar();
          }}
        />
      )}
    </>
  );
}

function FormularioAjuste({
  contas,
  aoFechar,
  aoConcluir,
}: {
  contas: ContaFinanceira[];
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [conta, setConta] = useState("");
  const [dataAjuste, setDataAjuste] = useState(hoje);
  const [saldoAnterior, setSaldoAnterior] = useState("");
  const [saldoAjustado, setSaldoAjustado] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /** Busca o saldo corrente para o usuário não precisar digitá-lo. */
  async function aoTrocarConta(valor: string) {
    setConta(valor);
    setSaldoAnterior("");
    if (!valor) return;
    try {
      const saldo = await api.buscar<SaldoConta>("ajustes-saldo/saldo-atual", {
        conta: valor,
      });
      setSaldoAnterior(saldo.saldo_atual);
    } catch {
      // Sem saldo pré-carregado o usuário ainda pode informar manualmente.
    }
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.criar("ajustes-saldo", {
        conta_financeira: Number(conta),
        data: dataAjuste,
        saldo_anterior: saldoAnterior,
        saldo_ajustado: saldoAjustado,
        justificativa,
      });
      aoConcluir();
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.message
          : "Não foi possível salvar o ajuste.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Novo ajuste de saldo" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="space-y-4 px-5 py-4">
        <div>
          <label htmlFor="conta-ajuste" className="rotulo-campo">
            Conta bancária
          </label>
          <select
            id="conta-ajuste"
            value={conta}
            onChange={(e) => aoTrocarConta(e.target.value)}
            className="campo"
            required
          >
            <option value="">Selecione...</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="data-ajuste" className="rotulo-campo">
            Data
          </label>
          <input
            id="data-ajuste"
            type="date"
            value={dataAjuste}
            onChange={(e) => setDataAjuste(e.target.value)}
            className="campo"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="saldo-anterior" className="rotulo-campo">
              Saldo atual
            </label>
            <input
              id="saldo-anterior"
              type="number"
              step="0.01"
              value={saldoAnterior}
              onChange={(e) => setSaldoAnterior(e.target.value)}
              className="campo"
              required
            />
          </div>
          <div>
            <label htmlFor="saldo-ajustado" className="rotulo-campo">
              Saldo corrigido
            </label>
            <input
              id="saldo-ajustado"
              type="number"
              step="0.01"
              value={saldoAjustado}
              onChange={(e) => setSaldoAjustado(e.target.value)}
              className="campo"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="justificativa" className="rotulo-campo">
            Justificativa <span className="text-red-500">*</span>
          </label>
          <textarea
            id="justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
            className="campo"
            placeholder="Descreva o ocorrido que gerou a divergência."
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Obrigatória: o ajuste existe para registrar o motivo da diferença.
          </p>
        </div>

        {erro && (
          <p className="animate-surgir rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="botao-secundario">
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {enviando ? "Salvando..." : "Salvar ajuste"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
