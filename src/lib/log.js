import minilog from 'minilog'
import { isClient } from './is-client'
const rollbar = require('rollbar')
let logInstance = null

if (isClient()) {
  minilog.enable()
  logInstance = minilog('client')
  const existingErrorLogger = logInstance.error
  logInstance.error = (...err) => {
    const errObj = err
    window.Rollbar.error(...errObj)
    existingErrorLogger.call(...errObj)
  }
} else {
  let enableRollbar = false
  if (process.env.NODE_ENV === 'production') {
    enableRollbar = true
    rollbar.init(process.env.ROLLBAR_ACCESS_TOKEN)
  }

  minilog.suggest.deny(/.*/, process.env.NODE_ENV === 'development' ? 'debug' : 'debug')

  minilog.enable()
    .pipe(minilog.backends.console.formatWithStack)
    .pipe(minilog.backends.console)

  logInstance = minilog('backend')
  const existingErrorLogger = logInstance.error
  logInstance.error = (err) => {
    if (enableRollbar) {
      if (typeof err === 'object') {
        rollbar.handleError(err)
      } else if (typeof err === 'string') {
        rollbar.reportMessage(err)
      } else {
        rollbar.reportMessage('Got backend error with no error message')
      }
    }

    existingErrorLogger(err && err.stack ? err.stack : err)
  }
}

const log = logInstance
export { log }
