import { NextRequest, NextResponse } from "next/server";

/**
 * Guarda de borda: barra a navegação para telas internas sem cookie de sessão.
 *
 * O arquivo se chama `proxy.ts`, e não `middleware.ts`, porque o Next 16
 * renomeou a convenção — é o mesmo nome usado em `outbound-web`.
 *
 * É uma **primeira** camada, não a única. Aqui só se verifica que o cookie
 * existe: isto roda no edge e não vai validar assinatura de JWT a cada
 * navegação. Quem de fato decide é a API do ERP, que confere assinatura, prazo
 * e usuário em toda requisição. O ganho desta camada é não montar a aplicação
 * inteira para depois cair no login.
 */

export const config = {
  // Tudo, menos a tela de login, os Route Handlers e os assets do Next. Os
  // handlers ficam de fora porque `/api/employee/signin` precisa ser alcançável
  // justamente por quem ainda não tem sessão.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

export default function proxy(request: NextRequest) {
  if (request.cookies.get("auth_token")) {
    return NextResponse.next();
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/login";
  destino.search = "";
  return NextResponse.redirect(destino);
}
