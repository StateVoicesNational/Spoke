import { r } from '../../models'
import _ from 'lodash'
import { getTimezoneByZip, getOptOutSubQuery } from '../../../workers/jobs'
import { log } from '../../../lib'

import { getValidatedData } from '../../../lib'
import apiAuth from './api-auth'
import osdi from './osdi'


function campaignStatusShortCircuit(campaign, res) {
  let message = ''
  if (campaign.is_archived) {
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

export default async function contactsApi(req, res) {
  const orgId = req.params.orgId;

  try {
    if (await apiAuth.authShortCircuit(req, res, orgId)) {
      return
    }

    if (!['GET', 'DELETE', 'POST'].includes(req.method)) {
      res.writeHead(405, {Allow: 'GET, POST, DELETE'})
      res.end('Not allowed')
      return
    }

    const campaignId = req.params.campaignId

    const [campaign] = await r
        .knex('campaign')
        .select()
        .where({organization_id: orgId, id: campaignId})

    if (!campaign) {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    if (['DELETE', 'POST'].includes(req.method)) {
      if (campaignStatusShortCircuit(campaign, res)) {
        return
      }
    }

    let resp = null

    if (req.params.contactId && req.method === 'GET') {

      const contact = await r
          .knex('campaign_contact')
          .where({campaign_id: campaignId, id: req.params.contactId})
          .limit(1).first();

      if (!contact) {
        res.writeHead(404);
        res.end('Not Found');
        return
      }

      resp = osdi.translate_contact_to_osdi_person(contact, req);

    } else if (req.method === 'GET') {
      const count = await r.getCount(
          r.knex('campaign_contact').where({campaign_id: campaignId})
      );

      /*
      ?per_page specifies how many results to return per page.
  ?page specifies the starting page to start with.
       */

      const base_url = process.env.BASE_URL
      const per_page = parseInt(req.query.per_page || 20);
      const page = parseInt(req.query.page || 0);

      const offset = page * per_page;

      const contacts = await r
          .knex('campaign_contact')
          .where({campaign_id: campaignId})
          .offset(offset)
          .limit(per_page);


      resp = {

        total_records: parseInt(count),
        page: page,

        _embedded: {
          "osdi:people": await Promise.all(_.map(contacts, async (contact) => await osdi.translate_resource_to_osdi(contact, req, {resource_type: 'campaign_contact'})))
        },
        _links: {
          self: {
            href: base_url.concat(req.originalUrl)
          },
          next: (contacts.length > 0) ? {
            href: base_url.concat(req.baseUrl, "?per_page=", per_page, "&page=", page + 1)

          } : undefined,
          prev: (page > 0) ? {
            href: base_url.concat(req.baseUrl, "?per_page=", per_page, "&page=", page - 1)
          } : undefined
        }
      }
    } else if (req.method === 'DELETE') {
      const deleted = await r
          .knex('campaign_contact')
          .where({campaign_id: campaignId})
          .delete()

      resp = {contacts: {deleted}}
    } else if (req.method === 'POST') {
      const osdi_body = req.body;
      var people = undefined;
      if (osdi_body.person) {
        people = [osdi_body.person];
      } else if (osdi_body.signups) {
        people = _.map(osdi_body.signups, (signup) => signup.person);
      } else {
        res.writeHead(400)
        var err = osdi.osdi_error(400, "Signup requires either a person attribute or signups array");
        res.end(JSON.stringify(err))
        return
      }

      var inputRows;

      if (people) {
        inputRows = _.map(people, (person) => osdi.translate_osdi_person_to_input_row(person));

      } else {
        inputRows = req.body
      }

      const {validationStats, validatedData} = getValidatedData(inputRows, []);

      const successResponse = {
        invalid: _.concat(
            validationStats.invalidCellRows,
            validationStats.missingCellRows
        ),
        dupes_in_batch: validationStats.dupeCount,
        number_submitted: inputRows.length
      }

      let validatedContactsToSave = validatedData

      if (!('duplicate_existing' in req.query)) {
        const existingContacts = await r
            .knex('campaign_contact')
            .select('cell')
            .whereIn('cell', validatedData.map(contact => contact.cell))
            .andWhere({campaign_id: campaignId})

        const existingContactCells = new Set(
            existingContacts.map(contact => contact.cell)
        )

        const dedupedContactsToSave = _.filter(
            validatedData,
            contact => !existingContactCells.has(contact.cell)
        )

        successResponse.dupes_in_campaign =
            validatedData.length - dedupedContactsToSave.length

        validatedContactsToSave = dedupedContactsToSave
      }

      const standardFields = [
        'first_name',
        'last_name',
        'cell',
        'external_id',
        'zip',
        'timezone_offset'
      ]

      const contactsToSavePromises = validatedContactsToSave.map(
          async contact => {
            const contactToSave = _.pick(contact, standardFields)
            const customFields = _.omit(contact, standardFields)
            contactToSave.custom_fields = JSON.stringify(customFields)
            if (!contactToSave.timezone_offset) {
              contactToSave.timezone_offset = await getTimezoneByZip(
                  contactToSave.zip
              )
            }

            return contactToSave
          }
      )

      const contactsToSave = await Promise.all(contactsToSavePromises)
      console.log(contactsToSave)
      await r.knex
          .transaction(async tr => {
            await tr
                .batchInsert(
                    'campaign_contact',
                    contactsToSave.map(row => {
                      row.campaign_id = campaignId
                      return _.omitBy(row, v => v === null)
                    }),
                    req.body.length
                )
                .then(async () => {
                  const optOutCellCount = await tr('campaign_contact')
                      .whereIn('cell', getOptOutSubQuery(orgId))
                      .where('campaign_id', campaignId)
                      .delete()

                  successResponse.opted_out = optOutCellCount
                  successResponse.added =
                      validatedContactsToSave.length - optOutCellCount
                })
          })
          .then(function () {
            resp = osdi.translate_success_to_import_helper_response(successResponse, req)
          })
          .catch(function (error) {
            resp = {error}
            console.log(error)
          })
    }

    if (resp) {
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(resp, null, 2))
    } else {
      res.writeHead(500, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({error: 'Internal server error'}))
    }
  } catch (ex) {
    log.error(ex)
    res.writeHead(500, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({error: ex}))
  }

}
