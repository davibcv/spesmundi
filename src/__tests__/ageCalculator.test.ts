import { describe, it, expect } from 'vitest';
import { calculateDetailedAge } from '../domain/ageCalculator';

describe('calculateDetailedAge', () => {
  it('calcula anos e meses completos exatamente', () => {
    const age = calculateDetailedAge('2022-02-14', '2024-05-14');
    expect(age.years).toBe(2);
    expect(age.months).toBe(3);
    expect(age.days).toBe(0);
    expect(age.formatted).toBe('2 anos e 3 meses');
  });

  it('calcula anos completos sem meses residuais', () => {
    const age = calculateDetailedAge('2022-02-14', '2026-02-14');
    expect(age.years).toBe(4);
    expect(age.months).toBe(0);
    expect(age.days).toBe(0);
    expect(age.formatted).toBe('4 anos completos');
  });

  it('lida corretamente com virada de mês em ano bissexto', () => {
    const age = calculateDetailedAge('2024-02-29', '2024-03-31');
    expect(age.years).toBe(0);
    expect(age.months).toBe(1);
    expect(age.days).toBe(2);
  });

  it('rejeita formato de data inválido', () => {
    expect(() => calculateDetailedAge('data-invalida')).toThrow();
  });
});
