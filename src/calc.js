// Regras de cálculo do saldo residual (valores sempre em centavos, inteiros).

export const STATUS_13 = {
  NENHUMA: 'nenhuma',
  PRIMEIRA: 'primeira',
  AMBAS: 'ambas',
};

/** "2026-03-10" -> { ano: 2026, mes: 3, dia: 10 } (ou null se inválida) */
export function parseData(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return { ano, mes, dia };
}

export function diasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

/** "1.500,50" / "1500.50" / "1500" -> 150050 centavos (ou null) */
export function parseMoeda(texto) {
  if (texto == null) return null;
  let s = String(texto).trim().replace(/[R$\s]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatarMoeda(centavos) {
  return fmt.format(centavos / 100);
}

/**
 * Dias considerados no mês do óbito (mês comercial de 30 dias).
 * Óbito no último dia do mês conta o mês inteiro (30).
 */
export function diasMesObito(obito) {
  if (obito.dia === diasNoMes(obito.ano, obito.mes)) return 30;
  return Math.min(obito.dia, 30);
}

/** Saldo do mês do óbito: MR / 30 × dias */
export function saldoMes(mrCentavos, obito) {
  return Math.round((mrCentavos * diasMesObito(obito)) / 30);
}

/**
 * Meses (avos) de 13º no ano do óbito. Fração de mês ≥ 15 dias conta como mês cheio.
 * Se a DIB estiver no mesmo ano, conta a partir dela.
 */
export function meses13(obito, dib) {
  if (dib && compararDatas(dib, obito) > 0) return 0;
  let inicioMes = 1;
  let inicioDia = 1;
  if (dib && dib.ano === obito.ano) {
    inicioMes = dib.mes;
    inicioDia = dib.dia;
  }
  let meses = 0;
  for (let m = inicioMes; m <= obito.mes; m++) {
    const d1 = m === inicioMes ? Math.min(inicioDia, 30) : 1;
    const d2 = m === obito.mes ? diasMesObito(obito) : 30;
    if (d2 - d1 + 1 >= 15) meses++;
  }
  return meses;
}

/** 13º proporcional: MR / 12 × meses */
export function decimoTerceiro(mrCentavos, meses) {
  return Math.round((mrCentavos * meses) / 12);
}

/** Valor padrão de 13º já recebido conforme as parcelas pagas. */
export function recebidoPadrao(mrCentavos, status) {
  if (status === STATUS_13.PRIMEIRA) return Math.round(mrCentavos / 2);
  if (status === STATUS_13.AMBAS) return mrCentavos;
  return 0;
}

function compararDatas(a, b) {
  return a.ano - b.ano || a.mes - b.mes || a.dia - b.dia;
}

/**
 * Calcula o resíduo de um benefício.
 * @param {{ mr: number, dib?: object|null, status13: string, recebido13?: number|null, sem13?: boolean }} ben
 *   sem13: benefício sem direito a 13º (ex.: BPC/LOAS) — entra só o saldo do mês.
 * @param {{ ano, mes, dia }} obito
 */
export function calcularBeneficio(ben, obito) {
  const dias = diasMesObito(obito);
  const saldo = saldoMes(ben.mr, obito);
  if (ben.sem13) {
    return { dias, saldo, sem13: true, meses: 0, decimo: 0, recebido: 0, residuo: saldo };
  }
  const meses = meses13(obito, ben.dib);
  const decimo = decimoTerceiro(ben.mr, meses);
  const recebido =
    ben.status13 === STATUS_13.NENHUMA
      ? 0
      : ben.recebido13 ?? recebidoPadrao(ben.mr, ben.status13);
  return {
    dias,
    sem13: false,
    saldo,
    meses,
    decimo,
    recebido,
    residuo: saldo + decimo - recebido,
  };
}
