"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type {
  Categoria,
  CentroCusto,
  ContaFinanceira,
  FormaPagamento,
  LinhaNegocio,
  Natureza,
  Parceiro,
  Subcategoria,
} from "@/lib/api/tipos";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface Props {
  aoFechar: () => void;
  aoConcluir: () => void;
  /** Quando vem do menu "Nova entrada"/"Nova saída", o tipo já está decidido. */
  tipoFixo?: 1 | 2;
}

const HOJE = () => new Date().toISOString().slice(0, 10);

/**
 * Criação de lançamento de caixa — a ação primária da barra superior.
 *
 * O formulário insiste nos quatro eixos de classificação porque é deles que
 * DRE, Fluxo de Caixa e Ponto de Equilíbrio saem. Um lançamento sem
 * classificação não quebra o sistema, mas some dos relatórios — por isso o
 * aviso aparece antes de salvar, e não depois.
 */
export function ModalNovoLancamento({ aoFechar, aoConcluir, tipoFixo }: Props) {
  const [tipo, setTipo] = useState<1 | 2>(tipoFixo ?? 1);
  const [dataLancamento, setDataLancamento] = useState(HOJE());
  const [valor, setValor] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conta, setConta] = useState("");
  const [natureza, setNatureza] = useState("");
  const [centroCusto, setCentroCusto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [linhaNegocio, setLinhaNegocio] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<Record<string, string[]>>({});

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );
  const parceiros = useRequisicao(() =>
    api.listar<Parceiro>("parceiros", { page_size: 200 }),
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
  const formas = useRequisicao(() =>
    api.listar<FormaPagamento>("formas-pagamento", { page_size: 100 }),
  );
  const linhas = useRequisicao(() =>
    api.listar<LinhaNegocio>("linhas-negocio", { page_size: 100 }),
  );

  // A subcategoria é filha da categoria — o backend recusa um par inconsistente.
  const subsDisponiveis = (subcategorias.dados?.results ?? []).filter(
    (s) => !categoria || String(s.categoria) === categoria,
  );

  const classificacaoCompleta =
    natureza && centroCusto && categoria && subcategoria;

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setErrosCampo({});
    setEnviando(true);

    try {
      await api.criar("lancamentos", {
        tipo,
        data_lancamento: dataLancamento,
        valor,
        destinatario,
        parceiro: parceiro ? Number(parceiro) : null,
        descricao: descricao || null,
        conta_financeira: Number(conta),
        natureza: natureza ? Number(natureza) : null,
        centro_custo: centroCusto ? Number(centroCusto) : null,
        categoria: categoria ? Number(categoria) : null,
        subcategoria: subcategoria ? Number(subcategoria) : null,
        linha_negocio: linhaNegocio ? Number(linhaNegocio) : null,
        forma_pagamento: formaPagamento ? Number(formaPagamento) : null,
        data_pagamento: dataPagamento || null,
        observacoes: observacoes || null,
      });
      aoConcluir();
    } catch (falha) {
      if (falha instanceof ApiError) {
        setErro(falha.message);
        setErrosCampo(falha.campos);
      } else {
        setErro("Não foi possível salvar o lançamento.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function erroDe(campo: string) {
    return errosCampo[campo]?.[0];
  }

  return (
    <Modal titulo="Novo Lançamento" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="space-y-4 px-5 py-4">
        {/* Entrada ou saída define o sentido do dinheiro. Quando o menu já
            escolheu, o seletor não aparece — evita a pessoa trocar sem querer
            o que acabou de pedir. */}
        {!tipoFixo && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            {([1, 2] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setTipo(opcao)}
                aria-pressed={tipo === opcao}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  tipo === opcao
                    ? opcao === 1
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "bg-white text-red-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {opcao === 1 ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nl-data" className="rotulo-campo">
              Data do lançamento
            </label>
            <input
              id="nl-data"
              type="date"
              value={dataLancamento}
              onChange={(e) => setDataLancamento(e.target.value)}
              className="campo"
              required
            />
          </div>
          <div>
            <label htmlFor="nl-valor" className="rotulo-campo">
              Valor (R$)
            </label>
            <input
              id="nl-valor"
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="campo"
              placeholder="0,00"
              required
            />
            {erroDe("valor") && (
              <p className="mt-1 text-xs text-red-600">{erroDe("valor")}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="nl-destinatario" className="rotulo-campo">
            {tipo === 1 ? "Destinatário / Pagador" : "Favorecido / Fornecedor"}
          </label>
          <input
            id="nl-destinatario"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            className="campo"
            placeholder="Nome de quem pagou ou recebeu"
            required
          />
        </div>

        <div>
          <label htmlFor="nl-parceiro" className="rotulo-campo">
            Vincular a um cadastro (opcional)
          </label>
          <select
            id="nl-parceiro"
            value={parceiro}
            onChange={(e) => {
              setParceiro(e.target.value);
              const escolhido = (parceiros.dados?.results ?? []).find(
                (p) => String(p.id) === e.target.value,
              );
              if (escolhido && !destinatario) setDestinatario(escolhido.nome);
            }}
            className="campo"
          >
            <option value="">Sem vínculo</option>
            {(parceiros.dados?.results ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nl-conta" className="rotulo-campo">
            Conta financeira
          </label>
          <select
            id="nl-conta"
            value={conta}
            onChange={(e) => setConta(e.target.value)}
            className="campo"
            required
          >
            <option value="">Selecione...</option>
            {(contas.dados?.results ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.banco})
              </option>
            ))}
          </select>
          {(contas.dados?.results ?? []).length === 0 && !contas.carregando && (
            <p className="mt-1 text-xs text-amber-600">
              Nenhuma conta cadastrada. Cadastre uma em Cadastros › Contas
              Financeiras antes de lançar.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="nl-descricao" className="rotulo-campo">
            Descrição (opcional)
          </label>
          <input
            id="nl-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="campo"
          />
        </div>

        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-600">
            Classificação
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="nl-natureza" className="rotulo-campo">
                Natureza
              </label>
              <select
                id="nl-natureza"
                value={natureza}
                onChange={(e) => setNatureza(e.target.value)}
                className="campo"
              >
                <option value="">Selecione...</option>
                {(naturezas.dados?.results ?? []).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="nl-centro" className="rotulo-campo">
                Centro de custo
              </label>
              <select
                id="nl-centro"
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
                className="campo"
              >
                <option value="">Selecione...</option>
                {(centros.dados?.results ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="nl-categoria" className="rotulo-campo">
                Categoria
              </label>
              <select
                id="nl-categoria"
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setSubcategoria("");
                }}
                className="campo"
              >
                <option value="">Selecione...</option>
                {(categorias.dados?.results ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="nl-subcategoria" className="rotulo-campo">
                Subcategoria
              </label>
              <select
                id="nl-subcategoria"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="campo"
                disabled={!categoria}
              >
                <option value="">
                  {categoria ? "Selecione..." : "Escolha a categoria antes"}
                </option>
                {subsDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              {erroDe("subcategoria") && (
                <p className="mt-1 text-xs text-red-600">
                  {erroDe("subcategoria")}
                </p>
              )}
            </div>
          </div>

          {tipo === 1 && (
            <div className="mt-3">
              <label htmlFor="nl-linha" className="rotulo-campo">
                Linha de negócio (receita)
              </label>
              <select
                id="nl-linha"
                value={linhaNegocio}
                onChange={(e) => setLinhaNegocio(e.target.value)}
                className="campo"
              >
                <option value="">Não atribuir</option>
                {(linhas.dados?.results ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Necessária para o rateio do Ponto de Equilíbrio.
              </p>
            </div>
          )}

          {!classificacaoCompleta && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Sem os quatro eixos preenchidos, este lançamento entra no saldo
              mas fica de fora do DRE, do Fluxo de Caixa e do Ponto de
              Equilíbrio.
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nl-forma" className="rotulo-campo">
              Forma de pagamento
            </label>
            <select
              id="nl-forma"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="campo"
            >
              <option value="">Selecione...</option>
              {(formas.dados?.results ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-pagamento" className="rotulo-campo">
              Data do pagamento
            </label>
            <input
              id="nl-pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="campo"
            />
            <p className="mt-1 text-xs text-slate-400">
              Em branco = pendente, fora do saldo.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="nl-observacoes" className="rotulo-campo">
            Observações (opcional)
          </label>
          <textarea
            id="nl-observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="campo"
          />
        </div>

        {erro && (
          <p className="animate-surgir rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={aoFechar}
            className="botao-secundario"
            disabled={enviando}
          >
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {enviando ? "Salvando..." : "Salvar lançamento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
