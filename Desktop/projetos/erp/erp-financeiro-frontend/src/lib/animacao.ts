"use client";

import { useEffect, useRef, useState } from "react";

/** Lê a preferência do sistema e reage se ela mudar durante a sessão. */
export function usePrefereMenosMovimento(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzido(consulta.matches);

    const aoMudar = (evento: MediaQueryListEvent) => setReduzido(evento.matches);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  return reduzido;
}

/**
 * Anima um número do valor anterior até o atual.
 *
 * Curto de propósito (350 ms): o objetivo é dar a sensação de que o dado
 * chegou, não fazer a pessoa esperar para ler um saldo. Quem pediu menos
 * movimento recebe o valor final direto, sem contagem.
 */
export function useContador(destino: number, duracao = 350): number {
  const semMovimento = usePrefereMenosMovimento();
  const [valor, setValor] = useState(destino);
  const anteriorRef = useRef(destino);
  const quadroRef = useRef<number | null>(null);

  useEffect(() => {
    if (semMovimento || !Number.isFinite(destino)) {
      anteriorRef.current = destino;
      setValor(destino);
      return;
    }

    const inicio = anteriorRef.current;
    const diferenca = destino - inicio;

    if (diferenca === 0) {
      setValor(destino);
      return;
    }

    const comeco = performance.now();

    const passo = (agora: number) => {
      const progresso = Math.min((agora - comeco) / duracao, 1);
      // easeOutCubic: chega rápido perto do valor final e assenta.
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setValor(inicio + diferenca * suavizado);

      if (progresso < 1) {
        quadroRef.current = requestAnimationFrame(passo);
      } else {
        anteriorRef.current = destino;
      }
    };

    quadroRef.current = requestAnimationFrame(passo);

    return () => {
      if (quadroRef.current !== null) cancelAnimationFrame(quadroRef.current);
      // Sem isto, uma troca de filtro no meio da animação faria a próxima
      // contagem partir de um valor intermediário.
      anteriorRef.current = destino;
    };
  }, [destino, duracao, semMovimento]);

  return valor;
}
