/**
 * Cliente HTTP único do projeto.
 *
 * Toda a comunicação com o backend passa por aqui: um só lugar sabe a base
 * URL, o formato de erro `{ "error": true, "detail": ... }` e o formato de
 * paginação do DRF. As páginas nunca chamam `fetch` diretamente.
 */

/**
 * Caminho relativo, de propósito: o navegador nunca fala com o Django direto.
 * Quem fala é o Route Handler em `app/api/erp/[...path]`, que anexa o token do
 * cookie httpOnly. Consequências de ser mesma origem: não há CORS, e nenhuma
 * credencial precisa existir no bundle.
 */
const BASE_URL = "/api/erp";

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Filtros = Record<
  string,
  string | number | boolean | null | undefined
>;

export class ApiError extends Error {
  readonly status: number;
  /** Erros por campo, quando o backend devolve validação de formulário. */
  readonly campos: Record<string, string[]>;
  /**
   * Código estável do backend (`not_authenticated`, `permission_denied`, ...).
   * A mensagem vem traduzida; decisão de comportamento se toma por aqui.
   */
  readonly codigo?: string;

  constructor(
    status: number,
    message: string,
    campos: Record<string, string[]> = {},
    codigo?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.campos = campos;
    this.codigo = codigo;
  }
}

/* -------------------------------------------------------------------------
 * Sessão
 * ---------------------------------------------------------------------- */

/*
 * Não há token CSRF aqui.
 *
 * O que a requisição carrega é o cookie `auth_token`, httpOnly e `SameSite=Lax`
 * — e é o `Lax` que barra o CSRF: o navegador não anexa o cookie em POST vindo
 * de outro site. O token em si nunca chega ao JavaScript; quem o transforma em
 * `Authorization: Bearer` é o Route Handler, no servidor.
 */

/**
 * Avisa a aplicação de que a sessão acabou. O provedor de autenticação se
 * registra aqui; o cliente HTTP não sabe navegar nem renderizar nada.
 */
let aoPerderSessao: (() => void) | null = null;

export function registrarPerdaDeSessao(callback: (() => void) | null) {
  aoPerderSessao = callback;
}

function montarQuery(filtros?: Filtros): string {
  if (!filtros) return "";
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === null || valor === undefined || valor === "") continue;
    params.append(chave, String(valor));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Traduz o envelope de erro do backend para algo que a interface consegue
 * exibir: uma mensagem geral e, quando houver, os erros por campo.
 */
function interpretarErro(status: number, corpo: unknown): ApiError {
  const detalhe = (corpo as { detail?: unknown })?.detail;
  const codigo = (corpo as { codigo?: string })?.codigo;

  if (typeof detalhe === "string") {
    return new ApiError(status, detalhe, {}, codigo);
  }

  if (detalhe && typeof detalhe === "object") {
    const campos: Record<string, string[]> = {};
    for (const [campo, mensagens] of Object.entries(
      detalhe as Record<string, unknown>,
    )) {
      campos[campo] = Array.isArray(mensagens)
        ? mensagens.map(String)
        : [String(mensagens)];
    }
    const primeiro = Object.values(campos)[0]?.[0];
    return new ApiError(
      status,
      primeiro ?? "Não foi possível concluir a operação.",
      campos,
      codigo,
    );
  }

  if (status === 404) return new ApiError(status, "Registro não encontrado.", {}, codigo);
  return new ApiError(status, "Não foi possível concluir a operação.", {}, codigo);
}

async function requisitar<T>(
  caminho: string,
  init: RequestInit = {},
): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(`${BASE_URL}/${caminho.replace(/^\//, "")}`, {
      cache: "no-store",
      // Mesma origem: o cookie de sessão vai sozinho. Explícito porque é o que
      // sustenta a autenticação — não é detalhe removível.
      credentials: "same-origin",
      ...init,
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    // Falha de rede: o backend pode estar fora do ar.
    throw new ApiError(0, "Não foi possível conectar ao servidor.");
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const erro = interpretarErro(resposta.status, corpo);

    // Sessão expirada ou inexistente. Só este código dispara o retorno ao
    // login — `permission_denied` (falha de CSRF, por exemplo) não deve
    // derrubar uma sessão que continua válida.
    if (erro.codigo === "not_authenticated") aoPerderSessao?.();

    throw erro;
  }
  return corpo as T;
}

export const api = {
  listar: <T>(recurso: string, filtros?: Filtros) =>
    requisitar<Paginado<T>>(`${recurso}/${montarQuery(filtros)}`),

  buscar: <T>(recurso: string, filtros?: Filtros) =>
    requisitar<T>(`${recurso}/${montarQuery(filtros)}`),

  obter: <T>(recurso: string, id: number | string) =>
    requisitar<T>(`${recurso}/${id}/`),

  criar: <T>(recurso: string, dados: unknown) =>
    requisitar<T>(`${recurso}/`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: <T>(recurso: string, id: number | string, dados: unknown) =>
    requisitar<T>(`${recurso}/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  remover: (recurso: string, id: number | string) =>
    requisitar<void>(`${recurso}/${id}/`, { method: "DELETE" }),

  acao: <T>(caminho: string, dados?: unknown) =>
    requisitar<T>(`${caminho}/`, {
      method: "POST",
      body: dados instanceof FormData ? dados : JSON.stringify(dados ?? {}),
    }),
};
