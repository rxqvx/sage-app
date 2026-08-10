import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Proxy de mesma origem para a API do ERP.
 *
 * O navegador fala com `/api/erp/...`, nunca com o Django direto. É aqui que o
 * `auth_token` — cookie httpOnly, ilegível por JavaScript — vira o cabeçalho
 * `Authorization: Bearer`. O token não entra no bundle, não aparece no
 * `localStorage` e não é alcançável por XSS.
 *
 * De quebra, some o CORS: mesma origem. O que protege contra CSRF aqui é o
 * `SameSite=Lax` dos cookies, que impede um site de terceiros de disparar
 * escritas usando a sessão de quem está logado.
 */

const CABECALHOS_REPASSADOS = ["content-type", "accept"];

function urlDeDestino(request: NextRequest, caminho: string[]) {
  const base = process.env.ERP_API_URL;
  if (!base) throw new Error("ERP_API_URL não configurada.");

  const normalizada = base.endsWith("/") ? base : `${base}/`;
  const destino = new URL(caminho.join("/"), normalizada);
  destino.search = request.nextUrl.search;
  return destino;
}

async function repassar(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    // Mesmo formato que o Django devolve, para o cliente HTTP tratar os dois
    // casos com um caminho só.
    return NextResponse.json(
      { error: true, detail: { detail: "Sem sessão." }, codigo: "not_authenticated" },
      { status: 401 },
    );
  }

  const cabecalhos = new Headers({ Authorization: `Bearer ${token}` });
  for (const nome of CABECALHOS_REPASSADOS) {
    const valor = request.headers.get(nome);
    if (valor) cabecalhos.set(nome, valor);
  }

  const init: RequestInit = {
    method: request.method,
    headers: cabecalhos,
    cache: "no-store",
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  let resposta: Response;
  try {
    resposta = await fetch(urlDeDestino(request, path).toString(), init);
  } catch {
    return NextResponse.json(
      { error: true, detail: { detail: "API do ERP indisponível." } },
      { status: 502 },
    );
  }

  const corpo = await resposta.text();
  return new NextResponse(corpo || null, {
    status: resposta.status,
    headers: {
      "content-type":
        resposta.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = repassar;
export const POST = repassar;
export const PUT = repassar;
export const PATCH = repassar;
export const DELETE = repassar;
