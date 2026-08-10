"use client";

import type { CSSProperties, ReactNode } from "react";
import * as Icones from "lucide-react";

import { cn } from "@/lib/utils";
import { useContador } from "@/lib/animacao";
import { moeda, paraNumero } from "@/lib/format";

/** Atalho para o atraso em cascata das listas. */
function passo(indice: number): CSSProperties {
  return { "--indice": indice } as CSSProperties;
}

/* -------------------------------------------------------------------------
 * Cards de indicadores — a faixa que aparece acima da tabela em toda tela.
 * ---------------------------------------------------------------------- */

export type CorIndicador =
  | "verde"
  | "vermelho"
  | "ambar"
  | "azul"
  | "roxo"
  | "neutro";

const CORES: Record<CorIndicador, string> = {
  verde: "text-emerald-600",
  vermelho: "text-red-600",
  ambar: "text-amber-600",
  azul: "text-blue-600",
  roxo: "text-violet-600",
  neutro: "text-slate-900",
};

const CORES_ICONE: Record<CorIndicador, string> = {
  verde: "bg-emerald-50 text-emerald-600",
  vermelho: "bg-red-50 text-red-600",
  ambar: "bg-amber-50 text-amber-600",
  azul: "bg-blue-50 text-blue-600",
  roxo: "bg-violet-50 text-violet-600",
  neutro: "bg-slate-100 text-slate-500",
};

export interface Indicador {
  rotulo: string;
  valor: string;
  descricao?: string;
  cor?: CorIndicador;
  icone?: string;
  destaque?: boolean;
}

/**
 * Valor monetário que conta até o número final.
 *
 * Só entra em ação quando o texto recebido é de fato uma moeda formatada —
 * contadores de "3 contas" ou "22 dias" ficariam estranhos animando.
 */
function ValorAnimado({ texto, className }: { texto: string; className?: string }) {
  const ehMoeda = texto.trim().startsWith("R$");
  const destino = ehMoeda
    ? paraNumero(texto.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", "."))
    : 0;
  const atual = useContador(ehMoeda ? destino : 0);

  return (
    <p className={className}>{ehMoeda ? moeda(atual) : texto}</p>
  );
}

export function CardsIndicadores({ indicadores }: { indicadores: Indicador[] }) {
  if (!indicadores.length) return null;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {indicadores.map((indicador, indice) => {
        const Icone = indicador.icone
          ? (Icones as unknown as Record<string, Icones.LucideIcon>)[
              indicador.icone
            ]
          : null;
        const cor = indicador.cor ?? "neutro";

        return (
          <div
            key={indicador.rotulo}
            style={passo(indice)}
            className={cn(
              "cartao-interativo animate-surgir cascata p-5",
              indicador.destaque && "border-red-200 bg-red-50/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-slate-500">{indicador.rotulo}</span>
              {Icone && (
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "transition-transform duration-300 ease-saida",
                    CORES_ICONE[cor],
                    indicador.destaque && "animate-pulsar-alerta",
                  )}
                >
                  <Icone className="h-4 w-4" />
                </span>
              )}
            </div>

            <ValorAnimado
              texto={indicador.valor}
              className={cn(
                "mt-2 text-2xl font-bold tabular-nums transition-colors",
                CORES[cor],
              )}
            />

            {indicador.descricao && (
              <p className="mt-1 text-xs text-slate-400">{indicador.descricao}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Estados de tela
 * ---------------------------------------------------------------------- */

export function EstadoCarregando({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="Carregando">
      {Array.from({ length: linhas }).map((_, indice) => (
        <div
          key={indice}
          style={passo(indice)}
          className="esqueleto animate-aparecer cascata-rapida h-11"
        />
      ))}
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
}

export function EstadoVazio({
  titulo = "Nenhum registro encontrado",
  descricao,
  acao,
}: {
  titulo?: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="animate-surgir flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Icones.Inbox className="h-6 w-6 text-slate-400" />
      </span>
      <p className="font-medium text-slate-700">{titulo}</p>
      {descricao && (
        <p className="mt-1 max-w-md text-sm text-slate-500">{descricao}</p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function EstadoErro({
  mensagem,
  aoTentarNovamente,
}: {
  mensagem: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <div className="animate-surgir flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <Icones.AlertCircle className="h-6 w-6 text-red-500" />
      </span>
      <p className="font-medium text-slate-700">
        Não foi possível carregar os dados
      </p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{mensagem}</p>
      {aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="botao-secundario mt-4"
        >
          <Icones.RotateCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Tabela
 * ---------------------------------------------------------------------- */

export interface Coluna<T> {
  chave: string;
  cabecalho: string;
  alinhamento?: "esquerda" | "direita" | "centro";
  larguraMinima?: string;
  render: (registro: T) => ReactNode;
}

interface TabelaProps<T> {
  colunas: Coluna<T>[];
  registros: T[];
  chave: (registro: T) => string | number;
  carregando?: boolean;
  erro?: string | null;
  aoTentarNovamente?: () => void;
  vazio?: { titulo?: string; descricao?: string; acao?: ReactNode };
  rodape?: ReactNode;
  titulo?: string;
}

const ALINHAMENTO = {
  esquerda: "text-left",
  direita: "text-right",
  centro: "text-center",
} as const;

export function Tabela<T>({
  colunas,
  registros,
  chave,
  carregando,
  erro,
  aoTentarNovamente,
  vazio,
  rodape,
  titulo,
}: TabelaProps<T>) {
  return (
    <div className="cartao overflow-hidden">
      {titulo && (
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{titulo}</h2>
        </div>
      )}

      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} aoTentarNovamente={aoTentarNovamente} />
      ) : registros.length === 0 ? (
        <EstadoVazio {...vazio} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                {colunas.map((coluna) => (
                  <th
                    key={coluna.chave}
                    style={{ minWidth: coluna.larguraMinima }}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 font-medium text-slate-500",
                      ALINHAMENTO[coluna.alinhamento ?? "esquerda"],
                    )}
                  >
                    {coluna.cabecalho}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((registro, indice) => (
                <tr
                  key={chave(registro)}
                  // A cascata só vale para as primeiras linhas: em uma tabela
                  // de 100 registros, escalonar todas faria a última aparecer
                  // segundos depois da primeira.
                  style={indice < 15 ? passo(indice) : undefined}
                  className={cn(
                    "transition-colors duration-150 hover:bg-slate-50",
                    indice < 15 && "animate-surgir cascata-rapida",
                  )}
                >
                  {colunas.map((coluna) => (
                    <td
                      key={coluna.chave}
                      className={cn(
                        "px-4 py-3 text-slate-700",
                        ALINHAMENTO[coluna.alinhamento ?? "esquerda"],
                      )}
                    >
                      {coluna.render(registro)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {rodape && <tfoot className="bg-slate-50">{rodape}</tfoot>}
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Células
 * ---------------------------------------------------------------------- */

/** Valor monetário: verde para positivo, vermelho para negativo. */
export function Dinheiro({
  valor,
  colorir = false,
  forcarCor,
}: {
  valor: string | number | null | undefined;
  colorir?: boolean;
  forcarCor?: "verde" | "vermelho";
}) {
  const numero = paraNumero(valor);
  const cor = forcarCor
    ? forcarCor === "verde"
      ? "text-emerald-600"
      : "text-red-600"
    : colorir
      ? numero > 0
        ? "text-emerald-600"
        : numero < 0
          ? "text-red-600"
          : "text-slate-700"
      : "text-slate-700";

  return (
    <span className={cn("font-medium tabular-nums", cor)}>{moeda(numero)}</span>
  );
}

const ESTILO_BADGE: Record<string, string> = {
  verde: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  vermelho: "bg-red-50 text-red-700 ring-red-600/20",
  ambar: "bg-amber-50 text-amber-700 ring-amber-600/20",
  azul: "bg-blue-50 text-blue-700 ring-blue-600/20",
  roxo: "bg-violet-50 text-violet-700 ring-violet-600/20",
  cinza: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export type CorBadge = keyof typeof ESTILO_BADGE;

export function Badge({
  children,
  cor = "cinza",
}: {
  children: ReactNode;
  cor?: CorBadge;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        "transition-transform duration-200 hover:scale-105",
        ESTILO_BADGE[cor],
      )}
    >
      {children}
    </span>
  );
}

/** Cor do badge a partir do status textual usado no backend. */
export function corDoStatus(status: string): CorBadge {
  const normalizado = status.toLowerCase();
  if (["paga", "recebida", "liquidada", "conciliado", "ativo", "emitida"].includes(normalizado))
    return "verde";
  if (["vencida", "cancelada", "inativo"].includes(normalizado)) return "vermelho";
  if (["aberta", "pendente"].includes(normalizado)) return "azul";
  if (["estornada", "ignorado"].includes(normalizado)) return "ambar";
  return "cinza";
}
