"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { auth, type Usuario } from "@/lib/api/auth";
import { registrarPerdaDeSessao } from "@/lib/api/client";

export const ROTA_LOGIN = "/login";

type Estado = "verificando" | "autenticado" | "anonimo";

interface Contexto {
  usuario: Usuario | null;
  /** Papéis vindos do JWT do admin-bff. Hoje nada por aqui decide acesso — a
   *  usuária é única —, mas o menu já pode se adaptar quando houver mais gente. */
  roles: string[];
  estado: Estado;
  entrar: (usuario: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const ContextoAuth = createContext<Contexto | null>(null);

export function useAuth(): Contexto {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de <ProvedorAuth>.");
  }
  return contexto;
}

/**
 * Dono do estado de sessão.
 *
 * Ao montar, pergunta ao backend quem está logado — o cookie é httpOnly, então
 * o JavaScript não tem como saber isso sozinho. Enquanto a resposta não chega o
 * estado é `verificando`, e é por isso que existe um terceiro estado além de
 * autenticado/anônimo: sem ele, a aplicação piscaria a tela de login a cada
 * recarga antes de descobrir que a sessão era válida.
 *
 * Quem autentica é o `admin-bff`; este provedor só reflete o resultado. A
 * confirmação vem da API do ERP (`auth/eu`), e não da leitura local do token:
 * o que importa é se a outra ponta aceita a credencial, não o que ela diz.
 */
export function ProvedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [estado, setEstado] = useState<Estado>("verificando");
  const router = useRouter();
  const caminho = usePathname();

  // Qualquer requisição que volte "sem sessão" derruba o estado local. Cobre o
  // caso de a sessão expirar com a aba aberta.
  useEffect(() => {
    registrarPerdaDeSessao(() => {
      setUsuario(null);
      setRoles([]);
      setEstado("anonimo");
    });
    return () => registrarPerdaDeSessao(null);
  }, []);

  useEffect(() => {
    let cancelado = false;

    auth
      .eu()
      .then(({ usuario: u, roles: r }) => {
        if (cancelado) return;
        setUsuario(u);
        setRoles(r ?? []);
        setEstado("autenticado");
      })
      .catch(() => {
        if (cancelado) return;
        setUsuario(null);
        setRoles([]);
        setEstado("anonimo");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Anônimo fora do login vai para o login; autenticado no login vai para casa.
  useEffect(() => {
    if (estado === "verificando") return;
    if (estado === "anonimo" && caminho !== ROTA_LOGIN) {
      router.replace(ROTA_LOGIN);
    }
    if (estado === "autenticado" && caminho === ROTA_LOGIN) {
      router.replace("/");
    }
  }, [estado, caminho, router]);

  const entrar = useCallback(
    async (login: string, senha: string) => {
      // O login apenas deposita os cookies. Quem confirma a identidade é a API
      // do ERP em seguida — se ela recusar o token do BFF, não há sessão útil,
      // e entrar na aplicação só adiaria o erro para a primeira tela.
      await auth.entrar(login, senha);

      const { usuario: u, roles: r } = await auth.eu();
      setUsuario(u);
      setRoles(r ?? []);
      setEstado("autenticado");
      router.replace("/");
    },
    [router],
  );

  const sair = useCallback(async () => {
    try {
      await auth.sair();
    } finally {
      // Mesmo que a chamada falhe, a sessão local acaba aqui: deixar a interface
      // aberta depois de a pessoa clicar em "sair" é pior que um erro de rede.
      setUsuario(null);
      setRoles([]);
      setEstado("anonimo");
      router.replace(ROTA_LOGIN);
    }
  }, [router]);

  return (
    <ContextoAuth.Provider value={{ usuario, roles, estado, entrar, sair }}>
      {children}
    </ContextoAuth.Provider>
  );
}
