/**
 * Estrutura do menu, espelhando a organização do protótipo:
 * Financeiro, Relatórios, Cadastros e Administração.
 */

export interface ItemMenu {
  rotulo: string;
  href: string;
  icone: string;
}

export interface GrupoMenu {
  rotulo: string;
  icone: string;
  itens: ItemMenu[];
}

export const GRUPOS_MENU: GrupoMenu[] = [
  {
    rotulo: "Financeiro",
    icone: "Wallet",
    itens: [
      { rotulo: "Caixa e Bancos", href: "/financeiro/caixa-bancos", icone: "Landmark" },
      { rotulo: "Entradas", href: "/financeiro/entradas", icone: "TrendingUp" },
      { rotulo: "Saídas", href: "/financeiro/saidas", icone: "TrendingDown" },
      { rotulo: "Contas a Pagar", href: "/financeiro/contas-pagar", icone: "Receipt" },
      { rotulo: "Contas a Receber", href: "/financeiro/contas-receber", icone: "DollarSign" },
      { rotulo: "Ficha Financeira", href: "/financeiro/ficha-financeira", icone: "FileCheck" },
      { rotulo: "Comissões", href: "/financeiro/comissoes", icone: "Percent" },
      { rotulo: "Cobranças", href: "/financeiro/cobrancas", icone: "BadgeDollarSign" },
      { rotulo: "Conciliação Bancária", href: "/financeiro/conciliacao", icone: "SlidersHorizontal" },
      { rotulo: "Ajuste de Saldo", href: "/financeiro/ajuste-saldo", icone: "Scale" },
    ],
  },
  {
    rotulo: "Relatórios",
    icone: "BarChart3",
    itens: [
      { rotulo: "DRE", href: "/relatorios/dre", icone: "FileText" },
      { rotulo: "Fluxo de Caixa", href: "/relatorios/fluxo-caixa", icone: "TrendingUp" },
      { rotulo: "Balancete", href: "/relatorios/balancete", icone: "Scale" },
      { rotulo: "Ponto de Equilíbrio", href: "/relatorios/ponto-equilibrio", icone: "BarChart3" },
      { rotulo: "ROI", href: "/relatorios/roi", icone: "PieChart" },
      { rotulo: "Resumo por Categoria", href: "/relatorios/resumo-categorias", icone: "PieChart" },
      { rotulo: "NFs de Saída", href: "/relatorios/nf-saida", icone: "FileText" },
      { rotulo: "NFs de Entrada", href: "/relatorios/nf-entrada", icone: "FileText" },
    ],
  },
  {
    rotulo: "Cadastros",
    icone: "Users",
    itens: [
      { rotulo: "Clientes / Fornecedores", href: "/cadastros/parceiros", icone: "Users" },
      { rotulo: "Vendedores", href: "/cadastros/vendedores", icone: "UserCheck" },
      { rotulo: "Pessoal", href: "/cadastros/pessoal", icone: "UserCog" },
      { rotulo: "Serviços", href: "/cadastros/servicos", icone: "Briefcase" },
      { rotulo: "Lista de Preços", href: "/cadastros/lista-precos", icone: "Tag" },
      { rotulo: "Contas Financeiras", href: "/cadastros/contas-financeiras", icone: "Landmark" },
      { rotulo: "Classificação", href: "/cadastros/classificacao", icone: "Layers" },
    ],
  },
  {
    rotulo: "Administração",
    icone: "ShieldCheck",
    itens: [
      { rotulo: "Parâmetros Fiscais", href: "/administracao/parametros", icone: "SlidersHorizontal" },
      { rotulo: "Plano de Contas", href: "/administracao/plano-contas", icone: "Layers" },
      { rotulo: "Investimentos", href: "/administracao/investimentos", icone: "PieChart" },
      { rotulo: "Audit Log", href: "/administracao/auditoria", icone: "History" },
    ],
  },
];
