"use client";

import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { ParametrosFiscais } from "@/lib/api/tipos";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstadoCarregando, EstadoErro } from "@/components/data";

/**
 * Alíquotas e lucro desejado.
 *
 * A planilha registra explicitamente que o usuário financeiro deve poder
 * editar as alíquotas — por isso elas são cadastro, e não constante no código.
 */
export default function ParametrosPage() {
  const parametros = useRequisicao(() =>
    api.buscar<ParametrosFiscais>("parametros-fiscais/atual"),
  );

  const [formulario, setFormulario] = useState<ParametrosFiscais | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (parametros.dados) setFormulario(parametros.dados);
  }, [parametros.dados]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;

    setErro(null);
    setMensagem(null);
    setSalvando(true);
    try {
      // Pelo cliente HTTP, como todo o resto: é ele que anexa o cookie de
      // sessão e o token CSRF. O `fetch` solto que existia aqui passou a tomar
      // 403 no instante em que a autenticação entrou — a única tela do sistema
      // que escapava do cliente era também a única que quebraria.
      await api.atualizar("parametros-fiscais", "atual", {
        empresa: formulario.empresa,
        aliquota_iss: formulario.aliquota_iss,
        aliquota_pis: formulario.aliquota_pis,
        aliquota_cofins: formulario.aliquota_cofins,
        lucro_desejado: formulario.lucro_desejado,
      });

      setMensagem("Parâmetros atualizados. Os relatórios já usam os novos valores.");
      parametros.recarregar();
    } catch (falha) {
      setErro(
        falha instanceof ApiError ? falha.message : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function alterar(campo: keyof ParametrosFiscais, valor: string) {
    setFormulario((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  return (
    <>
      <PageHeader
        titulo="Parâmetros Fiscais"
        subtitulo="Alíquotas e lucro desejado usados pelos relatórios"
        icone="SlidersHorizontal"
      />

      {parametros.carregando ? (
        <EstadoCarregando linhas={5} />
      ) : parametros.erro || !formulario ? (
        <div className="cartao">
          <EstadoErro
            mensagem={parametros.erro ?? "Sem dados."}
            aoTentarNovamente={parametros.recarregar}
          />
        </div>
      ) : (
        <form onSubmit={salvar} className="cartao max-w-2xl p-6">
          <div className="mb-5">
            <label htmlFor="empresa" className="rotulo-campo">
              Empresa
            </label>
            <input
              id="empresa"
              value={formulario.empresa}
              onChange={(e) => alterar("empresa", e.target.value)}
              className="campo"
            />
          </div>

          <fieldset className="mb-5">
            <legend className="mb-3 text-sm font-semibold text-slate-700">
              Alíquotas aplicadas sobre a receita bruta no DRE
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="iss" className="rotulo-campo">
                  ISS (%)
                </label>
                <input
                  id="iss"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formulario.aliquota_iss}
                  onChange={(e) => alterar("aliquota_iss", e.target.value)}
                  className="campo"
                />
              </div>
              <div>
                <label htmlFor="pis" className="rotulo-campo">
                  PIS (%)
                </label>
                <input
                  id="pis"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formulario.aliquota_pis}
                  onChange={(e) => alterar("aliquota_pis", e.target.value)}
                  className="campo"
                />
              </div>
              <div>
                <label htmlFor="cofins" className="rotulo-campo">
                  COFINS (%)
                </label>
                <input
                  id="cofins"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formulario.aliquota_cofins}
                  onChange={(e) => alterar("aliquota_cofins", e.target.value)}
                  className="campo"
                />
              </div>
            </div>
          </fieldset>

          <div className="mb-5">
            <label htmlFor="lucro" className="rotulo-campo">
              Lucro desejado (R$)
            </label>
            <input
              id="lucro"
              type="number"
              step="0.01"
              min="0"
              value={formulario.lucro_desejado}
              onChange={(e) => alterar("lucro_desejado", e.target.value)}
              className="campo"
            />
            <p className="mt-1 text-xs text-slate-400">
              Usado apenas no Ponto de Lucro do relatório de Ponto de Equilíbrio.
            </p>
          </div>

          {mensagem && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {mensagem}
            </p>
          )}
          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}

          <button type="submit" className="botao-primario" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar parâmetros"}
          </button>
        </form>
      )}
    </>
  );
}
