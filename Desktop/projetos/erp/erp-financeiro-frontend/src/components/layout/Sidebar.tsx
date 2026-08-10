"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Icones from "lucide-react";

import { GRUPOS_MENU } from "./navegacao";
import { cn } from "@/lib/utils";

function Icone({ nome, className }: { nome: string; className?: string }) {
  const Componente = (Icones as unknown as Record<string, Icones.LucideIcon>)[nome];
  if (!Componente) return null;
  return <Componente className={className} />;
}

export function Sidebar() {
  const caminho = usePathname();

  // O grupo que contém a página atual já começa aberto.
  const [abertos, setAbertos] = useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {};
    for (const grupo of GRUPOS_MENU) {
      inicial[grupo.rotulo] = grupo.itens.some((item) =>
        caminho.startsWith(item.href),
      );
    }
    if (!Object.values(inicial).some(Boolean)) inicial.Financeiro = true;
    return inicial;
  });

  function alternar(rotulo: string) {
    setAbertos((atual) => ({ ...atual, [rotulo]: !atual[rotulo] }));
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-text">
      <Link
        href="/"
        className="group flex items-center gap-3 border-b border-white/5 px-5 py-5"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold
                     text-white transition-transform duration-300 ease-saida group-hover:scale-105"
        >
          R$
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-wide text-white">
            ERP FINANCEIRO
          </span>
          <span className="block text-xs text-sidebar-text">
            R&amp;S Serviços Ltda
          </span>
        </span>
      </Link>

      <nav className="flex-1 px-3 py-4">
        <ItemNavegacao
          href="/"
          icone="LayoutDashboard"
          rotulo="Dashboard"
          ativo={caminho === "/"}
        />

        {GRUPOS_MENU.map((grupo) => {
          const aberto = abertos[grupo.rotulo];
          const contemAtual = grupo.itens.some((item) =>
            caminho.startsWith(item.href),
          );

          return (
            <div key={grupo.rotulo} className="mb-1">
              <button
                type="button"
                onClick={() => alternar(grupo.rotulo)}
                aria-expanded={aberto}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-colors duration-200",
                  contemAtual
                    ? "text-brand"
                    : "text-slate-300 hover:bg-sidebar-hover hover:text-white",
                )}
              >
                <Icone nome={grupo.icone} className="h-4 w-4" />
                <span className="flex-1 text-left">{grupo.rotulo}</span>
                <Icones.ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300 ease-saida",
                    aberto && "rotate-180",
                  )}
                />
              </button>

              {/* Colapso animado: o conteúdo fica sempre no DOM e o grid
                  interpola a altura, então abrir e fechar são simétricos. */}
              <div className={cn("colapso", aberto && "colapso-aberto")}>
                <div>
                  <div className="colapso-conteudo mt-0.5 space-y-0.5 pb-1">
                    {grupo.itens.map((item, indice) => (
                      <div
                        key={item.href}
                        className="colapso-item"
                        style={{ "--indice": indice } as React.CSSProperties}
                      >
                        <ItemNavegacao
                          href={item.href}
                          icone={item.icone}
                          rotulo={item.rotulo}
                          ativo={caminho.startsWith(item.href)}
                          recuado
                          tabIndex={aberto ? 0 : -1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-5 py-4 text-xs text-slate-500">
        ERP Financeiro Web · v1.0.0
      </div>
    </aside>
  );
}

function ItemNavegacao({
  href,
  icone,
  rotulo,
  ativo,
  recuado,
  tabIndex,
}: {
  href: string;
  icone: string;
  rotulo: string;
  ativo: boolean;
  recuado?: boolean;
  tabIndex?: number;
}) {
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg text-sm",
        "transition-all duration-200 ease-saida",
        recuado ? "py-2 pl-9 pr-3" : "mb-2 px-3 py-2.5 font-medium",
        ativo
          ? "bg-brand/15 font-medium text-brand"
          : "text-slate-400 hover:translate-x-0.5 hover:bg-sidebar-hover hover:text-white",
      )}
    >
      {/* Marcador do item ativo, que cresce a partir do centro. */}
      <span
        className={cn(
          "absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r bg-brand",
          "transition-all duration-300 ease-saida",
          ativo ? "h-5 opacity-100" : "h-0 opacity-0",
        )}
      />
      <Icone nome={icone} className="h-4 w-4 shrink-0" />
      <span className="truncate">{rotulo}</span>
    </Link>
  );
}
