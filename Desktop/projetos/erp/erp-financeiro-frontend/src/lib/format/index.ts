/**
 * Formatação pt-BR.
 *
 * A interface apenas formata: nenhum cálculo financeiro é refeito aqui. Todo
 * valor exibido vem pronto da API.
 */

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NUMERO = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Aceita string (como o DRF serializa Decimal) ou number. */
export function paraNumero(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function moeda(valor: string | number | null | undefined): string {
  return MOEDA.format(paraNumero(valor));
}

export function numero(valor: string | number | null | undefined): string {
  return NUMERO.format(paraNumero(valor));
}

export function percentual(valor: string | number | null | undefined): string {
  return `${NUMERO.format(paraNumero(valor))}%`;
}

export function data(valor: string | null | undefined): string {
  if (!valor) return "—";
  // Datas ISO puras (AAAA-MM-DD) são montadas manualmente para não sofrerem
  // deslocamento de fuso ao virar Date.
  const partes = valor.slice(0, 10).split("-");
  if (partes.length !== 3) return valor;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function dataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function competencia(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [ano, mes] = valor.split("-");
  const nomes = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const indice = Number(mes) - 1;
  return nomes[indice] ? `${nomes[indice]}/${ano}` : valor;
}

/** Primeiro e último dia do ano corrente — período padrão dos relatórios. */
export function periodoPadrao(): { inicio: string; fim: string } {
  const ano = new Date().getFullYear();
  return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
}
