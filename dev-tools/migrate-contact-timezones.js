import { r } from '../server/models'
import Baby from 'babyparse'

(async function () {
  try {
    const contacts = await r.table('campaign_contact')
    .get('0003008e-8b57-4990-8941-c44928294d3d')

    console.log("contact", contact)
  } catch (ex) {
    console.log(ex)
  }
})()
