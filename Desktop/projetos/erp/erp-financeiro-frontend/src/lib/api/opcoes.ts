"use client";

import { api } from "./client";
import { useRequisicao } from "./hooks";
import type {
  Categoria,
  CentroCusto,
  ContaFinanceira,
  FormaPagamento,
  LinhaNegocio,
  Natureza,
  Parceiro,
  Servico,
  Subcategoria,
  Vendedor,
} from "./tipos";
import type { OpcaoCampo } from "@/components/ui/ModalFormulario";

const PAGINA_CHEIA = { page_size: 300 };

/**
 * Listas de referência usadas pelos formulários.
 *
 * Cada tela pede só o que precisa. Centralizar aqui evita que cada formulário
 * reescreva a mesma consulta e o mesmo mapeamento para `{valor, rotulo}`.
 */
export function useOpcoes() {
  const contas = useRequisicao(() =>
    api.listar<ContaFinanceira>("contas-financeiras", PAGINA_CHEIA),
  );
  const parceiros = useRequisicao(() =>
    api.listar<Parceiro>("parceiros", PAGINA_CHEIA),
  );
  const naturezas = useRequisicao(() =>
    api.listar<Natureza>("naturezas", PAGINA_CHEIA),
  );
  const centros = useRequisicao(() =>
    api.listar<CentroCusto>("centros-custo", PAGINA_CHEIA),
  );
  const categorias = useRequisicao(() =>
    api.listar<Categoria>("categorias", PAGINA_CHEIA),
  );
  const subcategorias = useRequisicao(() =>
    api.listar<Subcategoria>("subcategorias", PAGINA_CHEIA),
  );
  const formas = useRequisicao(() =>
    api.listar<FormaPagamento>("formas-pagamento", PAGINA_CHEIA),
  );
  const linhas = useRequisicao(() =>
    api.listar<LinhaNegocio>("linhas-negocio", PAGINA_CHEIA),
  );
  const servicos = useRequisicao(() =>
    api.listar<Servico>("servicos", PAGINA_CHEIA),
  );
  const vendedores = useRequisicao(() =>
    api.listar<Vendedor>("vendedores", PAGINA_CHEIA),
  );

  const mapear = <T extends { id: number }>(
    registros: T[] | undefined,
    rotulo: (registro: T) => string,
    pai?: (registro: T) => string,
  ): OpcaoCampo[] =>
    (registros ?? []).map((registro) => ({
      valor: String(registro.id),
      rotulo: rotulo(registro),
      pai: pai?.(registro),
    }));

  return {
    contas: mapear(contas.dados?.results, (c) => `${c.nome} (${c.banco})`),
    parceiros: mapear(parceiros.dados?.results, (p) => p.nome),
    clientes: mapear(
      parceiros.dados?.results?.filter((p) => p.tipo === 1 || p.tipo === 3),
      (p) => p.nome,
    ),
    fornecedores: mapear(
      parceiros.dados?.results?.filter((p) => p.tipo === 2 || p.tipo === 3),
      (p) => p.nome,
    ),
    naturezas: mapear(naturezas.dados?.results, (n) => n.nome),
    centros: mapear(centros.dados?.results, (c) => c.nome),
    categorias: mapear(categorias.dados?.results, (c) => c.nome),
    // O `pai` liga cada subcategoria à categoria, permitindo o select encadeado.
    subcategorias: mapear(
      subcategorias.dados?.results,
      (s) => s.nome,
      (s) => String(s.categoria),
    ),
    formas: mapear(formas.dados?.results, (f) => f.nome),
    linhas: mapear(linhas.dados?.results, (l) => l.nome),
    servicos: mapear(servicos.dados?.results, (s) =>
      s.codigo ? `${s.codigo} — ${s.nome}` : s.nome,
    ),
    vendedores: mapear(vendedores.dados?.results, (v) => v.nome),
    recarregarContas: contas.recarregar,
  };
}

/** Opções fixas que espelham os IntegerChoices do backend. */
export const OPCOES_FIXAS = {
  tipoParceiro: [
    { valor: "1", rotulo: "Cliente" },
    { valor: "2", rotulo: "Fornecedor" },
    { valor: "3", rotulo: "Ambos" },
  ],
  tipoPessoa: [
    { valor: "1", rotulo: "Física" },
    { valor: "2", rotulo: "Jurídica" },
  ],
  tipoConta: [
    { valor: "1", rotulo: "Conta Corrente" },
    { valor: "2", rotulo: "Conta Poupança" },
    { valor: "3", rotulo: "Caixa" },
    { valor: "4", rotulo: "Conta de Pagamento" },
  ],
  provedor: [
    { valor: "1", rotulo: "Manual (arquivo OFX/CSV)" },
    { valor: "2", rotulo: "Asaas" },
    { valor: "3", rotulo: "C6" },
  ],
  tipoContrato: [
    { valor: "1", rotulo: "CLT" },
    { valor: "2", rotulo: "PJ" },
  ],
  tipoComissao: [
    { valor: "1", rotulo: "Percentual" },
    { valor: "2", rotulo: "Fixo" },
  ],
  statusNota: [
    { valor: "1", rotulo: "Emitida" },
    { valor: "2", rotulo: "Recebida" },
    { valor: "3", rotulo: "Cancelada" },
  ],
  ufs: [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
    "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
    "SE", "SP", "TO",
  ].map((sigla) => ({ valor: sigla, rotulo: sigla })),
} satisfies Record<string, OpcaoCampo[]>;
