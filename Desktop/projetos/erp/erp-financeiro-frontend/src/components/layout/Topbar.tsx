"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Building2, LogOut } from "lucide-react";

import { useAuth } from "@/lib/auth/contexto";
import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Titulo } from "@/lib/api/tipos";
import { moeda } from "@/lib/format";
import { GRUPOS_MENU } from "./navegacao";
import { MenuNovoLancamento } from "./MenuNovoLancamento";
import { cn } from "@/lib/utils";

/** Descobre em que grupo e página o usuário está, a partir da rota. */
function localizar(caminho: string): { grupo: string; pagina: string } {
  if (caminho === "/") return { grupo: "Sistema Financeiro", pagina: "Dashboard" };

  for (const grupo of GRUPOS_MENU) {
    const item = grupo.itens.find((i) => caminho.startsWith(i.href));
    if (item) return { grupo: grupo.rotulo, pagina: item.rotulo };
  }
  return { grupo: "Sistema Financeiro", pagina: "" };
}

export function Topbar() {
  const caminho = usePathname();
  const router = useRouter();
  const { grupo, pagina } = localizar(caminho);

  const [avisosAbertos, setAvisosAbertos] = useState(false);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);

  // O sino mostra o que realmente exige ação: títulos vencidos dos dois lados.
  const receber = useRequisicao(() =>
    api.listar<Titulo>("contas-receber", { vencido: true, page_size: 5 }),
  );
  const pagar = useRequisicao(() =>
    api.listar<Titulo>("contas-pagar", { vencido: true, page_size: 5 }),
  );

  const totalVencidos = (receber.dados?.count ?? 0) + (pagar.dados?.count ?? 0);

  return (
    <>
      <header className="z-40 shrink-0 border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-8">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            <Link
              href="/"
              className="text-slate-500 transition-colors hover:text-slate-700"
            >
              R&amp;S Serviços
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{grupo}</span>
            {pagina && pagina !== grupo && (
              <>
                <span className="hidden text-slate-300 sm:inline">/</span>
                <span className="hidden text-slate-500 sm:inline">{pagina}</span>
              </>
            )}

          </nav>

          <div className="flex items-center gap-2">
            <MenuNovoLancamento
              aoCriar={(mensagem) => {
                setConfirmacao(mensagem);
                // A tela atual pode estar listando o que acabou de ser criado.
                router.refresh();
                receber.recarregar();
                pagar.recarregar();
                setTimeout(() => setConfirmacao(null), 4000);
              }}
            />

            <PainelAvisos
              aberto={avisosAbertos}
              aoAlternar={() => setAvisosAbertos((v) => !v)}
              aoFechar={() => setAvisosAbertos(false)}
              total={totalVencidos}
              aReceber={receber.dados?.results ?? []}
              aPagar={pagar.dados?.results ?? []}
              aoNavegar={(destino) => {
                setAvisosAbertos(false);
                router.push(destino);
              }}
            />

            <MenuUsuario />
          </div>
        </div>

        {confirmacao && (
          <div className="animate-surgir border-t border-emerald-100 bg-emerald-50 px-6 py-2 text-sm text-emerald-800 lg:px-8">
            {confirmacao}
          </div>
        )}
      </header>

    </>
  );
}

/**
 * Quem está logado e como sair.
 *
 * Ocupa o lugar do antigo selo "Sem autenticação" — que existia justamente para
 * denunciar que a API estava aberta enquanto V6 não fosse decidido.
 */
function MenuUsuario() {
  const { usuario, sair } = useAuth();
  const [saindo, setSaindo] = useState(false);

  if (!usuario) return null;

  const iniciais = usuario.nome_exibicao
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                   bg-brand-light text-xs font-bold text-brand-dark"
        aria-hidden
      >
        {iniciais}
      </span>
      <span className="hidden text-sm font-medium text-slate-700 sm:inline">
        {usuario.nome_exibicao}
      </span>
      <button
        type="button"
        onClick={async () => {
          setSaindo(true);
          await sair();
        }}
        disabled={saindo}
        title="Sair"
        aria-label="Sair"
        className="rounded-md p-1.5 text-slate-400 transition-colors duration-200
                   hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function PainelAvisos({
  aberto,
  aoAlternar,
  aoFechar,
  total,
  aReceber,
  aPagar,
  aoNavegar,
}: {
  aberto: boolean;
  aoAlternar: () => void;
  aoFechar: () => void;
  total: number;
  aReceber: Titulo[];
  aPagar: Titulo[];
  aoNavegar: (destino: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (evento: MouseEvent) => {
      if (!containerRef.current?.contains(evento.target as Node)) aoFechar();
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, aoFechar]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        aria-label={
          total > 0 ? `${total} título(s) vencido(s)` : "Sem pendências"
        }
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
      </button>

      {aberto && (
        <div
          className="animate-ampliar absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden
                     rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="font-semibold text-slate-900">Pendências</p>
            <p className="text-xs text-slate-500">
              {total === 0
                ? "Nenhum título vencido."
                : `${total} título(s) vencido(s).`}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <Secao
              rotulo="A receber vencidos"
              titulos={aReceber}
              cor="text-emerald-600"
              aoAbrir={() => aoNavegar("/financeiro/cobrancas")}
            />
            <Secao
              rotulo="A pagar vencidos"
              titulos={aPagar}
              cor="text-red-600"
              aoAbrir={() => aoNavegar("/financeiro/contas-pagar")}
            />

            {total === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Tudo em dia por aqui.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Secao({
  rotulo,
  titulos,
  cor,
  aoAbrir,
}: {
  rotulo: string;
  titulos: Titulo[];
  cor: string;
  aoAbrir: () => void;
}) {
  if (!titulos.length) return null;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <p className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        {rotulo}
      </p>
      {titulos.map((titulo) => (
        <button
          key={titulo.id}
          type="button"
          onClick={aoAbrir}
          className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left
                     transition-colors hover:bg-slate-50"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm text-slate-700">
              {titulo.parceiro_nome}
            </span>
            <span className="block text-xs text-slate-400">
              {titulo.numero_documento} · {titulo.dias_atraso} dias
            </span>
          </span>
          <span className={cn("shrink-0 text-sm font-medium tabular-nums", cor)}>
            {moeda(titulo.valor)}
          </span>
        </button>
      ))}
    </div>
  );
}
