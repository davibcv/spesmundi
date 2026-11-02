import { DetailedAge } from '../types/education';

export function calculateDetailedAge(birthDateStr: string, referenceDateStr?: string): DetailedAge {
  const birth = new Date(birthDateStr + 'T00:00:00');
  const ref = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();

  if (isNaN(birth.getTime())) {
    throw new Error('Data de nascimento inválida');
  }

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();

  if (days < 0) {
    const prevMonthDays = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    days += prevMonthDays;
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = Math.max(0, ref.getTime() - birth.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalMonths = Math.max(0, years * 12 + months);

  let formatted = '';
  if (years === 0 && months === 0) {
    formatted = days === 1 ? '1 dia' : days + ' dias';
  } else if (years === 0) {
    formatted = months === 1 ? '1 mês' : months + ' meses';
    if (days > 0) {
      formatted += ' e ' + (days === 1 ? '1 dia' : days + ' dias');
    }
  } else {
    const yearStr = years === 1 ? '1 ano' : years + ' anos';
    if (months === 0) {
      formatted = yearStr + ' completos';
    } else {
      const monthStr = months === 1 ? '1 mês' : months + ' meses';
      formatted = yearStr + ' e ' + monthStr;
    }
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalMonths,
    totalDays,
    formatted
  };
}
