"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  DollarSign,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ModalNovoLancamento } from "@/components/financeiro/ModalNovoLancamento";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { camposTitulo } from "@/components/financeiro/camposTitulo";
import { useOpcoes } from "@/lib/api/opcoes";
import { cn } from "@/lib/utils";

type Acao = "entrada" | "saida" | "pagar" | "receber";

interface OpcaoMenu {
  acao: Acao;
  rotulo: string;
  descricao: string;
  icone: LucideIcon;
  /** Cor do ícone — mesma semântica usada nas tabelas e nos gráficos. */
  cores: string;
}

/**
 * As quatro portas de entrada de dinheiro no sistema.
 *
 * Entrada e saída caem direto no caixa; contas a pagar e a receber são
 * títulos por competência, que só viram caixa quando baixados. A descrição de
 * cada opção diz isso, porque é a dúvida real de quem vai lançar.
 */
const OPCOES: OpcaoMenu[] = [
  {
    acao: "entrada",
    rotulo: "Nova Entrada",
    descricao: "Recebimento direto no caixa",
    icone: TrendingUp,
    cores: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  },
  {
    acao: "saida",
    rotulo: "Nova Saída",
    descricao: "Pagamento direto do caixa",
    icone: TrendingDown,
    cores: "bg-red-50 text-red-600 group-hover:bg-red-100",
  },
  {
    acao: "pagar",
    rotulo: "Nova Conta a Pagar",
    descricao: "Título com vencimento futuro",
    icone: Receipt,
    cores: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  },
  {
    acao: "receber",
    rotulo: "Nova Conta a Receber",
    descricao: "Cobrança com vencimento futuro",
    icone: DollarSign,
    cores: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  },
];

export function MenuNovoLancamento({ aoCriar }: { aoCriar: (mensagem: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [acaoAtiva, setAcaoAtiva] = useState<Acao | null>(null);
  const [indiceFocado, setIndiceFocado] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);
  const opcoes = useOpcoes();

  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (evento: MouseEvent) => {
      if (!containerRef.current?.contains(evento.target as Node)) setAberto(false);
    };

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  // Navegação por teclado: setas percorrem, Esc fecha.
  function aoTeclar(evento: React.KeyboardEvent) {
    if (evento.key === "Escape") {
      setAberto(false);
      return;
    }
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      const passo = evento.key === "ArrowDown" ? 1 : -1;
      const proximo = (indiceFocado + passo + OPCOES.length) % OPCOES.length;
      setIndiceFocado(proximo);
      itensRef.current[proximo]?.focus();
    }
  }

  function abrir(acao: Acao) {
    setAberto(false);
    setAcaoAtiva(acao);
  }

  function concluir(mensagem: string) {
    setAcaoAtiva(null);
    aoCriar(mensagem);
  }

  return (
    <>
      <div ref={containerRef} className="relative" onKeyDown={aoTeclar}>
        <button
          type="button"
          onClick={() => {
            setAberto((v) => !v);
            setIndiceFocado(0);
          }}
          aria-expanded={aberto}
          aria-haspopup="menu"
          className="botao-primario"
        >
          <Plus className="h-4 w-4" />
          Novo Lançamento
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300 ease-saida",
              aberto && "rotate-180",
            )}
          />
        </button>

        {aberto && (
          <div
            role="menu"
            aria-label="Tipos de lançamento"
            className="animate-ampliar absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden
                       rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {OPCOES.map((opcao, indice) => {
              const Icone = opcao.icone;
              return (
                <button
                  key={opcao.acao}
                  ref={(elemento) => {
                    itensRef.current[indice] = elemento;
                  }}
                  type="button"
                  role="menuitem"
                  onClick={() => abrir(opcao.acao)}
                  style={{ "--indice": indice } as React.CSSProperties}
                  className="animate-surgir cascata-rapida group flex w-full items-center gap-3
                             rounded-lg px-3 py-2.5 text-left transition-colors duration-150
                             hover:bg-slate-50 focus:bg-slate-50"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      "transition-all duration-200 group-hover:scale-110",
                      opcao.cores,
                    )}
                  >
                    <Icone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">
                      {opcao.rotulo}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {opcao.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {(acaoAtiva === "entrada" || acaoAtiva === "saida") && (
        <ModalNovoLancamento
          tipoFixo={acaoAtiva === "entrada" ? 1 : 2}
          aoFechar={() => setAcaoAtiva(null)}
          aoConcluir={() =>
            concluir(
              acaoAtiva === "entrada"
                ? "Entrada registrada no caixa."
                : "Saída registrada no caixa.",
            )
          }
        />
      )}

      {(acaoAtiva === "pagar" || acaoAtiva === "receber") && (
        <ModalFormulario
          titulo={
            acaoAtiva === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber"
          }
          recurso={acaoAtiva === "pagar" ? "contas-pagar" : "contas-receber"}
          campos={camposTitulo(acaoAtiva, opcoes)}
          descricao="O título entra por competência. Ele só afeta o saldo quando for baixado."
          rotuloAcao="Salvar título"
          aoFechar={() => setAcaoAtiva(null)}
          aoConcluir={() =>
            concluir(
              acaoAtiva === "pagar"
                ? "Conta a pagar registrada."
                : "Conta a receber registrada.",
            )
          }
        />
      )}
    </>
  );
}
