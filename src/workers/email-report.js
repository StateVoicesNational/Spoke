import { r } from '../server/models'
import { sendEmail } from '../server/mail'
import moment from 'moment'
import { groupBy } from 'lodash'

const SQL = (strings, ...values) => {
  // Interweave the strings with the
  // substitution vars first.
  let output = ''
  for (let i = 0; i < values.length; i += 1) {
    output += strings[i] + values[i]
  }
  output += strings[values.length]

  // Split on newlines.
  const lines = output.split(/(?:\r\n|\n|\r)/)

  // Rip out the leading whitespace.
  return lines.map(line => line.replace(/^\s+/gm, '')).join(' ').trim()
}

(async () => {
  try {
    const yesterday = moment().subtract(1, 'day').format('dddd, MMM Do')
    const allowedRoles = [
      'OWNER'
    ]

    const users = await r.knex('user_organization')
      .distinct(r.knex.raw(SQL`
          o.id AS organization_id,
          initcap(o.name) AS organization_name,
          u.id AS user_id,
          u.first_name AS user_first_name,
          u.first_name || u.last_name AS user_name,
          u.email AS user_email
      `))
      .join('user AS u', 'u.id', 'user_id')
      .join('organization AS o', 'o.id', 'organization_id')
      .whereIn('role', allowedRoles)

    const orgUserGroups = groupBy(users, 'organization_id')

    await Promise.all(Object.keys(orgUserGroups).map(async orgId => {
      const campaignResults = await r.knex.select(r.knex.raw(SQL`
        c.title AS campaign,
        c.description,
        texters::int,
        texts_sent::int,
        replies::int,
        total_texts::int,
        opt_outs::int,
        ROUND((((texters * 1) / 30)  + ((total_texts) * .0075)), 2) AS cost,
        (SELECT array_to_json(array_agg(row_to_json(t))) FROM (
          SELECT campaign_id,
            question,
            value AS answer,
            COUNT(DISTINCT campaign_contact_id)
          FROM interaction_step AS i
          INNER JOIN question_response AS r ON r.interaction_step_id = i.id
          WHERE i.campaign_id = c.id
          AND r.created_at >= CURRENT_DATE - INTERVAL '1 day'
          GROUP BY 1,2,3
        ) AS t) AS responses
        FROM campaign AS c
        INNER JOIN (
          SELECT campaign_id,
            COUNT(DISTINCT a.user_id) AS texters,
            COUNT(DISTINCT (
              CASE WHEN m.is_from_contact = 'f' THEN m.id END
            )) AS texts_sent,
            COUNT(DISTINCT (
              CASE WHEN m.is_from_contact = 't' THEN m.id END
            )) AS replies,
            COUNT(DISTINCT m.id) AS total_texts,
            COUNT(DISTINCT o.id) AS opt_outs
          FROM assignment AS a
          INNER JOIN message AS m ON m.assignment_id = a.id
            AND m.created_at >= CURRENT_DATE - INTERVAL '1 day'
          LEFT JOIN opt_out AS o ON o.assignment_id = a.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '1 day'
          GROUP BY 1
        ) AS m ON m.campaign_id = c.id
        WHERE c.organization_id = ${orgId}
        AND texts_sent::int > 0
      `))

      const userGroup = orgUserGroups[orgId]
      const orgName = userGroup[0].organization_name

      let html = `<p>There were no Spoke results to report for ${orgName} from ${yesterday}.</p>`

      if (campaignResults.length) {
        const campaignTables = campaignResults.map(({
          campaign, description, responses, ...results
        }) => {
          let responseHTML = 'No question answers'
          if (responses && responses.length) {
            const questionGroup = groupBy(responses, 'question')
            responseHTML = Object.keys(questionGroup).map((question) => (`
              <div style="width:100%;">
                <div><b>Question:</b> ${question}</div>
                <table style="font-size:11px">
                  <tr>
                    ${questionGroup[question].map(({ answer }) => (`
                      <th style="width: 100px">${answer}</th>
                    `)).join(' ')}
                  </tr>
                  <tr>
                    ${questionGroup[question].map(({ count }) => (`
                      <td style="text-align:center">
                        ${count}
                      </td>
                    `)).join(' ')}
                  </tr>
                </table>
              </div>
            `)).join('<br>')
          }

          return (`
            <div style="margin-right:15px;padding:10px;border:2px solid #888;border-radius:3px;min-width:420px;max-width:700px">
              <div><b>${campaign}</b></div>
              <div><em>${description}</em></div>
              <br>
              <table style="width:100%;">
                <tr>
                  <th>Texters</th>
                  <th>Texts Sent</th>
                  <th>Replies</th>
                  <th>Total Texts</th>
                  <th>Opt Outs</th>
                  <th>Cost</th>
                </tr>
                <tr>
                  <td style="text-align:center">
                    ${results.texters.toLocaleString()}
                  </td>
                  <td style="text-align:center">
                    ${results.texts_sent.toLocaleString()}
                  </td>
                  <td style="text-align:center">
                    ${results.replies.toLocaleString()}
                  </td>
                  <td style="text-align:center">
                    ${results.total_texts.toLocaleString()}
                  </td>
                  <td style="text-align:center">
                    ${results.opt_outs.toLocaleString()}
                  </td>
                  <td style="text-align:center">
                    $${results.cost}
                  </td>
                </tr>
              </table>
              <br>
              <div>${responseHTML}</div>
            </div>
          `)
        })

        html = `
          <p>
            Hi all, here are the Spoke texting results by campaign for ${orgName} from ${yesterday}:
          </p>
          <br>
          <p>${campaignTables.join('<br><br><br>')}</p>
        `
      }

      return sendEmail({
        to: userGroup.map(u => u.user_email).join(', '),
        subject: `Results for ${orgName} – ${yesterday}`,
        html
      })
    }))

    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
