import PropTypes from "prop-types";
import React from "react";
import { gql } from "@apollo/client";
import Form from "react-formal";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";

import loadData from "./hoc/load-data";
import theme from "../styles/theme";
import GSForm from "../components/forms/GSForm";
import GSTextField from "../components/forms/GSTextField";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import { dataTest } from "../lib/attributes";
import withMuiTheme from "../containers/hoc/withMuiTheme";

class AdminReplySender extends React.Component {
  formSchema = yup.object({
    message: yup.string().required()
  });

  styles = StyleSheet.create({
    infoContainer: {
      ...theme.layouts.greenBox,
      textAlign: "left",
      padding: 20
    },
    header: {
      ...theme.text.header,
      borderBottom: "1px solid"
    },
    subtitle: {
      ...theme.text.body
    },
    fromContactMessage: {
      ...theme.text.body,
      backgroundColor: this.props.muiTheme.palette.action.hover,
      textAlign: "right",
      padding: 5
    },
    message: {
      ...theme.text.body,
      textAlign: "left",
      padding: 5
    },
    formContainer: {
      width: "60%",
      marginTop: 15,
      marginBottom: 15,
      paddingLeft: 15,
      paddingRight: 15,
      paddingBottom: 15,
      marginLeft: "auto",
      marginRight: "auto"
    }
  });

  renderMessageSendingForm(contact, key) {
    return (
      <div key={key} className={css(this.styles.infoContainer)}>
        <div className={css(this.styles.header)}>
          {`${contact.firstName} ${contact.lastName}: ${contact.cell}`}
        </div>
        <div className={css(this.styles.subtitle)}>
          {contact.messages.map((message, index) => (
            <div
              key={index}
              className={
                message.isFromContact
                  ? css(this.styles.fromContactMessage)
                  : css(this.styles.message)
              }
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className={css(this.styles.formContainer)}>
          <GSForm
            schema={this.formSchema}
            onSubmit={async formValues => {
              await this.props.mutations.sendReply(
                contact.id,
                formValues.message
              );
            }}
          >
            <Form.Field
              as={GSTextField}
              {...dataTest("reply")}
              name="message"
              label="Reply"
              hintText="Reply"
              fullWidth
            />
            <Form.Submit
              {...dataTest("send")}
              as={GSSubmitButton}
              label="Send"
              name="submit"
              fullWidth
            />
          </GSForm>
        </div>
      </div>
    );
  }

  render() {
    const { data } = this.props;
    return (
      <div>
        {data.campaign.contacts.map((contact, index) => {
          if (contact.messageStatus !== "needsMessage") {
            return this.renderMessageSendingForm(contact, index);
          }
          return "";
        })}
      </div>
    );
  }
}

AdminReplySender.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCampaignMessages($campaignId: String!) {
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
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.params.campaignId
      }
    })
  }
};

const mutations = {
  sendReply: ownProps => (contactId, message) => ({
    mutation: gql`
      mutation sendReply($contactId: String!, $message: String!) {
        sendReply(id: $contactId, message: $message) {
          id
          messages {
            text
            isFromContact
          }
        }
      }
    `,
    variables: { contactId, message }
  })
};

const enhancedAdminReplySender = withMuiTheme(
  loadData({ queries, mutations })(AdminReplySender)
);

export default enhancedAdminReplySender;
