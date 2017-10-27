import { log } from '../lib'

export default (error) => {
  if (!error) {
    log.error('Uncaught exception with null error object')
    return
  }

  log.error(error)
}
