import type { Config } from "tailwindcss";

/**
 * Paleta derivada do protótipo: sidebar escura, verde como cor de ação e de
 * entrada, vermelho para saída/vencido, âmbar para alerta.
 *
 * As animações são curtas de propósito. Este é um sistema de uso diário, em
 * que a pessoa relê a mesma tabela dezenas de vezes por dia — movimento longo
 * vira atrito. Nada aqui passa de 400 ms.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          active: "#134e4a",
          text: "#94a3b8",
        },
        brand: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#d1fae5",
        },
        entrada: "#10b981",
        saida: "#ef4444",
        alerta: "#f59e0b",
        neutro: "#3b82f6",
        roxo: "#8b5cf6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        // Desaceleração suave: rápido no início, assenta no fim.
        saida: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        surgir: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        aparecer: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        ampliar: {
          from: { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        brilho: {
          "100%": { transform: "translateX(100%)" },
        },
        pulsarAlerta: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      /*
       * `backwards`, e não `both`, em tudo que anima `transform`.
       *
       * `both` mantém o último quadro aplicado para sempre — e o último quadro
       * de `surgir`/`ampliar` é `translateY(0)`, um transform identidade. Só que
       * transform identidade ainda é transform: o elemento vira bloco de
       * contenção de descendentes `position: fixed` e abre um novo contexto de
       * empilhamento. Como `template.tsx` embrulha toda página em
       * `animate-surgir`, isso quebrava qualquer overlay fixo dentro da página.
       *
       * `backwards` preenche só o quadro inicial durante o atraso — que é o que
       * a cascata precisa — e solta o elemento quando a animação termina. O
       * resultado visual é idêntico: `to` já é o estado natural do elemento.
       */
      animation: {
        surgir: "surgir 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards",
        aparecer: "aparecer 0.2s ease-out both",
        ampliar: "ampliar 0.22s cubic-bezier(0.16, 1, 0.3, 1) backwards",
        brilho: "brilho 1.4s infinite",
        "pulsar-alerta": "pulsarAlerta 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
