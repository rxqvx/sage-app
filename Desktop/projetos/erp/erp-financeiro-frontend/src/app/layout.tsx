import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Aplicacao } from "@/components/layout/Aplicacao";
import { ProvedorAuth } from "@/lib/auth/contexto";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ERP Financeiro Web · R&S Serviços",
  description: "Sistema de gestão financeira da R&S Serviços",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` cobre apenas os ATRIBUTOS destes dois
    // elementos, um nível de profundidade. Extensões de navegador (antivírus,
    // gerenciadores de senha, corretores) injetam atributos em <html> e <body>
    // antes do React hidratar, e isso gera um falso mismatch. Divergências
    // reais dentro da aplicação continuam sendo reportadas normalmente.
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      {/*
        Shell de altura fixa com rolagem independente: a sidebar e a barra
        superior ficam sempre visíveis e só o conteúdo rola. Sem isto, a
        sidebar (h-screen) sairia de vista ao rolar uma tabela longa.

        Quem monta esse shell é `<Aplicacao>`, do lado do cliente: a tela de
        login não o usa, e as demais só existem com sessão confirmada.
      */}
      <body className="flex h-screen overflow-hidden" suppressHydrationWarning>
        <ProvedorAuth>
          <Aplicacao>{children}</Aplicacao>
        </ProvedorAuth>
      </body>
    </html>
  );
}
