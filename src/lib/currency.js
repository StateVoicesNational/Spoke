export const formatMoney = (amount, currency) => {
  return `$${(amount / 100).toFixed(2)}`
}
