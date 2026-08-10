"use client";

import { usePathname } from "next/navigation";

import { ROTA_LOGIN, useAuth } from "@/lib/auth/contexto";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Decide o que envolve a página: a tela de login não tem menu nem barra
 * superior, e o resto do sistema não existe sem sessão.
 *
 * A guarda é aqui, e não dentro de cada página, porque só assim uma tela nova
 * nasce protegida. E enquanto a sessão não foi confirmada, `children` sequer é
 * montado — sem isso as páginas dispararíam as suas requisições antes de haver
 * sessão, tomariam 403 e piscariam o estado de erro no caminho para o login.
 */
export function Aplicacao({ children }: { children: React.ReactNode }) {
  const { estado } = useAuth();
  const caminho = usePathname();

  if (caminho === ROTA_LOGIN) return <>{children}</>;

  if (estado !== "autenticado") return <TelaDeEspera />;

  return (
    <>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        {/*
          É este container que rola, não o <body> — que fica `overflow-hidden`
          para segurar o shell. O atributo marca isso para quem precisa travar
          a rolagem do fundo (o Modal), sem ter que adivinhar a estrutura.
        */}
        <div data-rolagem-principal className="flex-1 overflow-y-auto">
          <main className="px-6 py-6 lg:px-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-400 lg:px-8">
            ERP Financeiro Web © {new Date().getFullYear()} R&amp;S Serviços Ltda.
          </footer>
        </div>
      </div>
    </>
  );
}

/** Ponte entre abrir a página e saber se há sessão. Dura um request. */
function TelaDeEspera() {
  return (
    <div
      className="flex flex-1 items-center justify-center"
      role="status"
      aria-label="Verificando sessão"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
    </div>
  );
}
