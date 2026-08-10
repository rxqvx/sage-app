"use server";

import { cookies } from "next/headers";

/**
 * Sessão contra o admin-bff.
 *
 * Segue o mesmo desenho de `funnels-admin` e `outbound-web`: o navegador nunca
 * vê o token. O login acontece do lado do servidor, e o resultado vira dois
 * cookies httpOnly que só o servidor Next consegue ler.
 *
 * São **dois** cookies porque o BFF exige os dois. O `authProvider.protect()`
 * de lá confere a sessão do express *e* o JWT do cabeçalho — um sozinho não
 * passa. Guardar só o token deixaria o ERP fora do resto do ecossistema.
 */

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365;

export interface UsuarioBff {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
}

interface ResultadoLogin {
  ok: boolean;
  erro?: string;
}

function opcoesDoCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UM_ANO_EM_SEGUNDOS,
  };
}

export async function entrar(
  email: string,
  senha: string,
): Promise<ResultadoLogin> {
  const bffUrl = process.env.BFF_URL;
  if (!bffUrl) return { ok: false, erro: "BFF_URL não configurada." };

  let resposta: Response;
  try {
    resposta = await fetch(`${bffUrl}login`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: senha }),
    });
  } catch {
    return { ok: false, erro: "Não foi possível contatar o servidor de acesso." };
  }

  // O BFF responde 404 quando a senha não confere. Traduzimos para uma
  // mensagem única — dizer se o usuário existe entregaria quais e-mails são
  // válidos a quem está tentando adivinhar.
  if (!resposta.ok) {
    return { ok: false, erro: "Usuário ou senha inválidos." };
  }

  const dados = (await resposta.json()) as { token?: string };
  if (!dados.token) {
    return { ok: false, erro: "Resposta de login sem token." };
  }

  // O `Set-Cookie` do express-session precisa ser guardado inteiro e devolvido
  // como cabeçalho `Cookie` nas próximas chamadas ao BFF.
  const cookieDaSessao = resposta.headers.getSetCookie()?.[0];

  const armazem = await cookies();
  armazem.set("auth_token", dados.token, opcoesDoCookie());
  if (cookieDaSessao) {
    armazem.set("response_cookie", cookieDaSessao, opcoesDoCookie());
  }

  return { ok: true };
}

export async function sair(): Promise<void> {
  const bffUrl = process.env.BFF_URL;
  const armazem = await cookies();
  const token = armazem.get("auth_token")?.value;
  const sessao = armazem.get("response_cookie")?.value;

  // Avisa o BFF para destruir a sessão do lado dele. Apagar só os cookies
  // deixaria a sessão viva no servidor até expirar por tempo.
  if (bffUrl && token) {
    try {
      await fetch(`${bffUrl}logout`, {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(sessao ? { Cookie: sessao } : {}),
        },
      });
    } catch {
      // Rede fora não pode impedir o logout local: seguimos apagando.
    }
  }

  armazem.delete("auth_token");
  armazem.delete("response_cookie");
}
