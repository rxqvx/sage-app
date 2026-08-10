"use client";

import { Landmark } from "lucide-react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { SaldoConsolidado } from "@/lib/api/tipos";
import { moeda } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
  EstadoVazio,
} from "@/components/data";
import { BotaoNovo, useCriacao } from "@/components/ui/BotaoNovo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { OPCOES_FIXAS } from "@/lib/api/opcoes";

export default function CaixaBancosPage() {
  const { dados, carregando, erro, recarregar } = useRequisicao(() =>
    api.buscar<SaldoConsolidado>("contas-financeiras/saldo-consolidado"),
  );

  const criacao = useCriacao(recarregar);

  return (
    <>
      <PageHeader
        titulo="Caixa e Bancos"
        subtitulo="Gestão das contas financeiras e saldos"
        icone="Landmark"
        acoes={<BotaoNovo rotulo="Nova Conta" aoClicar={criacao.abrir} />}
      />

      {criacao.aberto && (
        <ModalFormulario
          titulo="Nova Conta Financeira"
          recurso="contas-financeiras"
          rotuloAcao="Salvar conta"
          descricao="O provedor define de onde a conciliação bancária busca o extrato desta conta."
          campos={[
            { nome: "nome", rotulo: "Nome da conta", tipo: "texto", obrigatorio: true, largura: "inteira" },
            { nome: "banco", rotulo: "Banco", tipo: "texto", obrigatorio: true },
            { nome: "tipo", rotulo: "Tipo de conta", tipo: "selecao", opcoes: OPCOES_FIXAS.tipoConta, obrigatorio: true, padrao: "1" },
            { nome: "agencia", rotulo: "Agência", tipo: "texto" },
            { nome: "numero_conta", rotulo: "Nº da conta", tipo: "texto" },
            { nome: "saldo_inicial", rotulo: "Saldo inicial (R$)", tipo: "numero", passo: "0.01", padrao: "0", ajuda: "Compõe o Saldo Inicial do DRE." },
            { nome: "provedor", rotulo: "Origem do extrato", tipo: "selecao", opcoes: OPCOES_FIXAS.provedor, padrao: "1" },
          ]}
          aoFechar={criacao.fechar}
          aoConcluir={criacao.concluir}
        />
      )}

      {carregando ? (
        <EstadoCarregando linhas={4} />
      ) : erro || !dados ? (
        <div className="cartao">
          <EstadoErro mensagem={erro ?? "Sem dados."} aoTentarNovamente={recarregar} />
        </div>
      ) : (
        <>
          <CardsIndicadores
            indicadores={[
              {
                rotulo: "Contas Ativas",
                valor: String(dados.quantidade_contas),
                icone: "Landmark",
              },
              {
                rotulo: "Saldo Total Inicial",
                valor: moeda(dados.saldo_inicial_total),
                cor: "ambar",
                icone: "DollarSign",
              },
              {
                rotulo: "Saldo Consolidado",
                valor: moeda(dados.saldo_atual_total),
                descricao: "Todas as contas do sistema",
                cor: "verde",
                icone: "Wallet",
              },
              {
                rotulo: "Ajustes Aplicados",
                valor: moeda(dados.ajustes_total),
                descricao: "Correções manuais de saldo",
                cor: "roxo",
                icone: "Scale",
              },
            ]}
          />

          {dados.contas.length === 0 ? (
            <div className="cartao">
              <EstadoVazio
                titulo="Nenhuma conta cadastrada"
                descricao="Cadastre as contas em Cadastros › Contas Financeiras para começar a registrar lançamentos."
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dados.contas.map((conta) => (
                <article key={conta.conta_id} className="cartao p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
                        <Landmark className="h-4 w-4 text-brand-dark" />
                      </span>
                      <div>
                        <h2 className="font-semibold leading-tight text-slate-900">
                          {conta.conta_nome}
                        </h2>
                        <p className="text-xs text-slate-500">{conta.banco}</p>
                      </div>
                    </div>
                    <Badge cor="verde">Ativa</Badge>
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Saldo Inicial:</dt>
                      <dd className="tabular-nums text-slate-700">
                        {moeda(conta.saldo_inicial)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Entradas:</dt>
                      <dd className="tabular-nums text-emerald-600">
                        {moeda(conta.entradas)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Saídas:</dt>
                      <dd className="tabular-nums text-red-600">
                        {moeda(conta.saidas)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Ajustes:</dt>
                      <dd className="tabular-nums text-slate-700">
                        {moeda(conta.ajustes)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-medium text-slate-600">
                      Saldo Atual:
                    </span>
                    <span className="text-lg font-bold tabular-nums text-emerald-600">
                      {moeda(conta.saldo_atual)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
