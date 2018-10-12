import { r } from '../models'
import _ from 'lodash'
import { getTimezoneByZip, getOptOutSubQuery } from '../../workers/jobs'

import { getValidatedData } from '../../lib'

function campaignaStatusShortCircuit(campaign, res) {
  let message = ''
  if (campaign.is_archivedj) {
    message = 'Campaign is archived'
  } else if (campaign.is_started) {
    message = 'Campaign is started'
  }

  if (message) {
    res.writeHead(403)
    res.end(message)
    return true
  }

  return false
}

// TODO(lperson) enforce that this is not reentrant
// TODO(lperson) enforce auth
export default async function contactsApi(req, res) {
  const orgId = req.params.orgId
  const campaignId = req.params.campaignId

  if (!['GET', 'DELETE', 'POST'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, POST, DELETE' })
    res.end('Not allowed')
    return
  }

  const campaignArray = await r
    .knex('campaign')
    .select()
    .where({ organization_id: orgId, id: campaignId })

  if (campaignArray.length !== 1) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const campaign = campaignArray[0]

  let resp = {}

  switch (req.method) {
    case 'GET':
      const count = await r
        .knex('campaign_contact')
        .where({ campaign_id: campaignId })
        .count('*')

      resp = { contacts: { count: parseInt(count[0].count) } }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(resp))
      break

    case 'DELETE':
      if (campaignaStatusShortCircuit(campaign, res)) {
        break
      }

      const deleted = await r
        .knex('campaign_contact')
        .delete()
        .where({ campaign_id: campaignId })

      resp = { contacts: { deleted } }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(resp))
      break

    case 'POST':
      if (campaignaStatusShortCircuit(campaign, res)) {
        break
      }

      const { validationStats, validatedData } = getValidatedData(req.body, [])

      const successResponse = {
        invalid: _.concat(
          validationStats.invalidCellRows,
          validationStats.missingCellRows
        ),
        dupesInBatch: validationStats.dupeCount,
        numberSubmitted: req.body.length
      }

      const standardFields = [
        'first_name',
        'last_name',
        'cell',
        'external_id',
        'zip'
      ]

      const contactsToSavePromises = validatedData.map(async contact => {
        const contactToSave = _.pick(contact, standardFields)
        const customFields = _.omit(contact, standardFields)
        contactToSave.custom_fields = JSON.stringify(customFields)
        contactToSave.timezone_offset = await getTimezoneByZip(
          contactToSave.zip
        )
        return contactToSave
      })

      const contactsToSave = await Promise.all(contactsToSavePromises)

      await r.knex
        .transaction(async tr => {
          const existingContacts = await tr('campaign_contact')
            .select('cell')
            .whereIn('cell', contactsToSave.map(contact => contact.cell))
            .andWhere({ campaign_id: campaignId })

          const existingContactCells = new Set(
            existingContacts.map(contact => contact.cell)
          )

          const dedupedContactsToSave = _.filter(
            contactsToSave,
            contact => !existingContactCells.has(contact.cell)
          )

          successResponse['dupesInCampaign'] =
            contactsToSave.length - dedupedContactsToSave.length

          await tr
            .batchInsert(
              'campaign_contact',
              dedupedContactsToSave.map(row => {
                row.campaign_id = campaignId
                return _.omitBy(row, (v, k) => v === null)
              }),
              req.body.length
            )
            .then(async () => {
              const optOutCellCount = await tr('campaign_contact')
                .whereIn('cell', getOptOutSubQuery(orgId))
                .where('campaign_id', campaignId)
                .delete()

              successResponse['optedOut'] = optOutCellCount
              successResponse['added'] =
                dedupedContactsToSave.length - optOutCellCount
            })
        })
        .then(function() {
          resp = successResponse
        })
        .catch(function(error) {
          resp = { error }
          console.log(error)
        })

      resp = { resp }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(resp))
  }
}
