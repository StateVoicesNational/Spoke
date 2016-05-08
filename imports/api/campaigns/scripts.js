export const delimiters = {
  startDelimiter: '{',
  endDelimiter: '}'
}

export const delimit = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  return `${startDelimiter}${text}${endDelimiter}`
}