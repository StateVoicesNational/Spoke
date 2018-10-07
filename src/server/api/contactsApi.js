import { r } from '../models'

export default async function contactsApi(req, res) {
  const orgId = req.params.orgId
  const campaignId = req.params.campaignId

  if (!['GET', 'DELETE', 'POST'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, POST, DELETE' })
    res.end('Not allowed')
    return
  }

  const campaignCount = await r
    .knex('campaign')
    .where({ organization_id: orgId, id: campaignId })
    .count('*')

  if (parseInt(campaignCount[0].count) === 0) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  if (req.method === 'GET') {
    const count = await r
      .knex('campaign_contact')
      .where({ campaign_id: campaignId })
      .count('*')

    const resp = { contacts: { count: parseInt(count[0].count) } }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(resp))
  }
}
