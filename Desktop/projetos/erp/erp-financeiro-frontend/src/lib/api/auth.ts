import { api, ApiError } from "./client";

export interface Usuario {
  id: number;
  username: string;
  nome_exibicao: string;
  email: string;
  is_superuser: boolean;
}

interface RespostaIdentidade {
  usuario: Usuario;
  roles: string[];
}

/**
 * Sessão do usuário.
 *
 * Duas origens diferentes, de propósito:
 *
 * - **entrar/sair** falam com os Route Handlers deste app (`/api/employee/*`),
 *   que por sua vez conversam com o `admin-bff`. Quem valida senha é o BFF; o
 *   ERP não tem tabela de credenciais.
 * - **eu** passa pelo proxy até o Django, e é a confirmação de que a API
 *   financeira aceita o token. Ler o JWT no cliente diria só o que o próprio
 *   cliente já carrega — não prova que a outra ponta concorda.
 */
export const auth = {
  async entrar(usuario: string, senha: string): Promise<void> {
    const resposta = await fetch("/api/employee/signin", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    });

    const corpo = await resposta.json().catch(() => null);
    if (!resposta.ok || !corpo?.ok) {
      throw new ApiError(
        resposta.status,
        corpo?.erro ?? "Não foi possível entrar.",
      );
    }
  },

  async sair(): Promise<void> {
    await fetch("/api/employee/signout", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });
  },

  /** Quem está logado, segundo a API do ERP. Lança `ApiError` com
   *  `codigo: "not_authenticated"` quando não há sessão válida. */
  async eu(): Promise<RespostaIdentidade> {
    return api.buscar<RespostaIdentidade>("auth/eu");
  },
};
