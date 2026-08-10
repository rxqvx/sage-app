"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/** Botão de criação padrão das telas de listagem. */
export function BotaoNovo({
  rotulo,
  aoClicar,
}: {
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button type="button" onClick={aoClicar} className="botao-primario">
      <Plus className="h-4 w-4" />
      {rotulo}
    </button>
  );
}

/**
 * Estado de abertura do formulário de criação.
 *
 * Toda tela de listagem repete o mesmo trio — abrir, fechar e recarregar ao
 * concluir. Concentrar aqui evita reescrever isso em cada página.
 */
export function useCriacao(aoConcluir: () => void) {
  const [aberto, setAberto] = useState(false);

  return {
    aberto,
    abrir: () => setAberto(true),
    fechar: () => setAberto(false),
    concluir: () => {
      setAberto(false);
      aoConcluir();
    },
  };
}
