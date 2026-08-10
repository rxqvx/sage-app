/**
 * Tipos do contrato da API.
 *
 * Valores monetários chegam como string: o DRF serializa Decimal assim para
 * não perder precisão em float. Use `paraNumero`/`moeda` para exibir.
 */

export interface Registro {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface Natureza extends Registro {
  nome: string;
  tipo: number;
  tipo_display: string;
  ativo: boolean;
}

export interface CentroCusto extends Registro {
  nome: string;
  codigo: string | null;
  ativo: boolean;
}

export interface Subcategoria extends Registro {
  nome: string;
  categoria: number;
  categoria_nome?: string;
  ativo: boolean;
}

export interface Categoria extends Registro {
  nome: string;
  tipo: number;
  tipo_display: string;
  grupo_dre: string | null;
  ativo: boolean;
  subcategorias?: Subcategoria[];
}

export interface FormaPagamento extends Registro {
  nome: string;
  ativo: boolean;
}

export interface LinhaNegocio extends Registro {
  nome: string;
  ativo: boolean;
}

export interface ContaFinanceira extends Registro {
  nome: string;
  banco: string;
  tipo: number;
  tipo_display: string;
  agencia: string | null;
  numero_conta: string | null;
  saldo_inicial: string;
  provedor: number;
  provedor_display: string;
  ativo: boolean;
}

export interface SaldoConta {
  conta_id: number;
  conta_nome: string;
  banco: string;
  saldo_inicial: string;
  entradas: string;
  saidas: string;
  ajustes: string;
  saldo_atual: string;
}

export interface SaldoConsolidado {
  saldo_inicial_total: string;
  entradas_total: string;
  saidas_total: string;
  ajustes_total: string;
  saldo_atual_total: string;
  quantidade_contas: number;
  contas: SaldoConta[];
}

export interface Parceiro extends Registro {
  codigo: string | null;
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  tipo: number;
  tipo_display: string;
  tipo_pessoa: number;
  tipo_pessoa_display: string;
  cidade: string | null;
  uf: string | null;
  cliente_desde: string | null;
  ativo: boolean;
}

export interface Vendedor extends Registro {
  codigo: string | null;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  participa_comissao: boolean;
  tipo_comissao: number;
  tipo_comissao_display: string;
  aliquota_comissao: string;
  comissao_fixa: string;
  ativo: boolean;
}

export interface Pessoal extends Registro {
  nome_completo: string;
  cpf: string;
  cargo: string | null;
  tipo_contrato: number;
  tipo_contrato_display: string;
  data_admissao: string | null;
  celular: string | null;
  salario: string;
  ativo: boolean;
}

export interface Servico extends Registro {
  codigo: string | null;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface ListaPreco extends Registro {
  servico: number;
  servico_nome: string;
  servico_codigo: string | null;
  forma_pagamento: number | null;
  forma_pagamento_nome: string | null;
  valor: string;
  desconto: string;
  valor_final: string;
  ativo: boolean;
}

export interface LancamentoCaixa extends Registro {
  tipo: number;
  tipo_display: string;
  data_lancamento: string;
  valor: string;
  destinatario: string;
  parceiro: number | null;
  descricao: string | null;
  conta_financeira: number;
  conta_financeira_nome: string;
  natureza: number | null;
  natureza_nome: string | null;
  centro_custo: number | null;
  centro_custo_nome: string | null;
  categoria: number | null;
  categoria_nome: string | null;
  subcategoria: number | null;
  subcategoria_nome: string | null;
  forma_pagamento: number | null;
  forma_pagamento_nome: string | null;
  data_pagamento: string | null;
  status: number;
  status_display: string;
  observacoes: string | null;
  esta_classificado: boolean;
}

export interface Titulo extends Registro {
  parceiro: number;
  parceiro_nome: string;
  valor: string;
  juros: string;
  multa: string;
  valor_total: string;
  emissao: string;
  competencia: string;
  vencimento: string;
  numero_documento: string;
  forma_pagamento: number | null;
  forma_pagamento_nome: string | null;
  natureza_nome: string | null;
  centro_custo_nome: string | null;
  categoria_nome: string | null;
  subcategoria_nome: string | null;
  status: number;
  status_efetivo: string;
  esta_vencido: boolean;
  dias_atraso: number;
  data_liquidacao: string | null;
  conta_financeira: number | null;
  observacoes: string | null;
}

export interface AjusteSaldo extends Registro {
  conta_financeira: number;
  conta_nome: string;
  data: string;
  saldo_anterior: string;
  saldo_ajustado: string;
  diferenca: string;
  justificativa: string;
  usuario_nome: string | null;
}

export interface Comissao extends Registro {
  vendedor: number;
  vendedor_nome: string;
  tipo_comissao: string;
  periodo: string;
  faturado: string;
  saldo_anterior: string;
  comissao_mes: string;
  outros_creditos: string;
  outros_debitos: string;
  saldo_final: string;
  observacoes: string | null;
}

export interface NotaFiscal extends Registro {
  tipo: number;
  tipo_display: string;
  numero: string;
  parceiro: number;
  parceiro_nome: string;
  servico_nome: string | null;
  descricao_servico: string | null;
  uf: string | null;
  emissao: string;
  valor: string;
  iss: string;
  pis: string;
  cofins: string;
  total_tributos: string;
  status: number;
  status_display: string;
}

export interface ItemExtrato extends Registro {
  importacao: number;
  data: string;
  descricao: string;
  valor: string;
  tipo: number;
  tipo_display: string;
  situacao: number;
  situacao_display: string;
  documento: string | null;
  natureza: number | null;
  centro_custo: number | null;
  categoria: number | null;
  subcategoria: number | null;
  parceiro: number | null;
  lancamento: number | null;
  esta_classificado: boolean;
  sugestao: {
    id: number;
    data: string;
    valor: string;
    destinatario: string;
    descricao: string | null;
  } | null;
}

export interface ImportacaoExtrato extends Registro {
  conta_financeira: number;
  conta_nome: string;
  origem: number;
  origem_display: string;
  periodo_inicio: string;
  periodo_fim: string;
  status: number;
  status_display: string;
  total_itens: number;
  pendentes: number;
  itens?: ItemExtrato[];
}

export interface ParametrosFiscais extends Registro {
  empresa: string;
  aliquota_iss: string;
  aliquota_pis: string;
  aliquota_cofins: string;
  lucro_desejado: string;
}

export interface ContaContabil extends Registro {
  codigo: string;
  nome: string;
  grupo: number;
  grupo_display: string;
  natureza_display: string;
  origem_display: string;
  ativo: boolean;
}

export interface Investimento extends Registro {
  nome: string;
  descricao: string | null;
  valor_investido: string;
  receita_gerada: string;
  custos_operacionais: string;
  lucro_obtido: string;
  data_inicio: string;
  periodo_meses: number | null;
  centro_custo_nome: string | null;
  ativo: boolean;
}

export interface QuantidadeVendida extends Registro {
  linha_negocio: number;
  linha_negocio_nome: string;
  periodo: string;
  quantidade: number;
}

export interface LogAuditoria extends Registro {
  usuario_nome: string | null;
  acao: string;
  acao_display: string;
  entidade: string;
  entidade_id: string | null;
  detalhe: string | null;
}

export interface PeriodoRotulo {
  inicio: string;
  fim: string;
  rotulo: string;
}

export interface LinhaValor {
  subcategoria: string;
  valor: string;
}

export interface GrupoDre {
  total: string;
  linhas?: LinhaValor[];
}

export interface Dre {
  periodo: PeriodoRotulo;
  empresa: string;
  aliquotas: { iss: string; pis: string; cofins: string };
  receita_bruta: GrupoDre;
  estornos_deducoes: {
    total: string;
    iss: string;
    pis: string;
    cofins: string;
    estorno_receita: string;
    deducoes_lancadas: string;
  };
  receita_liquida: string;
  servicos_terceirizados: GrupoDre;
  lucro_bruto: string;
  operacionais: {
    total: string;
    comissoes: {
      total: string;
      por_centro_custo: { centro_custo: string; valor: string }[];
    };
    marketing: GrupoDre;
    pessoas_socios: GrupoDre;
    softwares_tecnologia: GrupoDre;
    administrativo: GrupoDre;
  };
  ebitda: string;
  receitas_financeiras: GrupoDre;
  despesas_financeiras: GrupoDre;
  resultado_financeiro: string;
  impostos: GrupoDre;
  resultado_liquido: string;
  emprestimos_mutuos: GrupoDre;
  aplicacoes_financeiras: GrupoDre;
  resgates_aplicacoes: GrupoDre;
  bloqueios_desbloqueios: GrupoDre;
  geracao_liquida_caixa: string;
  saldo_inicial: string;
  saldo_final: string;
}

export interface FluxoCaixa {
  empresa: string;
  conta: string;
  periodo: PeriodoRotulo;
  saldo_inicial: string;
  centros_custo: {
    centro_custo: string;
    entradas: string;
    saidas: string;
    saldo: string;
    subcategorias: {
      subcategoria: string;
      entradas: string;
      saidas: string;
      saldo: string;
    }[];
  }[];
  total_entradas: string;
  total_saidas: string;
  saldo: string;
  saldo_final: string;
}

export interface MesFluxo {
  ano: number;
  mes: number;
  competencia: string;
  entradas: string;
  saidas: string;
  saldo: string;
  saldo_acumulado: string;
}

export interface Balancete {
  empresa: string;
  periodo: PeriodoRotulo;
  contas: {
    codigo: string;
    nome: string;
    grupo: string;
    natureza: string;
    origem: string;
    saldo_anterior: string;
    debitos: string;
    creditos: string;
    saldo_atual: string;
    sem_origem_definida: boolean;
  }[];
  total_debito: string;
  total_credito: string;
  diferenca: string;
  balanceado: boolean;
}

export interface LinhaPontoEquilibrio {
  linha_negocio_id: number;
  linha_negocio: string;
  faturamento: string;
  quantidade_vendida: number;
  participacao: string;
  preco_medio: string;
  despesas_comercializacao_unitaria: string;
  despesas_variaveis_unitaria: string;
  margem_contribuicao: string;
  percentual_margem: string;
  custos_fixos_rateados: string;
  custos_fixos_unitario: string;
  lucro_unitario: string;
  ponto_equilibrio: string | null;
  ponto_lucro: string | null;
  observacao: string | null;
}

export interface PontoEquilibrio {
  periodo: PeriodoRotulo;
  empresa: string;
  lucro_desejado: string;
  faturamento_total: string;
  despesas: {
    comercializacao: string;
    variaveis: string;
    custos_fixos: string;
  };
  linhas_negocio: LinhaPontoEquilibrio[];
}

export interface Roi {
  total_investido: string;
  receita_gerada: string;
  custos_operacionais: string;
  lucro_obtido: string;
  roi: string | null;
  roi_convencional: string | null;
  investimentos: {
    id: number;
    nome: string;
    centro_custo: string | null;
    data_inicio: string;
    periodo_meses: number | null;
    valor_investido: string;
    receita_gerada: string;
    custos_operacionais: string;
    lucro_obtido: string;
    roi: string | null;
    roi_convencional: string | null;
    retorno_anual: string | null;
  }[];
}

export interface ResumoCategorias {
  periodo: PeriodoRotulo;
  agrupado_por: string;
  total_receitas: string;
  total_despesas: string;
  saldo: string;
  receitas: { id: number; nome: string; valor: string; percentual: string }[];
  despesas: { id: number; nome: string; valor: string; percentual: string }[];
}

export interface FichaFinanceira {
  periodo: PeriodoRotulo;
  total_entradas: string;
  total_saidas: string;
  saldo_liquido: string;
  linhas: {
    id: number;
    data: string;
    tipo: string;
    destinatario: string;
    descricao: string | null;
    banco: string;
    categoria: string | null;
    subcategoria: string | null;
    entrada: string;
    saida: string;
    saldo_acumulado: string;
  }[];
}

export interface DashboardResumo {
  periodo: PeriodoRotulo;
  saldo_em_bancos: string;
  quantidade_contas: number;
  entradas_liquidas: string;
  saidas_liquidas: string;
  contas_pagar: string;
  contas_receber: string;
  inadimplencia: string;
  evolucao_mensal: MesFluxo[];
  despesas_por_categoria: {
    id: number;
    nome: string;
    valor: string;
    percentual: string;
  }[];
  lancamentos_recentes: {
    id: number;
    data: string;
    tipo: string;
    destinatario: string;
    descricao: string | null;
    banco: string;
    valor: string;
    status: string;
  }[];
}
