import React from 'react'
import moment from 'moment'
import { isClient, log } from '../lib'
import { connect } from 'react-apollo'
import gql from 'graphql-tag'
import Papa from 'papaparse'

class Export extends React.Component {
  componentWillReceiveProps(props) {
    if (!props.data.loading) {
      log.debug('Starting to download data...')
      const convertedAssignments = props.data.campaign.assignments.map((assignment) => {
        return assignment.contacts.data.map((contact) => {
          let contactRow = {
            'texter[firstName]': assignment.texter.firstName,
            'texter[lastName]': assignment.texter.lastName,
            'texter[email]': assignment.texter.email,
            'texter[cell]': assignment.texter.cell,
            'texter[assignedCell]': assignment.texter.assignedCell,
            'contact[firstName]': contact.firstName,
            'contact[lastName]': contact.lastName,
            'contact[cell]': contact.cell,
            'contact[zip]': contact.zip,
            'contact[city]': contact.location.city,
            'contact[state]': contact.location.state,
            'contact[optOut]': contact.optOut ? 'true' : 'false',
            'contact[messageStatus]': contact.messageStatus
          }
          Object.keys(contact.customFields).forEach((fieldName) => {
            contactRow[`contact[${fieldName}]`] = contact.customFields[fieldName]
          })
          contact.questionResponses.forEach((response) => {
            contactRow[`question[${response.question.text}]`] = response.value
          })
          return contactRow
        })
      }).reduce((prev, row) => prev.concat(row))
      log.debug('Converting to csv...')
      const csv = Papa.unparse(convertedAssignments)
      log.debug('Data converted.')
      if (isClient()) {
        log.debug('Downloading...')
        this.downloadCSV(csv, props.data.campaign)
        log.debug('Download complete!')
      }
      props.onComplete()
    }
  }

  downloadCSV(csv, campaign) {
    const blob = new Blob([csv])
    const a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(blob, {type: 'text/plain'})
    a.download = `${campaign.title} - ${moment(new Date()).format('YYYY-MM-DD')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  render() {
    return <div style={{display: 'hidden'}}></div>
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query exportCampaign($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        title
        assignments {
          id
          texter {
            id
            firstName
            lastName
            email
            cell
            assignedCell
          }
          contacts {
            data {
              id
              firstName
              lastName
              cell
              zip
              customFields
              questionResponses {
                value
                question {
                  text
                }
              }
              location {
                city
                state
              }
              optOut {
                id
                cell
              }
              messageStatus
            }
          }
        }
      }
    }`,
    variables: { campaignId: ownProps.campaign.id },
    forceFetch: true
  }
})

export default connect({
  mapQueriesToProps
})(Export)