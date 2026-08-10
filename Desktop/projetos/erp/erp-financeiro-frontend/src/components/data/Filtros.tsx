"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface BarraProps {
  children?: ReactNode;
}

/** Faixa de filtros exibida entre os indicadores e a tabela. */
export function BarraFiltros({ children }: BarraProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function CampoBusca({
  valor,
  aoMudar,
  placeholder = "Buscar...",
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

export function Selecao({
  valor,
  aoMudar,
  opcoes,
  rotuloVazio = "Todos",
  rotulo,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: Opcao[];
  rotuloVazio?: string;
  rotulo?: string;
}) {
  return (
    <select
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value)}
      aria-label={rotulo ?? rotuloVazio}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
    >
      <option value="">{rotuloVazio}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

export function CampoData({
  valor,
  aoMudar,
  rotulo,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  rotulo: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-500">
      {rotulo}
      <input
        type="date"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}

/** Par início/fim usado por todos os relatórios. */
export function FiltroPeriodo({
  inicio,
  fim,
  aoMudarInicio,
  aoMudarFim,
}: {
  inicio: string;
  fim: string;
  aoMudarInicio: (valor: string) => void;
  aoMudarFim: (valor: string) => void;
}) {
  return (
    <>
      <CampoData valor={inicio} aoMudar={aoMudarInicio} rotulo="De" />
      <CampoData valor={fim} aoMudar={aoMudarFim} rotulo="Até" />
    </>
  );
}
