import type { Campo } from "@/components/ui/ModalFormulario";
import type { useOpcoes } from "@/lib/api/opcoes";

type Opcoes = ReturnType<typeof useOpcoes>;

/**
 * Campos de Contas a Pagar e a Receber.
 *
 * Os dois títulos têm exatamente os mesmos campos na planilha — mudam só o
 * parceiro (fornecedor ou cliente) e os rótulos. Compartilhar a definição faz
 * o formulário do menu superior e o da própria tela permanecerem idênticos.
 */
export function camposTitulo(tipo: "pagar" | "receber", opcoes: Opcoes): Campo[] {
  const ehPagar = tipo === "pagar";
  const hoje = new Date().toISOString().slice(0, 10);

  return [
    {
      nome: "parceiro",
      rotulo: ehPagar ? "Fornecedor" : "Cliente",
      tipo: "selecao",
      opcoes: ehPagar ? opcoes.fornecedores : opcoes.clientes,
      obrigatorio: true,
      largura: "inteira",
    },
    {
      nome: "numero_documento",
      rotulo: "Nº do documento",
      tipo: "texto",
      obrigatorio: true,
      placeholder: ehPagar ? "NF-2026-001" : "REC-2026-001",
    },
    {
      nome: "valor",
      rotulo: "Valor (R$)",
      tipo: "numero",
      passo: "0.01",
      obrigatorio: true,
      placeholder: "0,00",
    },
    {
      nome: "emissao",
      rotulo: "Emissão",
      tipo: "data",
      obrigatorio: true,
      padrao: hoje,
    },
    {
      nome: "competencia",
      rotulo: "Competência",
      tipo: "data",
      obrigatorio: true,
      padrao: hoje,
      ajuda: "Mês a que o título pertence — base do Balancete.",
    },
    {
      nome: "vencimento",
      rotulo: "Vencimento",
      tipo: "data",
      obrigatorio: true,
    },
    {
      nome: "forma_pagamento",
      rotulo: "Forma de pagamento",
      tipo: "selecao",
      opcoes: opcoes.formas,
    },
    {
      nome: "natureza",
      rotulo: "Natureza",
      tipo: "selecao",
      opcoes: opcoes.naturezas,
      secao: "Classificação",
    },
    {
      nome: "centro_custo",
      rotulo: "Centro de custo",
      tipo: "selecao",
      opcoes: opcoes.centros,
      secao: "Classificação",
    },
    {
      nome: "categoria",
      rotulo: "Categoria",
      tipo: "selecao",
      opcoes: opcoes.categorias,
      secao: "Classificação",
    },
    {
      nome: "subcategoria",
      rotulo: "Subcategoria",
      tipo: "selecao",
      opcoes: opcoes.subcategorias,
      dependeDe: "categoria",
      secao: "Classificação",
    },
    {
      nome: "juros",
      rotulo: "Juros (R$)",
      tipo: "numero",
      passo: "0.01",
      padrao: "0",
      secao: "Encargos",
    },
    {
      nome: "multa",
      rotulo: "Multa (R$)",
      tipo: "numero",
      passo: "0.01",
      padrao: "0",
      secao: "Encargos",
    },
    {
      nome: "observacoes",
      rotulo: "Observações",
      tipo: "textarea",
    },
  ];
}
