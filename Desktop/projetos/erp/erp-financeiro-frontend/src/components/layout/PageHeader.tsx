import type { ReactNode } from "react";
import * as Icones from "lucide-react";

interface Props {
  titulo: string;
  subtitulo?: string;
  icone?: string;
  acoes?: ReactNode;
}

/**
 * Cabeçalho padrão das páginas: ícone + título + subtítulo à esquerda e as
 * ações principais à direita, como no protótipo.
 */
export function PageHeader({ titulo, subtitulo, icone, acoes }: Props) {
  const Icone = icone
    ? (Icones as unknown as Record<string, Icones.LucideIcon>)[icone]
    : null;

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icone && (
          <span
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl
                       bg-brand-light text-brand-dark"
          >
            <Icone className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>
          )}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
