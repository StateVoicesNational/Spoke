import { r } from '../src/server/models'
import Baby from 'babyparse'

(async function () {
  try {
    const res = await r.table('message')
      .eqJoin('assignment_id', r.table('assignment'))
      .zip()
      .filter({ campaign_id: '05c84d0d-ed6c-4297-a553-ce64931e1af7' })
    const finalResults = res.map((row) => (
      {
        assignment_id: row['assignment_id'],
        campaign_id: row['campaign_id'],
        contact_number: row['contact_number'],
        user_number: row['user_number'],
        is_from_contact: row['is_from_contact'],
        send_status: row['send_status'],
        text: row['text']
      }
    ))
    const csvResults = Baby.unparse(finalResults)
    console.log(csvResults)
  } catch (ex) {
    console.log(ex)
  }
})()
