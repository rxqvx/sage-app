import { NextResponse } from "next/server";

import { sair } from "@/lib/services/employee";

export const runtime = "nodejs";

export async function POST() {
  await sair();
  return NextResponse.json({ ok: true });
}
