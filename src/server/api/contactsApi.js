import { r } from '../models'

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
      break

    case 'POST':
      if (campaignaStatusShortCircuit(campaign, res)) {
        break
      }
      break
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(resp))
}
