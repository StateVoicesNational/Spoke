export const ADD_COUNT = 'ADD_COUNT'

export function addCount(amount) {
  return {
    type: ADD_COUNT,
    payload: amount
  }
}
