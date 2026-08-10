"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";

import { useAuth } from "@/lib/auth/contexto";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const { entrar, estado } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await entrar(usuario, senha);
      // Não desliga `enviando` no sucesso: a navegação leva a pessoa embora, e
      // reabilitar o botão antes disso pisca um formulário já resolvido.
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível entrar. Tente novamente.",
      );
      setEnviando(false);
    }
  }

  // A sessão ainda está sendo verificada, ou já é válida e o provedor está
  // redirecionando: em nenhum dos dois casos faz sentido pedir a senha.
  // `min-h-screen w-screen` e nao `flex-1`: entre o <body> e esta tela existe o
  // wrapper de `template.tsx`, que é filho flex do body — ele estica em altura,
  // mas a largura acompanha o conteúdo. Um `flex-1` aqui não teria o que
  // preencher, e o formulário encostaria no canto.
  if (estado !== "anonimo") {
    return (
      <div
        className="flex min-h-screen w-screen items-center justify-center"
        role="status"
      >
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 px-4">
      <div className="animate-surgir w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand
                       text-lg font-bold text-white shadow-lg shadow-brand/25"
          >
            R$
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            ERP Financeiro
          </h1>
          <p className="mt-1 text-sm text-slate-500">R&amp;S Serviços Ltda</p>
        </div>

        <form onSubmit={aoEnviar} className="cartao space-y-4 p-6">
          <div>
            <label htmlFor="usuario" className="rotulo-campo">
              Usuário
            </label>
            <input
              id="usuario"
              name="username"
              autoComplete="username"
              autoFocus
              required
              className="campo"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="senha" className="rotulo-campo">
              Senha
            </label>
            <input
              id="senha"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="campo"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="animate-surgir rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="botao-primario w-full justify-center"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Acesso restrito ao setor financeiro.
        </p>
      </div>
    </div>
  );
}
