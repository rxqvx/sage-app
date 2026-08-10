"use client";

import { useState } from "react";

import { api } from "@/lib/api/client";
import { useRequisicao } from "@/lib/api/hooks";
import type { Dre, GrupoDre } from "@/lib/api/tipos";
import { moeda, percentual, periodoPadrao } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CardsIndicadores,
  EstadoCarregando,
  EstadoErro,
} from "@/components/data";
import { BarraFiltros, FiltroPeriodo } from "@/components/data/Filtros";
import { cn } from "@/lib/utils";

export default function DrePage() {
  const padrao = periodoPadrao();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [detalhado, setDetalhado] = useState(true);

  const dre = useRequisicao(
    () => api.buscar<Dre>("relatorios/dre", { inicio, fim }),
    [inicio, fim],
  );

  return (
    <>
      <PageHeader
        titulo="DRE — Demonstração de Resultado do Exercício"
        subtitulo="Análise estruturada de resultados financeiros"
        icone="FileText"
        acoes={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={detalhado}
              onChange={(e) => setDetalhado(e.target.checked)}
              className="rounded border-slate-300"
            />
            Detalhar subcategorias
          </label>
        }
      />

      <CardsIndicadores
        indicadores={[
          {
            rotulo: "Receita Líquida",
            valor: moeda(dre.dados?.receita_liquida),
            cor: "verde",
            icone: "TrendingUp",
          },
          {
            rotulo: "EBITDA",
            valor: moeda(dre.dados?.ebitda),
            cor: "azul",
            icone: "DollarSign",
          },
          {
            rotulo: "Resultado Líquido",
            valor: moeda(dre.dados?.resultado_liquido),
            cor:
              Number(dre.dados?.resultado_liquido ?? 0) >= 0 ? "verde" : "vermelho",
            icone: "Calculator",
          },
          {
            rotulo: "Saldo Final",
            valor: moeda(dre.dados?.saldo_final),
            descricao: "Saldo inicial + geração de caixa",
            cor: "roxo",
            icone: "Wallet",
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
        {dre.carregando ? (
          <EstadoCarregando linhas={12} />
        ) : dre.erro || !dre.dados ? (
          <EstadoErro
            mensagem={dre.erro ?? "Sem dados."}
            aoTentarNovamente={dre.recarregar}
          />
        ) : (
          <>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                DRE — {dre.dados.empresa}
              </h2>
              <p className="text-sm text-slate-500">
                Período: {dre.dados.periodo.rotulo}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                    <th className="px-5 py-3 text-left font-medium">Descrição</th>
                    <th className="px-5 py-3 text-right font-medium">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <Grupo
                    rotulo="((+)) RECEITA BRUTA DE VENDAS"
                    valor={dre.dados.receita_bruta.total}
                    grupo={dre.dados.receita_bruta}
                    detalhado={detalhado}
                    positivo
                  />

                  <LinhaDetalhe
                    rotulo={`(-) ISS (${percentual(dre.dados.aliquotas.iss)})`}
                    valor={dre.dados.estornos_deducoes.iss}
                    negativo
                    mostrar
                  />
                  <LinhaDetalhe
                    rotulo={`(-) PIS (${percentual(dre.dados.aliquotas.pis)})`}
                    valor={dre.dados.estornos_deducoes.pis}
                    negativo
                    mostrar
                  />
                  <LinhaDetalhe
                    rotulo={`(-) COFINS (${percentual(dre.dados.aliquotas.cofins)})`}
                    valor={dre.dados.estornos_deducoes.cofins}
                    negativo
                    mostrar
                  />
                  <LinhaDetalhe
                    rotulo="(-) Estorno de Receita"
                    valor={dre.dados.estornos_deducoes.estorno_receita}
                    negativo
                    mostrar
                  />
                  <Subtotal
                    rotulo="(=) ESTORNOS E DEDUÇÕES"
                    valor={dre.dados.estornos_deducoes.total}
                    negativo
                  />
                  <Total
                    rotulo="(=) RECEITA LÍQUIDA"
                    valor={dre.dados.receita_liquida}
                  />

                  <Grupo
                    rotulo="(-) SERVIÇOS TERCEIRIZADOS"
                    valor={dre.dados.servicos_terceirizados.total}
                    grupo={dre.dados.servicos_terceirizados}
                    detalhado={detalhado}
                    negativo
                  />
                  <Total rotulo="(=) LUCRO BRUTO" valor={dre.dados.lucro_bruto} />

                  <Subtotal
                    rotulo="(-) COMISSÕES"
                    valor={dre.dados.operacionais.comissoes.total}
                    negativo
                  />
                  {detalhado &&
                    dre.dados.operacionais.comissoes.por_centro_custo.map((item) => (
                      <LinhaDetalhe
                        key={item.centro_custo}
                        rotulo={item.centro_custo}
                        valor={item.valor}
                        negativo
                        mostrar
                      />
                    ))}

                  <Grupo
                    rotulo="(-) MARKETING"
                    valor={dre.dados.operacionais.marketing.total}
                    grupo={dre.dados.operacionais.marketing}
                    detalhado={detalhado}
                    negativo
                  />
                  <Grupo
                    rotulo="(-) PESSOAS E SÓCIOS"
                    valor={dre.dados.operacionais.pessoas_socios.total}
                    grupo={dre.dados.operacionais.pessoas_socios}
                    detalhado={detalhado}
                    negativo
                  />
                  <Grupo
                    rotulo="(-) SOFTWARES E TECNOLOGIA"
                    valor={dre.dados.operacionais.softwares_tecnologia.total}
                    grupo={dre.dados.operacionais.softwares_tecnologia}
                    detalhado={detalhado}
                    negativo
                  />
                  <Grupo
                    rotulo="(-) ADMINISTRATIVO"
                    valor={dre.dados.operacionais.administrativo.total}
                    grupo={dre.dados.operacionais.administrativo}
                    detalhado={detalhado}
                    negativo
                  />

                  <Total rotulo="(=) EBITDA" valor={dre.dados.ebitda} destaque />

                  <Grupo
                    rotulo="((+)) RECEITAS FINANCEIRAS"
                    valor={dre.dados.receitas_financeiras.total}
                    grupo={dre.dados.receitas_financeiras}
                    detalhado={detalhado}
                    positivo
                  />
                  <Grupo
                    rotulo="(-) DESPESAS FINANCEIRAS"
                    valor={dre.dados.despesas_financeiras.total}
                    grupo={dre.dados.despesas_financeiras}
                    detalhado={detalhado}
                    negativo
                  />
                  <Total
                    rotulo="(=) RESULTADO FINANCEIRO"
                    valor={dre.dados.resultado_financeiro}
                  />

                  <Grupo
                    rotulo="(-) IMPOSTOS"
                    valor={dre.dados.impostos.total}
                    grupo={dre.dados.impostos}
                    detalhado={detalhado}
                    negativo
                  />
                  <Total
                    rotulo="(=) RESULTADO LÍQUIDO"
                    valor={dre.dados.resultado_liquido}
                    destaque
                  />

                  <Grupo
                    rotulo="((+)) EMPRÉSTIMOS E MÚTUOS"
                    valor={dre.dados.emprestimos_mutuos.total}
                    grupo={dre.dados.emprestimos_mutuos}
                    detalhado={detalhado}
                  />
                  <Grupo
                    rotulo="(-) APLICAÇÕES FINANCEIRAS"
                    valor={dre.dados.aplicacoes_financeiras.total}
                    grupo={dre.dados.aplicacoes_financeiras}
                    detalhado={detalhado}
                    negativo
                  />
                  <Grupo
                    rotulo="((+)) RESGATES DE APLICAÇÕES"
                    valor={dre.dados.resgates_aplicacoes.total}
                    grupo={dre.dados.resgates_aplicacoes}
                    detalhado={detalhado}
                    positivo
                  />
                  <Grupo
                    rotulo="((+)/-) BLOQUEIOS E DESBLOQUEIOS"
                    valor={dre.dados.bloqueios_desbloqueios.total}
                    grupo={dre.dados.bloqueios_desbloqueios}
                    detalhado={detalhado}
                  />

                  <Total
                    rotulo="(=) GERAÇÃO LÍQUIDA DE CAIXA"
                    valor={dre.dados.geracao_liquida_caixa}
                    destaque
                  />
                  <Subtotal
                    rotulo="((+)) SALDO INICIAL"
                    valor={dre.dados.saldo_inicial}
                  />
                  <Total
                    rotulo="(=) SALDO FINAL"
                    valor={dre.dados.saldo_final}
                    destaque
                  />
                </tbody>
              </table>
            </div>

            <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
              ISS, PIS e COFINS são calculados sobre a receita bruta com as
              alíquotas cadastradas em Administração › Parâmetros Fiscais. O
              grupo Administrativo compõe o EBITDA por ser despesa operacional.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function Grupo({
  rotulo,
  valor,
  grupo,
  detalhado,
  positivo,
  negativo,
}: {
  rotulo: string;
  valor: string;
  grupo: GrupoDre;
  detalhado: boolean;
  positivo?: boolean;
  negativo?: boolean;
}) {
  return (
    <>
      <Subtotal rotulo={rotulo} valor={valor} positivo={positivo} negativo={negativo} />
      {detalhado &&
        grupo.linhas?.map((linha) => (
          <LinhaDetalhe
            key={linha.subcategoria}
            rotulo={linha.subcategoria}
            valor={linha.valor}
            positivo={positivo}
            negativo={negativo}
            mostrar
          />
        ))}
    </>
  );
}

function Subtotal({
  rotulo,
  valor,
  positivo,
  negativo,
}: {
  rotulo: string;
  valor: string;
  positivo?: boolean;
  negativo?: boolean;
}) {
  return (
    <tr className="bg-slate-50/40">
      <td className="px-5 py-2.5 font-semibold text-slate-800">{rotulo}</td>
      <td
        className={cn(
          "px-5 py-2.5 text-right font-semibold tabular-nums",
          positivo ? "text-emerald-600" : negativo ? "text-red-600" : "text-slate-800",
        )}
      >
        {negativo && Number(valor) !== 0 ? "-" : ""}
        {moeda(valor)}
      </td>
    </tr>
  );
}

function LinhaDetalhe({
  rotulo,
  valor,
  positivo,
  negativo,
  mostrar,
}: {
  rotulo: string;
  valor: string;
  positivo?: boolean;
  negativo?: boolean;
  mostrar?: boolean;
}) {
  if (!mostrar) return null;
  return (
    <tr>
      <td className="py-2 pl-10 pr-5 text-slate-600">{rotulo}</td>
      <td
        className={cn(
          "px-5 py-2 text-right tabular-nums",
          positivo ? "text-emerald-600" : negativo ? "text-red-600" : "text-slate-600",
        )}
      >
        {negativo && Number(valor) !== 0 ? "-" : ""}
        {moeda(valor)}
      </td>
    </tr>
  );
}

function Total({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <tr className={destaque ? "bg-brand-light" : "bg-slate-100"}>
      <td className="px-5 py-3 font-bold text-slate-900">{rotulo}</td>
      <td
        className={cn(
          "px-5 py-3 text-right font-bold tabular-nums",
          Number(valor) >= 0 ? "text-emerald-700" : "text-red-700",
        )}
      >
        {moeda(valor)}
      </td>
    </tr>
  );
}
