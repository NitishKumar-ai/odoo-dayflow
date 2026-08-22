export type SalaryParts = {
  currency: string;
  basic: string;
  hra: string;
  allowances: string;
  deductions: string;
};

export function gross(s: SalaryParts): number {
  return Number(s.basic) + Number(s.hra) + Number(s.allowances);
}

export function net(s: SalaryParts): number {
  return gross(s) - Number(s.deductions);
}

export function formatMoney(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}
