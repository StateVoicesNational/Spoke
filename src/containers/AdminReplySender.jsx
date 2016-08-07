import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

const AdminReplySender = ({ data }) => {
  return (
    <div>
      {data.campaign.contacts.data.map((contact) => {
        if (contact.messageStatus === 'messaged') {
          return <div>{contact.firstName}</div>
        }
        return ''
      })}
    </div>
  )
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getCampaignMessages($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        contacts {
          data {
            id
            firstName
            lastName
            cell
            messageStatus
            messages {
              text
              isFromContact
            }
          }
        }
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId
    }
  }
})

export default loadData(AdminReplySender, { mapQueriesToProps })