"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

/**
 * Diálogo modal.
 *
 * Além da animação (fundo esmaece, painel entra crescendo), cuida do que um
 * modal precisa para ser usável no teclado: fecha no Esc, devolve o foco ao
 * abrir e trava a rolagem do fundo enquanto está aberto.
 *
 * **É renderizado por portal em `document.body`, e isso não é preferência.**
 * `position: fixed` se resolve contra o viewport apenas enquanto nenhum
 * ancestral tiver `transform`, `filter`, `perspective`, `contain` ou
 * `will-change` — qualquer um deles vira o bloco de contenção do elemento fixo.
 * Renderizado dentro da árvore da página, o `inset-0` passava a valer a caixa do
 * conteúdo, e não a tela: o fundo escurecia só o miolo, e o painel (`90vh`,
 * medido contra o viewport) vazava para fora do container, levando a barra de
 * título e o botão de fechar para cima da borda da tela. No portal o modal fica
 * imune ao que a página faça com os seus próprios elementos.
 */
export function Modal({ titulo, aoFechar, children }: Props) {
  const painelRef = useRef<HTMLDivElement>(null);
  const [montado, setMontado] = useState(false);

  // `document` não existe na renderização do servidor; o portal só pode ser
  // criado depois da montagem no cliente.
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!montado) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };

    document.addEventListener("keydown", aoTeclar);

    // O shell do layout já deixa <body> com `overflow: hidden` e rola num
    // container interno — travar o body de novo não teria efeito nenhum. Quem
    // precisa ser travado é o container que de fato rola.
    const rolador =
      document.querySelector<HTMLElement>("[data-rolagem-principal]") ??
      document.body;
    const rolagemAnterior = rolador.style.overflow;
    rolador.style.overflow = "hidden";

    // Leva o foco para dentro do diálogo, senão o teclado continua na página.
    painelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      rolador.style.overflow = rolagemAnterior;
    };
  }, [aoFechar, montado]);

  if (!montado) return null;

  return createPortal(
    <div
      className="animate-aparecer fixed inset-0 z-50 flex items-center justify-center
                 bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(evento) => {
        // Só fecha se o clique começou no fundo — arrastar uma seleção de
        // dentro para fora não deve descartar o formulário.
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        tabIndex={-1}
        className="animate-ampliar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl
                   bg-white shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="titulo-modal" className="font-semibold text-slate-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-md p-1 text-slate-400 transition-all duration-200
                       hover:rotate-90 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
