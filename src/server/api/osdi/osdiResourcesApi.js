import { r } from '../../models'
import _ from 'lodash'
import { getTimezoneByZip, getOptOutSubQuery } from '../../../workers/jobs'
import { log } from '../../../lib'

import { getValidatedData } from '../../../lib'
import apiAuth from './api-auth'
import osdi from './osdi'
import osdiUtil from './osdiUtil'
import osdiTranslate from './osdiTranslate'

function pluralize(singular){
  // lamest pluralize function ever
  var wierdos={
    "person": "people"

  }
  if (wierdos[singular]) {
    return wierdos[singular];
  } else {
    return singular.concat("s");
  }
}

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

async function getInteractionSteps(req) {
  var steps=await r
      .knex('interaction_step')
      .where({campaign_id: req.params.campaignId})
      .orderBy('id','asc')

  var questions=_.map(steps, function(step) {
    var q=step;
    var responses=_.map(_.filter(steps,function(sstep){
      return (sstep.parent_interaction_id == step.id)
    }), function(child){
      return child.answer_option
    })
    q.responses=responses
    return q
  })
  return questions;

}

async function getInteractionStep(req,id) {
  var steps=await getInteractionSteps(req);
  return _.find(steps, function(s) { return s.id == id})
}

async function findMyWhere(req,res,options) {
  var where;

  switch (true) {
    case (options.slicer == 'user_messages'):
      let user_id = req.params.id;
      let campaign_id = req.params.campaignId;
      let assignment = await r.knex('assignment')
          .where({campaign_id: campaign_id, user_id: user_id})
          .limit(1).first()

      where = {assignment_id: assignment.id};
      break;

    default:
      where = {

      }
  }
  if ( ['campaign_contact','interaction_step','assignment','campaign'].includes(options.resource_type)) {
    where.campaign_id=req.params.campaignId
  }
  return where;
}

export default async function osdiResourcesApi(req, res, options) {

  try {
    const orgId = req.params.orgId;

    const resource_type = options.resource_type;
    let where = options.where;

    if (typeof where === 'undefined') {

      where = await findMyWhere(req, res, options);
    }

    let orderBy = options.orderBy || ['created_at', 'desc']

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
      if (apiAuth.campaignStatusShortCircuit(campaign, res)) {
        return
      }
    }

    let resp = null

    let resources = null
    let resource = null
    let resources_promise = null


    if (options.single == true && req.params.id && req.method === 'GET') {

      switch (true) {

        case (resource_type == 'interaction_step'):
          resource = await getInteractionStep(req, req.params.id)

          break;

        default:

          resource = await r
              .knex(resource_type)
              .where({id: req.params.id})
              .limit(1).first();
      }

      if (!resource) {
        res.writeHead(404);
        res.end('Not Found');
        return
      }

      resp = await osdi.translate_resource_to_osdi(resource, req, options);

    } else if (req.method === 'GET') {

      var count;

      /*
      ?per_page specifies how many results to return per page.
  ?page specifies the starting page to start with.
       */

      const base_url = process.env.BASE_URL
      const per_page = parseInt(req.query.per_page || 20);
      const page = parseInt(req.query.page || 0);

      const offset = page * per_page;

      switch (true) {

        case resource_type === 'interaction_step':

          resources = await getInteractionSteps(req);
          count = resources.length;

          break;

        case options.root_messages == true:

          count = await r.getCount(
              r.knex(resource_type)
                  .where('assignment.campaign_id', req.params.campaignId)
                  .join('assignment', 'message.assignment_id', '=', 'assignment.id')
          )

          resources = await r
              .knex(resource_type)
              .where('assignment.campaign_id', req.params.campaignId)
              .join('assignment', 'message.assignment_id', '=', 'assignment.id')
              .orderBy('message.created_at', 'desc')
              .offset(offset)
              .limit(per_page);
          break;

        case options.root_answers == true:

          var query=r
              .knex
              .select('question_response.*')
              .from('question_response')
              .join('interaction_step','question_response.interaction_step_id', '=', 'interaction_step.id')
              .where({'interaction_step.campaign_id': req.params.campaignId})


            orderBy = ['question_response.created_at','desc']
            resources_promise = query.clone()

          break;

        case options.people_messages == true:

          var query=r
              .knex(resource_type)
              .where({'campaign_contact.id': req.params.id})
              .join('campaign_contact','message.contact_number','=','campaign_contact.cell')

          count=await r.getCount(
                query.clone()
            )

          resources = await query
              .orderBy('message.created_at','desc')
              .offset(offset)
              .limit(per_page)

          break;

        default:
          var query = r
              .knex(resource_type)
              .where(where)


          resources_promise = query.clone()

      }

      if ( ! resources && resources_promise ) {
        if ( req.query.filter ) {
          resources_promise=resources_promise.where(...osdiTranslate.odata_filter_to_where(req.query.filter, resource_type))
        }
        count = await r.getCount(
            resources_promise.clone()
        )
        resources_promise = resources_promise
            .orderBy(...orderBy)
            .offset(offset)
            .limit(per_page);


        resources = await resources_promise
      }
      var embedded_key = "osdi:".concat(pluralize(osdi.spoke_to_osdi_type(resource_type)));

      let _embedded = {}

      var capture;

      capture = await Promise.all(_.map(resources, async function (resource) {
        return await osdi.translate_resource_to_osdi(resource, req, options)
      }))

      _embedded[embedded_key] = capture;

      resp = {

        total_records: parseInt(count),
        page: page,
        _embedded: _embedded,
        _links: {
          self: {
            href: base_url.concat(req.originalUrl)
          },
          next: (resources.length > 0) ? {
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
      if (resp._links) {
        resp._links['osdi:aep'] = {
          href: osdiUtil.osdiAEP(req),
          title: "Go to Entry Point"
        }
      }
      res.writeHead(200, {'Content-Type': osdiUtil.serverContentType()})
      res.end(JSON.stringify(resp, null, 2))
    } else {
      res.writeHead(500, {'Content-Type': osdiUtil.serverContentType()})
      res.end(JSON.stringify({error: 'Internal server error'}))
    }
  } catch(ex) {
    log.error(ex)
    res.writeHead(500, {'Content-Type': osdiUtil.serverContentType()})
    res.end(JSON.stringify({error: ex}))
  }
}
