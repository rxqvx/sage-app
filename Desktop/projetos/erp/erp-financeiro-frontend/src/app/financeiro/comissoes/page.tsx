"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Comissao, Vendedor } from "@/lib/api/tipos";
import { competencia, moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardsIndicadores, Dinheiro, Tabela, type Coluna } from "@/components/data";
import { BarraFiltros, CampoBusca, Selecao } from "@/components/data/Filtros";

interface Totais {
  faturado: string;
  comissoes: string;
  saldo_final: string;
}

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export default function ComissoesPage() {
  const [busca, setBusca] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [periodo, setPeriodo] = useState(competenciaAtual());
  const [apurando, setApurando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const filtros = {
    search: busca || undefined,
    vendedor: vendedor || undefined,
    page_size: 100,
  };

  const lista = useRequisicao(
    () => api.listar<Comissao>("comissoes", filtros),
    [busca, vendedor],
  );
  const totais = useRequisicao(
    () => api.buscar<Totais>("comissoes/totais", filtros),
    [busca, vendedor],
  );
  const vendedores = useRequisicao(() =>
    api.listar<Vendedor>("vendedores", { page_size: 100 }),
  );

  async function apurar() {
    setApurando(true);
    setMensagem(null);
    try {
      const resposta = await api.acao<{ data: Comissao[] }>("comissoes/apurar", {
        periodo,
        vendedor: vendedor ? Number(vendedor) : undefined,
      });
      setMensagem(
        `${resposta.data.length} comissão(ões) apurada(s) para ${competencia(periodo)}.`,
      );
      lista.recarregar();
      totais.recarregar();
    } catch (erro) {
      setMensagem(
        erro instanceof ApiError ? erro.message : "Não foi possível apurar.",
      );
    } finally {
      setApurando(false);
    }
  }

  const colunas: Coluna<Comissao>[] = [
    {
      chave: "periodo",
      cabecalho: "Período",
      render: (c) => competencia(c.periodo),
    },
    {
      chave: "vendedor",
      cabecalho: "Vendedor",
      larguraMinima: "180px",
      render: (c) => (
        <span>
          <span className="block font-medium text-slate-800">
            {c.vendedor_nome}
          </span>
          <span className="block text-xs text-slate-400">{c.tipo_comissao}</span>
        </span>
      ),
    },
    {
      chave: "faturado",
      cabecalho: "Faturado",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.faturado} />,
    },
    {
      chave: "saldo_anterior",
      cabecalho: "Saldo Ant.",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.saldo_anterior} />,
    },
    {
      chave: "comissao",
      cabecalho: "(+) Comissão",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.comissao_mes} forcarCor="verde" />,
    },
    {
      chave: "creditos",
      cabecalho: "(+) Out. Créditos",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.outros_creditos} />,
    },
    {
      chave: "debitos",
      cabecalho: "(−) Out. Débitos",
      alinhamento: "direita",
      render: (c) => <Dinheiro valor={c.outros_debitos} />,
    },
    {
      chave: "saldo",
      cabecalho: "Saldo Final",
      alinhamento: "direita",
      render: (c) => (
        <span className="font-semibold">
          <Dinheiro valor={c.saldo_final} colorir />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Comissões"
        subtitulo="Cálculo e pagamento de comissões de vendedores"
        icone="Percent"
        acoes={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              aria-label="Competência a apurar"
              className="campo w-40"
            />
            <button
              type="button"
              onClick={apurar}
              className="botao-primario"
              disabled={apurando}
            >
              {apurando ? "Apurando..." : "Apurar período"}
            </button>
          </div>
        }
      />

      {mensagem && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {mensagem}
        </div>
      )}

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Faturado",
            valor: moeda(totais.dados?.faturado),
            cor: "roxo",
            icone: "DollarSign",
          },
          {
            rotulo: "Total Comissões",
            valor: moeda(totais.dados?.comissoes),
            cor: "ambar",
            icone: "Percent",
          },
          {
            rotulo: "Saldo Final",
            valor: moeda(totais.dados?.saldo_final),
            cor: "verde",
            icone: "CheckCircle",
          },
        ]}
      />

      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por vendedor ou período..."
        />
        <Selecao
          valor={vendedor}
          aoMudar={setVendedor}
          rotuloVazio="Todos os vendedores"
          opcoes={(vendedores.dados?.results ?? []).map((v) => ({
            valor: String(v.id),
            rotulo: v.nome,
          }))}
        />
      </BarraFiltros>

      <Tabela
        colunas={colunas}
        registros={lista.dados?.results ?? []}
        chave={(c) => c.id}
        carregando={lista.carregando}
        erro={lista.erro}
        aoTentarNovamente={lista.recarregar}
        vazio={{
          titulo: "Nenhuma comissão apurada",
          descricao:
            "Escolha a competência acima e use 'Apurar período' para calcular a partir do que foi liquidado.",
        }}
      />
    </>
  );
}
