import PropTypes from 'prop-types'
import React from 'react'
import { newLoadData } from './hoc/load-data'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import yup from 'yup'

const styles = StyleSheet.create({
  infoContainer: {
    ...theme.layouts.greenBox,
    textAlign: 'left',
    padding: 20
  },
  header: {
    ...theme.text.header,
    color: theme.colors.white,
    borderBottom: '1px solid white'
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.darkGray,
    backgroundColor: theme.colors.lightGray
  },
  fromContactMessage: {
    ...theme.text.body,
    backgroundColor: theme.colors.lightGreen,
    textAlign: 'right',
    padding: 5
  },
  message: {
    ...theme.text.body,
    textAlign: 'left',
    padding: 5
  },
  formContainer: {
    width: '60%',
    backgroundColor: theme.colors.white,
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    marginLeft: 'auto',
    marginRight: 'auto'
  }
})

class AdminReplySender extends React.Component {
  formSchema = yup.object({
    message: yup.string().required()
  })

  renderMessageSendingForm(contact) {
    return (
      <div className={css(styles.infoContainer)}>
        <div className={css(styles.header)}>
          {`${contact.firstName} ${contact.lastName}: ${contact.cell}`}
        </div>
        <div className={css(styles.subtitle)}>
          {contact.messages.map((message) => (
            <div className={message.isFromContact ? css(styles.fromContactMessage) : css(styles.message)}>
              {message.text}
            </div>
          ))}
        </div>
        <div className={css(styles.formContainer)}>
          <GSForm
            schema={this.formSchema}
            onSubmit={async (formValues) => {
              await this.props.mutations.sendReply(contact.id, formValues.message)
            }}
          >
            <Form.Field
              name='message'
              label='Reply'
              hintText='Reply'
              fullWidth
            />
            <Form.Button
              type='submit'
              label='Send'
              name='submit'
              secondary
              fullWidth
            />
          </GSForm>
        </div>
      </div>
    )
  }

  render() {
    const { getCampaignMessages } = this.props
    return (
      <div>
        {getCampaignMessages.campaign.contacts.map((contact) => {
          if (contact.messageStatus === 'messaged') {
            return this.renderMessageSendingForm(contact)
          }
          return ''
        })}
      </div>
    )
  }
}

AdminReplySender.propTypes = {
  getCampaignMessages: PropTypes.object,
  mutations: PropTypes.object
}

const queries = {
  getCampaignMessages: {
    gql: gql`query getCampaignMessages($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        contacts {
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
    }`,
    options: (props) => ({
      variables: { campaignId: props.params.campaignId }
    })
  }
}

const mutations = {
  sendReply: {
    gql: gql`
      mutation sendReply($contactId: String!, $message: String!) {
        sendReply(id: $contactId, message: $message) {
          id
          messages {
            text
            isFromContact
          }
        }
      }
    `
  }
}

export default newLoadData({ queries, mutations })(AdminReplySender)
