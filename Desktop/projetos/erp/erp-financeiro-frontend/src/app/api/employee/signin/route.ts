import { NextRequest, NextResponse } from "next/server";

import { entrar } from "@/lib/services/employee";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { usuario, senha } = await request.json();

  if (!usuario || !senha) {
    return NextResponse.json(
      { ok: false, erro: "Informe usuário e senha." },
      { status: 400 },
    );
  }

  const resultado = await entrar(usuario, senha);

  // 401, e não 400: é falha de credencial, não de formato. O cliente HTTP
  // distingue os dois para decidir se manda a pessoa de volta ao login.
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 401 });
}
