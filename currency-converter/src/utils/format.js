export function formatMoney(value, currency = "USD") {
  const n = Number(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 6,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `${currency} ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
  }
}
