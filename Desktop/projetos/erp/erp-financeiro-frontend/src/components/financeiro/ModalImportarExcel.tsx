"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ContaFinanceira } from "@/lib/api/tipos";
import { Modal } from "@/components/ui/Modal";

interface Previa {
  total: number;
  validas: number;
  invalidas: { linha: number; erros: string[] }[];
}

/**
 * Importação de lançamentos por planilha (CSV ou XLSX).
 *
 * Em duas fases, como a conciliação bancária: primeiro o backend analisa e
 * devolve os erros por linha, e só depois grava. Importar direto significaria
 * descobrir uma coluna errada com metade dos lançamentos já no caixa.
 */
export function ModalImportarExcel({
  tipo,
  aoFechar,
  aoConcluir,
}: {
  tipo: 1 | 2;
  aoFechar: () => void;
  aoConcluir: (importados: number) => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [conta, setConta] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", { page_size: 100 }),
  );

  function montarCorpo() {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo as File);
    corpo.append("tipo", String(tipo));
    if (conta) corpo.append("conta_financeira", conta);
    return corpo;
  }

  async function analisar() {
    if (!arquivo) {
      setErro("Selecione o arquivo da planilha.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      const resposta = await api.acao<{ data: Previa }>(
        "lancamentos/importar-excel?previa=1",
        montarCorpo(),
      );
      setPrevia(resposta.data);
    } catch (falha) {
      setErro(
        falha instanceof ApiError ? falha.message : "Não foi possível ler o arquivo.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmar() {
    setErro(null);
    setProcessando(true);
    try {
      const resposta = await api.acao<{ data: { importados: number } }>(
        "lancamentos/importar-excel",
        montarCorpo(),
      );
      aoConcluir(resposta.data.importados);
    } catch (falha) {
      setErro(
        falha instanceof ApiError ? falha.message : "Não foi possível importar.",
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      titulo={`Importar ${tipo === 1 ? "entradas" : "saídas"} por planilha`}
      aoFechar={aoFechar}
    >
      <div className="space-y-4 px-5 py-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          Colunas reconhecidas: <strong>Data Lançamento</strong> e{" "}
          <strong>Valor</strong> (obrigatórias), Destinatário, Descrição, Banco,
          Natureza, Centro de custo, Categoria, Subcategoria, Forma de
          pagamento, Data pagamento e Observações.
        </div>

        <div>
          <label htmlFor="ie-arquivo" className="rotulo-campo">
            Arquivo (CSV ou XLSX)
          </label>
          <input
            id="ie-arquivo"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
              setPrevia(null);
            }}
            className="campo file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs"
          />
        </div>

        <div>
          <label htmlFor="ie-conta" className="rotulo-campo">
            Conta padrão
          </label>
          <select
            id="ie-conta"
            value={conta}
            onChange={(e) => setConta(e.target.value)}
            className="campo"
          >
            <option value="">Usar a coluna Banco da planilha</option>
            {(contas.dados?.results ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Aplicada às linhas cuja coluna Banco estiver vazia.
          </p>
        </div>

        {previa && (
          <div className="animate-surgir space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-slate-700">
                <strong>{previa.total}</strong> linha(s) lida(s) ·{" "}
                <strong className="text-emerald-600">{previa.validas}</strong>{" "}
                pronta(s)
                {previa.invalidas.length > 0 && (
                  <>
                    {" · "}
                    <strong className="text-red-600">
                      {previa.invalidas.length}
                    </strong>{" "}
                    com erro
                  </>
                )}
              </span>
            </div>

            {previa.invalidas.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-1 text-xs font-medium text-red-800">
                  Corrija a planilha antes de importar:
                </p>
                <ul className="space-y-0.5 text-xs text-red-700">
                  {previa.invalidas.map((item) => (
                    <li key={item.linha}>
                      Linha {item.linha}: {item.erros.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
            disabled={processando}
          >
            Cancelar
          </button>

          {!previa || previa.invalidas.length > 0 ? (
            <button
              type="button"
              onClick={analisar}
              className="botao-primario"
              disabled={processando || !arquivo}
            >
              {processando ? "Analisando..." : "Analisar planilha"}
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmar}
              className="botao-primario"
              disabled={processando || previa.validas === 0}
            >
              {processando
                ? "Importando..."
                : `Importar ${previa.validas} lançamento(s)`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
