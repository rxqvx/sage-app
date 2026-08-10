"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Balancete } from "@/lib/api/tipos";
import { moeda, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
} from "@/components/data";
import { BarraFiltros, FiltroPeriodo } from "@/components/data/Filtros";

export default function BalancetePage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);

  const balancete = useRequisicao(
    () => api.buscar<Balancete>("relatorios/balancete", { inicio, fim }),
    [inicio, fim],
  );

  return (
    <>
      <PageHeader
        titulo="Balancete de Verificação"
        subtitulo="Balancete contábil derivado dos módulos do sistema"
        icone="Scale"
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Total Débito",
            valor: moeda(balancete.dados?.total_debito),
            cor: "azul",
            icone: "TrendingUp",
          },
          {
            rotulo: "Total Crédito",
            valor: moeda(balancete.dados?.total_credito),
            cor: "roxo",
            icone: "TrendingDown",
          },
          {
            rotulo: "Diferença",
            valor: moeda(balancete.dados?.diferenca),
            cor: balancete.dados?.balanceado ? "verde" : "vermelho",
            icone: "Scale",
            destaque: balancete.dados ? !balancete.dados.balanceado : false,
          },
        ]}
      />

      <BarraFiltros>
        <FiltroPeriodo
          inicio={inicio}
          fim={fim}
          aoMudarInicio={setInicio}
          aoMudarFim={setFim}
        />
      </BarraFiltros>

      <div className="cartao overflow-hidden">
        {balancete.carregando ? (
          <EstadoCarregando linhas={10} />
        ) : balancete.erro || !balancete.dados ? (
          <EstadoErro
            mensagem={balancete.erro ?? "Sem dados."}
            aoTentarNovamente={balancete.recarregar}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Balancete — {balancete.dados.empresa}
                </h2>
                <p className="text-sm text-slate-500">
                  {balancete.dados.periodo.rotulo}
                </p>
              </div>
              <Badge cor={balancete.dados.balanceado ? "verde" : "vermelho"}>
                {balancete.dados.balanceado ? "BALANCEADO" : "DESBALANCEADO"}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                    <th className="px-4 py-3 text-left font-medium">Código</th>
                    <th className="px-4 py-3 text-left font-medium">Conta</th>
                    <th className="px-4 py-3 text-left font-medium">Grupo</th>
                    <th className="px-4 py-3 text-left font-medium">Origem</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Saldo Anterior
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Débitos</th>
                    <th className="px-4 py-3 text-right font-medium">Créditos</th>
                    <th className="px-4 py-3 text-right font-medium">Saldo Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balancete.dados.contas.map((conta) => (
                    <tr key={conta.codigo} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {conta.codigo}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {conta.nome}
                        {conta.sem_origem_definida && (
                          <span className="ml-2">
                            <Badge cor="ambar">origem a definir</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{conta.grupo}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {conta.origem}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {moeda(conta.saldo_anterior)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-600">
                        {Number(conta.debitos) ? moeda(conta.debitos) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-violet-600">
                        {Number(conta.creditos) ? moeda(conta.creditos) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">
                        {moeda(conta.saldo_atual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-bold text-slate-900">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-blue-700">
                      {moeda(balancete.dados.total_debito)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-violet-700">
                      {moeda(balancete.dados.total_credito)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
              Cada conta é calculada a partir do módulo indicado na coluna
              Origem, conforme a planilha. O plano de contas é editável em
              Administração › Plano de Contas.
            </p>
          </>
        )}
      </div>
    </>
  );
}
