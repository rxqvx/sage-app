"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "./client";

interface Estado<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
}

/**
 * Executa um carregamento assíncrono e devolve os três estados que toda tela
 * precisa tratar: carregando, erro e vazio.
 *
 * `dependencias` funciona como no useEffect — mudou o filtro, recarrega.
 */
export function useRequisicao<T>(
  carregar: () => Promise<T>,
  dependencias: unknown[] = [],
): Estado<T> & { recarregar: () => void } {
  const [estado, setEstado] = useState<Estado<T>>({
    dados: null,
    carregando: true,
    erro: null,
  });
  const [gatilho, setGatilho] = useState(0);

  const recarregar = useCallback(() => setGatilho((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));

    carregar()
      .then((dados) => {
        // Evita que uma resposta antiga sobrescreva a atual quando o usuário
        // troca o filtro rapidamente.
        if (!cancelado) setEstado({ dados, carregando: false, erro: null });
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        const mensagem =
          erro instanceof ApiError
            ? erro.message
            : "Erro inesperado ao carregar os dados.";
        setEstado({ dados: null, carregando: false, erro: mensagem });
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, gatilho]);

  return { ...estado, recarregar };
}
