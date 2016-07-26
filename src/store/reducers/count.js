import { ADD_COUNT } from '../actions'

export default function (state = 0, action) {
  if (action.type === ADD_COUNT) {
    return state + action.payload
  }
  return state
}
