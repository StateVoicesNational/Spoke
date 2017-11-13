import { r } from '../src/server/models'
import Papa from 'papaparse'

(async function () {
  try {
    const res = await r.table('message')
      .eqJoin('assignment_id', r.table('assignment'))
      .zip()
      .filter({ campaign_id: process.env.CAMPAIGN_ID })
    const finalResults = res.map((row) => (
      {
        assignment_id: row.assignment_id,
        campaign_id: row.campaign_id,
        contact_number: row.contact_number,
        user_number: row.user_number,
        is_from_contact: row.is_from_contact,
        send_status: row.send_status,
        text: row.text
      }
    ))
    const csvResults = Papa.unparse(finalResults)
    console.log(csvResults)
  } catch (ex) {
    console.log(ex)
  }
})()
