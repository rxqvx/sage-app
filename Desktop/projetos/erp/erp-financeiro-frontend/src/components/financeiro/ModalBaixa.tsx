"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import type { ContaFinanceira, Titulo } from "@/lib/api/tipos";
import { moeda, paraNumero } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

interface Props {
  titulo: Titulo;
  recurso: string;
  contas: ContaFinanceira[];
  aoFechar: () => void;
  aoConcluir: () => void;
}

/**
 * Baixa de título.
 *
 * O total exibido é só uma prévia para o usuário conferir — quem calcula e
 * grava o valor que entra no caixa é o backend (`baixa_service`).
 */
export function ModalBaixa({
  titulo,
  recurso,
  contas,
  aoFechar,
  aoConcluir,
}: Props) {
  const hoje = new Date().toISOString().slice(0, 10);
  const ehPagar = recurso === "contas-pagar";

  const [conta, setConta] = useState(
    titulo.conta_financeira ? String(titulo.conta_financeira) : "",
  );
  const [dataLiquidacao, setDataLiquidacao] = useState(hoje);
  const [juros, setJuros] = useState(titulo.juros);
  const [multa, setMulta] = useState(titulo.multa);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const previaTotal =
    paraNumero(titulo.valor) + paraNumero(juros) + paraNumero(multa);

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!conta) {
      setErro("Selecione a conta financeira utilizada na baixa.");
      return;
    }

    setEnviando(true);
    try {
      await api.acao(`${recurso}/${titulo.id}/baixar`, {
        conta_financeira: Number(conta),
        data_liquidacao: dataLiquidacao,
        juros,
        multa,
      });
      aoConcluir();
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.message
          : "Não foi possível baixar o título.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={ehPagar ? "Pagar título" : "Receber título"}
      aoFechar={aoFechar}
    >
      <form onSubmit={confirmar} className="space-y-4 px-5 py-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
          <p className="font-medium text-slate-800">{titulo.parceiro_nome}</p>
          <p className="text-slate-500">
            {titulo.numero_documento} · vence {titulo.vencimento}
          </p>
        </div>

        <div>
          <label htmlFor="conta" className="rotulo-campo">
            Conta financeira
          </label>
          <select
            id="conta"
            value={conta}
            onChange={(e) => setConta(e.target.value)}
            className="campo"
            required
          >
            <option value="">Selecione...</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.banco})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="data-liquidacao" className="rotulo-campo">
            Data da liquidação
          </label>
          <input
            id="data-liquidacao"
            type="date"
            value={dataLiquidacao}
            onChange={(e) => setDataLiquidacao(e.target.value)}
            className="campo"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="juros" className="rotulo-campo">
              Juros
            </label>
            <input
              id="juros"
              type="number"
              step="0.01"
              min="0"
              value={juros}
              onChange={(e) => setJuros(e.target.value)}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="multa" className="rotulo-campo">
              Multa
            </label>
            <input
              id="multa"
              type="number"
              step="0.01"
              min="0"
              value={multa}
              onChange={(e) => setMulta(e.target.value)}
              className="campo"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-brand-light px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">
            Total a lançar no caixa:
          </span>
          <span className="font-bold tabular-nums text-brand-dark transition-all duration-200">
            {moeda(previaTotal)}
          </span>
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
            {enviando ? "Processando..." : "Confirmar baixa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
