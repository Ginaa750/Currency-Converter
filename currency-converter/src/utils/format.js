export function formatMoney(value, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 6,
    }).format(Number(value) || 0);
  } catch {
    // Fallback for obscure codes
    const v = (Number(value) || 0).toFixed(2);
    return `${currency} ${v}`;
  }
}
