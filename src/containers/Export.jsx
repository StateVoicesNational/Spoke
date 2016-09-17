import React from 'react'
import moment from 'moment'
import { isClient, log } from '../lib'
import gql from 'graphql-tag'
import Papa from 'papaparse'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'

class Export extends React.Component {
  state = {
    exporting: 'Preparing data'
  }
  componentDidMount() {
    const props = this.props

    if (!props.data.loading) {
      this.setState({ exporting: 'Creating CSV...' })
      log.debug('Starting to download data...')
      const allQuestions = {}
      const questionCount = {}
      log.debug("Getting props.data.campaign", props.data.campaign)
      props.data.campaign.interactionSteps.forEach((step) => {
        if (!step.question.text || step.question.text.trim() === '') {
          return
        }

        if (questionCount.hasOwnProperty(step.question.text)) {
          questionCount[step.question.text] += 1
        } else {
          questionCount[step.question.text] = 0
        }
        const currentCount = questionCount[step.question.text]
        if (currentCount > 0) {
          allQuestions[step.id] = `${step.question.text}_${currentCount}`
        } else {
          allQuestions[step.id] = step.question.text
        }
      })
      const convertedAssignments = props.data.campaign.assignments.map((assignment) => (
        assignment.contacts.map((contact) => {
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
            'contact[city]': contact.location ? contact.location.city : null,
            'contact[state]': contact.location ? contact.location.state : null,
            'contact[optOut]': contact.optOut ? 'true' : 'false',
            'contact[messageStatus]': contact.messageStatus
          }
          Object.keys(contact.customFields).forEach((fieldName) => {
            contactRow[`contact[${fieldName}]`] = contact.customFields[fieldName]
          })
          Object.keys(allQuestions).forEach((stepId) => {
            let value = ''
            contact.questionResponses.forEach((response) => {
              if (response.question.interactionStep.id === stepId) {
                value = response.value
              }
            })
            contactRow[`question[${allQuestions[stepId]}]`] = value
          })
          return contactRow
        })
      )).reduce((prev, row) => prev.concat(row), [])
      console.log("GOT HERE", convertedAssignments)
      log.debug('Converting to csv...')
      const csv = Papa.unparse(convertedAssignments)
      log.debug('Data converted.')
      if (isClient()) {
        this.setState({ exporting: 'Downloading...' })
        this.downloadCSV(csv, props.data.campaign)
        log.debug('Download complete!')
      }

      this.setState({ exporting: false })
      const { organizationId, campaignId } = this.props.params

      this.props.router.push(`/admin/${organizationId}/campaigns/${campaignId}`)
    }
  }

  downloadCSV(csv, campaign) {
    const blob = new Blob([csv])
    const a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(blob, { type: 'text/plain' })
    a.download = `${campaign.title} - ${moment(new Date()).format('YYYY-MM-DD')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  render() {
    return (
      <div>
        {this.state.exporting || ''}
      </div>
    )
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query exportCampaign($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        title
        interactionSteps {
          id
          question {
            text
          }
        }
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
                interactionStep {
                  id
                }
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
    }`,
    variables: { campaignId: ownProps.params.campaignId },
    forceFetch: true
  }
})

export default loadData(withRouter(Export), { mapQueriesToProps })
