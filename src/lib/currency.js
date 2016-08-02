export const formatMoney = (amount, currency) => {
    if (currency !== 'usd') {
        throw new Error(`Don't know how to format currency: ${currency}`)
    } else {
        return `$${(amount/100).toFixed(2)}`
    }
}