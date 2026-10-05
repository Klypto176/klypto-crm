// App-wide currency formatting: Indian Rupee with Indian digit grouping (₹1,00,000).
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const CURRENCY_SYMBOL = "₹";

export const formatCurrency = (value, { paise = false } = {}) => {
  const n = Number(value) || 0;
  return (paise ? inrFormatterWithPaise : inrFormatter).format(n);
};
