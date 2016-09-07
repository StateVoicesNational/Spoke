import { r } from '../src/server/models'
import Baby from 'babyparse'

(async function () {
  try {
    const res = await r.table('question_response')
      .merge((row) => ({
        campaign_contact: r.table('campaign_contact')
          .get(row('campaign_contact_id'))
      }))
      .merge((row) => ({
        interaction_step: r.table('interaction_step')
          .get(row('interaction_step_id'))
      }))
      .merge((row) => ({
        campaign: r.table('campaign')
          .get(row('campaign_contact')('campaign_id'))
      }))
      .merge((row) => ({
        organization: r.table('organization')
          .get(row('campaign')('organization_id'))
      }))
      .filter({ interaction_step: null })
      .group(r.row('campaign')('id'))
    const finalResults = res.map((doc) => (
      doc.reduction.map((row) => ({
        organization: row.organization.name,
        'campaign[title]': row.campaign.title,
        'contact[cell]': row.campaign_contact.cell,
        'contact[first_name]': row.campaign_contact.first_name,
        'contact[last_name]': row.campaign_contact.last_name,
        interaction_step_id: row.interaction_step_id,
        value: row.value
      }))
      .reduce((left, right) => left.concat(right), [])
    )).reduce((left, right) => left.concat(right), [])

    console.log(finalResults[0])
    const csvResults = Baby.unparse(finalResults)
    console.log(csvResults)
  } catch (ex) {
    console.log(ex)
  }
})()
