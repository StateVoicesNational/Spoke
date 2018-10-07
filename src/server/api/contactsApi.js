import { r } from '../models'

export default async function contactsApi(req, res, next) {
  const orgId = req.params.orgId
  const campaignId = req.params.campaignId

  

  if (req.method === 'GET') {
    const count = await r
      .knex('campaign_contact')
      .where({ campaign_id: campaignId })
      .count('*')

    const resp = { contacts: count[0] }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(resp))
  }
}
