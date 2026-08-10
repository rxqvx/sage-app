/**
 * `template.tsx` remonta a cada navegação — diferente de `layout.tsx`, que
 * persiste. É isso que faz a animação de entrada tocar de novo a cada troca de
 * tela, dando continuidade à navegação sem precisar de biblioteca.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-surgir">{children}</div>;
}
