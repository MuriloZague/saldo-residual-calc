import { describe, expect, it } from 'vitest';
import {
  STATUS_13,
  calcularBeneficio,
  meses13,
  parseData,
  parseMoeda,
  saldoMes,
} from './calc.js';

const d = parseData;

describe('parseMoeda', () => {
  it('aceita formatos pt-BR e ponto decimal', () => {
    expect(parseMoeda('1.500,00')).toBe(150000);
    expect(parseMoeda('1500,5')).toBe(150050);
    expect(parseMoeda('1500.50')).toBe(150050);
    expect(parseMoeda('R$ 1.518,00')).toBe(151800);
    expect(parseMoeda('abc')).toBeNull();
    expect(parseMoeda('')).toBeNull();
  });
});

describe('saldoMes', () => {
  it('MR/30 × dias', () => {
    expect(saldoMes(150000, d('2026-03-10'))).toBe(50000);
  });
  it('óbito no dia 31 conta 30 dias', () => {
    expect(saldoMes(150000, d('2026-03-31'))).toBe(150000);
  });
  it('óbito no último dia de fevereiro conta mês cheio', () => {
    expect(saldoMes(150000, d('2026-02-28'))).toBe(150000);
    expect(saldoMes(150000, d('2028-02-28'))).toBe(140000); // bissexto
  });
});

describe('meses13', () => {
  it('mês do óbito com menos de 15 dias não conta', () => {
    expect(meses13(d('2026-03-10'))).toBe(2);
  });
  it('mês do óbito com 15 dias ou mais conta', () => {
    expect(meses13(d('2026-03-15'))).toBe(3);
    expect(meses13(d('2026-12-31'))).toBe(12);
  });
  it('DIB no mesmo ano conta a partir dela', () => {
    expect(meses13(d('2026-06-20'), d('2026-03-20'))).toBe(3); // mar(11d) não; abr, mai, jun
    expect(meses13(d('2026-06-20'), d('2026-03-10'))).toBe(4);
    expect(meses13(d('2026-06-20'), d('2020-01-01'))).toBe(6);
  });
  it('DIB depois do óbito dá zero', () => {
    expect(meses13(d('2026-06-20'), d('2026-07-01'))).toBe(0);
  });
});

describe('calcularBeneficio', () => {
  it('sem 13º recebido', () => {
    const r = calcularBeneficio({ mr: 150000, status13: STATUS_13.NENHUMA }, d('2026-03-10'));
    expect(r).toMatchObject({ saldo: 50000, meses: 2, decimo: 25000, recebido: 0, residuo: 75000 });
  });
  it('1ª parcela recebida pode deixar resíduo negativo', () => {
    const r = calcularBeneficio({ mr: 150000, status13: STATUS_13.PRIMEIRA }, d('2026-06-05'));
    // saldo 250,00 + 13º 5/12 = 625,00 - 750,00 = 125,00
    expect(r).toMatchObject({ saldo: 25000, decimo: 62500, recebido: 75000, residuo: 12500 });
    const r2 = calcularBeneficio({ mr: 150000, status13: STATUS_13.PRIMEIRA }, d('2026-04-05'));
    expect(r2.residuo).toBe(25000 + 37500 - 75000);
  });
  it('benefício sem 13º (BPC/LOAS) considera só o saldo do mês', () => {
    const r = calcularBeneficio(
      { mr: 151800, status13: STATUS_13.PRIMEIRA, recebido13: 50000, sem13: true },
      d('2026-09-10'),
    );
    expect(r).toMatchObject({ saldo: 50600, decimo: 0, recebido: 0, residuo: 50600 });
  });
  it('valor recebido informado manualmente substitui o padrão', () => {
    const r = calcularBeneficio(
      { mr: 150000, status13: STATUS_13.AMBAS, recebido13: 140000 },
      d('2026-12-20'),
    );
    expect(r.recebido).toBe(140000);
    expect(r.residuo).toBe(100000 + 150000 - 140000);
  });
});
