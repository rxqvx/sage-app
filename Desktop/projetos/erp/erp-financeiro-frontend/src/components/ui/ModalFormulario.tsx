"use client";

import { useMemo, useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

export interface OpcaoCampo {
  valor: string;
  rotulo: string;
  /** Usado por selects encadeados: subcategoria pertence a uma categoria. */
  pai?: string;
}

export interface Campo {
  nome: string;
  rotulo: string;
  tipo:
    | "texto"
    | "numero"
    | "data"
    | "mes"
    | "textarea"
    | "selecao"
    | "booleano";
  obrigatorio?: boolean;
  opcoes?: OpcaoCampo[];
  /** Nome do campo do qual este depende — filtra as opções pelo valor dele. */
  dependeDe?: string;
  largura?: "metade" | "inteira";
  ajuda?: string;
  placeholder?: string;
  passo?: string;
  padrao?: string;
  secao?: string;
}

interface Props {
  titulo: string;
  recurso: string;
  campos: Campo[];
  aoFechar: () => void;
  aoConcluir: () => void;
  rotuloAcao?: string;
  descricao?: string;
}

/**
 * Formulário de criação dirigido por definição de campos.
 *
 * Quase toda tela do sistema precisa de um "novo registro" com a mesma
 * mecânica: montar o corpo, tratar erro por campo vindo do backend, desabilitar
 * o botão durante o envio. Descrever os campos em vez de escrever catorze
 * modais mantém esse comportamento idêntico em todos eles — inclusive as
 * mensagens de validação, que continuam sendo as do backend.
 */
export function ModalFormulario({
  titulo,
  recurso,
  campos,
  aoFechar,
  aoConcluir,
  rotuloAcao = "Salvar",
  descricao,
}: Props) {
  const [valores, setValores] = useState<Record<string, string | boolean>>(() => {
    const inicial: Record<string, string | boolean> = {};
    for (const campo of campos) {
      inicial[campo.nome] =
        campo.tipo === "booleano" ? campo.padrao === "true" : (campo.padrao ?? "");
    }
    return inicial;
  });

  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<Record<string, string[]>>({});

  const secoes = useMemo(() => {
    const agrupado = new Map<string, Campo[]>();
    for (const campo of campos) {
      const chave = campo.secao ?? "";
      agrupado.set(chave, [...(agrupado.get(chave) ?? []), campo]);
    }
    return [...agrupado.entries()];
  }, [campos]);

  function alterar(nome: string, valor: string | boolean) {
    setValores((atual) => {
      const proximo = { ...atual, [nome]: valor };
      // Trocar o pai invalida a escolha do filho — subcategoria de outra
      // categoria seria recusada pelo backend.
      for (const campo of campos) {
        if (campo.dependeDe === nome) proximo[campo.nome] = "";
      }
      return proximo;
    });
    setErrosCampo((atual) => {
      if (!atual[nome]) return atual;
      const proximo = { ...atual };
      delete proximo[nome];
      return proximo;
    });
  }

  function opcoesDe(campo: Campo): OpcaoCampo[] {
    if (!campo.opcoes) return [];
    if (!campo.dependeDe) return campo.opcoes;

    const valorPai = String(valores[campo.dependeDe] ?? "");
    if (!valorPai) return [];
    return campo.opcoes.filter((opcao) => opcao.pai === valorPai);
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    setErrosCampo({});
    setEnviando(true);

    // Campo vazio vira null: o backend distingue "não informado" de "".
    const corpo: Record<string, unknown> = {};
    for (const campo of campos) {
      const valor = valores[campo.nome];
      corpo[campo.nome] =
        typeof valor === "boolean" ? valor : valor === "" ? null : valor;
    }

    try {
      await api.criar(recurso, corpo);
      aoConcluir();
    } catch (falha) {
      if (falha instanceof ApiError) {
        setErroGeral(falha.message);
        setErrosCampo(falha.campos);
      } else {
        setErroGeral("Não foi possível salvar o registro.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={titulo} aoFechar={aoFechar}>
      <form onSubmit={enviar} className="space-y-4 px-5 py-4">
        {descricao && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {descricao}
          </p>
        )}

        {secoes.map(([nomeSecao, camposDaSecao]) => {
          const conteudo = (
            <div className="grid gap-3 sm:grid-cols-2">
              {camposDaSecao.map((campo) => (
                <CampoFormulario
                  key={campo.nome}
                  campo={campo}
                  valor={valores[campo.nome]}
                  opcoes={opcoesDe(campo)}
                  erro={errosCampo[campo.nome]?.[0]}
                  aoMudar={(valor) => alterar(campo.nome, valor)}
                />
              ))}
            </div>
          );

          if (!nomeSecao) return <div key="sem-secao">{conteudo}</div>;

          return (
            <fieldset
              key={nomeSecao}
              className="rounded-lg border border-slate-200 p-3"
            >
              <legend className="px-1 text-sm font-medium text-slate-600">
                {nomeSecao}
              </legend>
              {conteudo}
            </fieldset>
          );
        })}

        {erroGeral && (
          <p className="animate-surgir rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erroGeral}
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
            {enviando ? "Salvando..." : rotuloAcao}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CampoFormulario({
  campo,
  valor,
  opcoes,
  erro,
  aoMudar,
}: {
  campo: Campo;
  valor: string | boolean;
  opcoes: OpcaoCampo[];
  erro?: string;
  aoMudar: (valor: string | boolean) => void;
}) {
  const id = `campo-${campo.nome}`;
  const largura =
    campo.largura === "inteira" || campo.tipo === "textarea"
      ? "sm:col-span-2"
      : "";

  if (campo.tipo === "booleano") {
    return (
      <label
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm",
          largura,
        )}
      >
        <input
          type="checkbox"
          checked={Boolean(valor)}
          onChange={(e) => aoMudar(e.target.checked)}
          className="rounded border-slate-300 text-brand focus:ring-brand"
        />
        <span className="text-slate-700">{campo.rotulo}</span>
      </label>
    );
  }

  return (
    <div className={largura}>
      <label htmlFor={id} className="rotulo-campo">
        {campo.rotulo}
        {campo.obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {campo.tipo === "selecao" ? (
        <select
          id={id}
          value={String(valor)}
          onChange={(e) => aoMudar(e.target.value)}
          className="campo"
          required={campo.obrigatorio}
          disabled={Boolean(campo.dependeDe) && opcoes.length === 0}
          aria-invalid={Boolean(erro)}
        >
          <option value="">
            {campo.dependeDe && opcoes.length === 0
              ? "Escolha o campo anterior"
              : "Selecione..."}
          </option>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      ) : campo.tipo === "textarea" ? (
        <textarea
          id={id}
          value={String(valor)}
          onChange={(e) => aoMudar(e.target.value)}
          rows={3}
          className="campo"
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          aria-invalid={Boolean(erro)}
        />
      ) : (
        <input
          id={id}
          type={
            campo.tipo === "numero"
              ? "number"
              : campo.tipo === "data"
                ? "date"
                : campo.tipo === "mes"
                  ? "month"
                  : "text"
          }
          step={campo.passo}
          value={String(valor)}
          onChange={(e) => aoMudar(e.target.value)}
          className="campo"
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          aria-invalid={Boolean(erro)}
        />
      )}

      {erro ? (
        <p className="mt-1 text-xs text-red-600">{erro}</p>
      ) : campo.ajuda ? (
        <p className="mt-1 text-xs text-slate-400">{campo.ajuda}</p>
      ) : null}
    </div>
  );
}
