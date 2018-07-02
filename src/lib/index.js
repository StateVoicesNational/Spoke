import zlib from 'zlib'
export { getFormattedPhoneNumber, getDisplayPhoneNumber } from './phone-format'
export { getFormattedZip, zipToTimeZone, findZipRanges, getCommonZipRanges } from './zip-format'
export {
  convertOffsetsToStrings,
  getLocalTime,
  isBetweenTextingHours,
  defaultTimezoneIsBetweenTextingHours,
  getOffsets
} from './timezones'
export {
  getProcessEnvTz
} from './tz-helpers'
export {
  DstHelper
} from './dst-helper'
export {
  isClient
} from './is-client'
import { log } from './log'
export { log }
import Papa from 'papaparse'
import _ from 'lodash'
import { getFormattedPhoneNumber, getFormattedZip } from '../lib'
export {
  findParent,
  getInteractionPath,
  getInteractionTree,
  sortInteractionSteps,
  interactionStepForId,
  getTopMostParent,
  getChildren,
  makeTree
} from './interaction-step-helpers'
const requiredUploadFields = ['firstName', 'lastName', 'cell']
const topLevelUploadFields = ['firstName', 'lastName', 'cell', 'zip', 'external_id']

export { ROLE_HIERARCHY, getHighestRole, hasRole, isRoleGreater } from './permissions'

const getValidatedData = (data, optOuts) => {
  const optOutCells = optOuts.map((optOut) => optOut.cell)
  let validatedData
  let result
  // For some reason destructuring is not working here
  result = _.partition(data, (row) => !!row.cell)
  validatedData = result[0]
  const missingCellRows = result[1]

  validatedData = _.map(validatedData, (row) => _.extend(row, {
    cell: getFormattedPhoneNumber(row.cell, process.env.PHONE_NUMBER_COUNTRY || 'US') }))
  result = _.partition(validatedData, (row) => !!row.cell)
  validatedData = result[0]
  const invalidCellRows = result[1]

  const count = validatedData.length
  validatedData = _.uniqBy(validatedData, (row) => row.cell)
  const dupeCount = (count - validatedData.length)

  result = _.partition(validatedData, (row) => optOutCells.indexOf(row.cell) === -1)
  validatedData = result[0]
  const optOutRows = result[1]

  validatedData = _.map(validatedData, (row) => _.extend(row, {
    zip: row.zip ? getFormattedZip(row.zip) : null
  }))
  const zipCount = validatedData.filter((row) => !!row.zip).length

  return {
    validatedData,
    validationStats: {
      dupeCount,
      optOutCount: optOutRows.length,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length,
      zipCount
    }
  }
}

export const gzip = (str) => (
  new Promise((resolve, reject) => {
    zlib.gzip(str, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
)

export const gunzip = (buf) => (
  new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
)

export const parseCSV = (file, optOuts, callback) => {
  Papa.parse(file, {
    header: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors }, file) => {
      const fields = meta.fields

      const missingFields = []

      for (const field of requiredUploadFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field)
        }
      }

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(', ')}`
        callback({ error })
      } else {
        const { validationStats, validatedData } = getValidatedData(data, optOuts)

        const customFields = fields.filter((field) => topLevelUploadFields.indexOf(field) === -1)

        callback({
          customFields,
          validationStats,
          contacts: validatedData
        })
      }
    }
  })
}

export const convertRowToContact = (row) => {
  const customFields = row
  const contact = {}
  for (const field of topLevelUploadFields) {
    if (_.has(row, field)) {
      contact[field] = row[field]
    }
  }

  contact.customFields = customFields
  return contact
}

// From: https://stackoverflow.com/a/23945027
export const extractHostname = (url) => {
  let hostname = ''

  // Find and remove protocol (http, ftp, etc.) and get hostname
  if (url.indexOf('://') > -1) {
    hostname = url.split('/')[2]
  } else {
    hostname = url.split('/')[0]
  }

  // Find and remove port number
  hostname = hostname.split(':')[0]
  // Find and remove "?"
  hostname = hostname.split('?')[0]

  return hostname
}
