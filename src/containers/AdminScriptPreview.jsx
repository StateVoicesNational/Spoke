import React from "react";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { applyScript } from '../lib/scripts';
import loadData from "./hoc/load-data";
import SortBy, {
  DUE_DATE_DESC_SORT
} from "../components/AdminCampaignList/SortBy";

const containerStyles = {
    display: 'flex',
    alignItems: 'center',
};

const boldStyle = {
    fontWeight: 'bold'
};



export class AdminScriptPreview extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedCampaign:'',
            selectedContact: {},
            customFields: '',
            cannedResponses: '',
            scripts: ''
        };
    };

    handleSelectedContact = (e) => {
        if(e.target.value != '') {
            let contact = this.state.selectedCampaign.contacts[e.target.value]
            this.setState({
                selectedContact: contact
            }, () => {
                let scriptArray = this.state.selectedCampaign.interactionSteps.map(this.generateScripts)
                let cannedResponseArray = this.state.selectedCampaign.cannedResponses.map(this.generateCannedResponse)
                this.setState({
                    scripts: scriptArray,
                    cannedResponses: cannedResponseArray
                })
            })
        } else {
            this.setState({
                selectedContact: ''
            })
        }
    }

    handleSelectedCampaign = (e) => {
        if(e.target.value != ''){
            let campaign = this.props.data.organization.campaigns.campaigns[e.target.value]
            this.setState({
                selectedCampaign: campaign,
                customFields: campaign.customFields,
                scripts: '',
                selectedContact: '',
                cannedResponses: ''

            })
        } else {
            this.setState({
                selectedCampaign: '',
                selectedContact: '',
                customFields: '',
                cannedResponses: '',
                scripts: ''
            })
        }
    }

    generateCannedResponse = (obj) => {
        return {
            title: obj.title,
            cannedResponse: applyScript({
                script: obj.text,
                contact: this.state.selectedContact,
                customFields: this.state.customFields,
                texter: {}
            })
        }
    }

    generateScripts = (obj) => {
        return {
            answer: obj.answerOption,
            question: applyScript({
                script: obj.questionText,
                contact: this.state.selectedContact,
                customFields: this.state.customFields,
                texter: {}
            }),
            script: applyScript({
                script: obj.script,
                contact: this.state.selectedContact,
                customFields: this.state.customFields,
                texter: {}
            })
        }
    }

  render() {
    const {selectedCampaign} = this.state;
    const {scripts} = this.state;
    const {cannedResponses} = this.state;

    return (
        <div>
            <div style={containerStyles}>
                <h3 style={{marginRight: "5px"}}>Select a campaign to preview the script of:</h3>
                <select onChange={this.handleSelectedCampaign}>
                    <option value="">Select a campaign</option>
                    {this.props.data.organization.campaigns.campaigns.map((campaign, index) => (
                        <option key={index} value={index}>{campaign.title}</option>
                    ))}
                </select>
            </div>
            {selectedCampaign != '' ?
                <div>
                    <h2>{selectedCampaign.title}</h2>
                    <div style={containerStyles}>
                        <h3 style={{marginRight: "5px"}}>Select a contact to preview the script with:</h3>
                        <select onChange={this.handleSelectedContact}>
                            <option value="">Select a contact</option>
                            {selectedCampaign.contacts.map((contact, index) => (
                                <option key={index} value={index}>{contact.firstName} {contact.lastName}</option>
                            ))}
                        </select>
                    </div>
                    {scripts != '' ?
                        <div>
                            <h3>Script</h3>
                            {scripts.map((script, index) => (
                                <div key={index}>
                                    {script.answer ? <p><span style={boldStyle}>Answer: </span>{script.answer}</p> : null}
                                    {script.script ? <p><span style={boldStyle}>Script: </span>{script.script}</p> : null}
                                    {script.question ? <p><span style={boldStyle}>Question: </span>{script.question}</p> : null}
                                </div>
                            ))}
                        </div>
                    : null}
                    {cannedResponses != '' ?
                        <div style={{marginTop: '20px'}}>
                            <h3>Canned Responses</h3>
                            {cannedResponses.map((response, index) => (
                                <div key={index}>
                                    <p><span style={boldStyle}>Title: </span>{response.title}</p>
                                    <p><span style={boldStyle}>Canned Response: </span>{response.cannedResponse}</p>
                                </div>
                            ))}
                        </div>
                    : null}
                </div>
            :
            <div>
                No campaign has been selected
            </div>
            }
        </div>
    );
  }
}


const INITIAL_FILTER = {
    isArchived: false,
    searchString: ""
  };
  const INITIAL_SORT_BY = DUE_DATE_DESC_SORT.value;

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  isArchivedPermanently
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  timezone
  dueBy
  organization {
    id
  }
  creator {
    displayName
  }
  ingestMethod {
    success
    contactsCount
  }
  contacts {
    id
    firstName
    lastName
    messageStatus
    updatedAt
    customFields
  }
  customFields
  cannedResponses {
    id
    title
    text
    isUserCreated
  }
  interactionSteps {
    id
    questionText
    script
    answerOption
    answerActions
    answerActionsData
    parentInteractionId
    isDeleted
  }
  completionStats {
    assignedCount
    contactsCount
    errorCount
    messagedCount
    needsResponseCount
  }
`;

export const getCampaignsQuery = gql`
  query adminGetCampaigns(
    $organizationId: String!,
    $campaignsFilter: CampaignsFilter,
    $cursor: OffsetLimitCursor,
    $sortBy: SortCampaignsBy) {
  organization(id: $organizationId) {
    id
    cacheable
    campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
      ... on CampaignsList {
        campaigns {
          ${campaignInfoFragment}
        }
      }
      ... on PaginatedCampaigns {
        pageInfo {
          offset
          limit
          total
        }
        campaigns {
          ${campaignInfoFragment}
        }
      }
    }
  }
}
`;

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns(
        $organizationId: String!,
        $campaignsFilter: CampaignsFilter,
        $cursor: OffsetLimitCursor,
        $sortBy: SortCampaignsBy) {
      organization(id: $organizationId) {
        id
        cacheable
        campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
          ... on PaginatedCampaigns{
              pageInfo {
                offset
                limit
                total
              }
              campaigns{
                ${campaignInfoFragment}
              }
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        cursor: { offset: 0, limit: 50 },
        organizationId: ownProps.params.organizationId,
        campaignsFilter: INITIAL_FILTER,
        sortBy: INITIAL_SORT_BY
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(withRouter(AdminScriptPreview));
