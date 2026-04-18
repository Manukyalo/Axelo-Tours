export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};
