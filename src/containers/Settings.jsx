/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import Dialog from "material-ui/Dialog";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import yup from "yup";
import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import moment from "moment";
import CampaignTexterUIForm from "../components/CampaignTexterUIForm";
import OrganizationFeatureSettings from "../components/OrganizationFeatureSettings";
import getMessagingServiceConfigComponent from "../extensions/messaging_services/react-components";

const styles = StyleSheet.create({
  section: {
    margin: "10px 0"
  },
  sectionLabel: {
    opacity: 0.8,
    marginRight: 5
  },
  textingHoursSpan: {
    fontWeight: "bold"
  },
  dialogActions: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});

const inlineStyles = {
  dialogButton: {
    display: "inline-block"
  },
  shadeBox: {
    backgroundColor: theme.colors.lightGray
  }
};

const formatTextingHours = hour => moment(hour, "H").format("h a");
class Settings extends React.Component {
  state = {
    formIsSubmitting: false
  };

  handleSubmitTextingHoursForm = async ({
    textingHoursStart,
    textingHoursEnd
  }) => {
    await this.props.mutations.updateTextingHours(
      textingHoursStart,
      textingHoursEnd
    );
    this.handleCloseTextingHoursDialog();
  };

  handleOpenTextingHoursDialog = () =>
    this.setState({ textingHoursDialogOpen: true });

  handleCloseTextingHoursDialog = () =>
    this.setState({ textingHoursDialogOpen: false });

  renderTextingHoursForm() {
    const { organization } = this.props.data;
    const { textingHoursStart, textingHoursEnd } = organization;
    const formSchema = yup.object({
      textingHoursStart: yup.number().required(),
      textingHoursEnd: yup.number().required()
    });

    const hours = new Array(24).fill(0).map((_, i) => i);
    const hourChoices = hours.map(hour => ({
      value: hour,
      label: formatTextingHours(hour)
    }));

    return (
      <Dialog
        open={this.state.textingHoursDialogOpen}
        onRequestClose={this.handleCloseTextingHoursDialog}
      >
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSubmitTextingHoursForm}
          defaultValue={{ textingHoursStart, textingHoursEnd }}
        >
          <Form.Field
            label="Start time"
            name="textingHoursStart"
            type="select"
            fullWidth
            choices={hourChoices}
          />
          <Form.Field
            label="End time"
            name="textingHoursEnd"
            type="select"
            fullWidth
            choices={hourChoices}
          />
          <div className={css(styles.dialogActions)}>
            <FlatButton
              label="Cancel"
              style={inlineStyles.dialogButton}
              onTouchTap={this.handleCloseTextingHoursDialog}
            />
            <Form.Button
              type="submit"
              style={inlineStyles.dialogButton}
              component={GSSubmitButton}
              label="Save"
            />
          </div>
        </GSForm>
      </Dialog>
    );
  }

  renderMessageServiceConfig() {
    const { id: organizationId, messageService } = this.props.data.organization;
    if (!messageService) {
      return null;
    }

    const { name, supportsOrgConfig, config } = messageService;
    if (!supportsOrgConfig) {
      return null;
    }

    const ConfigMessageService = getMessagingServiceConfigComponent(name);
    if (!ConfigMessageService) {
      return null;
    }

    return (
      <Card>
        <CardHeader
          title="Twilio Credentials"
          style={{
            backgroundColor: this.state.messageServiceAllSet
              ? theme.colors.green
              : theme.colors.yellow
          }}
        />
        <ConfigMessageService
          organizationId={organizationId}
          config={config}
          inlineStyles={inlineStyles}
          styles={styles}
          saveLabel={this.props.saveLabel}
          onSubmit={newConfig => {
            return this.props.mutations.updateMessageServiceConfig(newConfig);
          }}
          onAllSetChanged={allSet => {
            this.setState({ messageServiceAllSet: allSet });
          }}
        />
      </Card>
    );
  }

  render() {
    const { organization } = this.props.data;
    const { optOutMessage } = organization;
    const formSchema = yup.object({
      optOutMessage: yup.string().required()
    });

    return (
      <div>
        <Card>
          <CardHeader
            title="Settings"
            style={{ backgroundColor: theme.colors.green }}
          />
          <CardText>
            <div className={css(styles.section)}>
              <GSForm
                schema={formSchema}
                onSubmit={this.props.mutations.updateOptOutMessage}
                defaultValue={{ optOutMessage }}
              >
                <Form.Field
                  label="Default Opt-Out Message"
                  name="optOutMessage"
                  fullWidth
                />

                <Form.Button
                  type="submit"
                  label={this.props.saveLabel || "Save Opt-Out Message"}
                />
              </GSForm>
            </div>
          </CardText>

          <CardText>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}></span>
              <Toggle
                toggled={organization.textingHoursEnforced}
                label="Enforce texting hours?"
                onToggle={async (event, isToggled) =>
                  await this.props.mutations.updateTextingHoursEnforcement(
                    isToggled
                  )
                }
              />
            </div>

            {organization.textingHoursEnforced ? (
              <div className={css(styles.section)}>
                <span className={css(styles.sectionLabel)}>Texting hours:</span>
                <span className={css(styles.textingHoursSpan)}>
                  {formatTextingHours(organization.textingHoursStart)} to{" "}
                  {formatTextingHours(organization.textingHoursEnd)}
                </span>
                {window.TZ
                  ? ` in your organisations local time. Timezone ${window.TZ}`
                  : " in contacts local time (or 12pm-6pm EST if timezone is unknown)"}
              </div>
            ) : (
              ""
            )}
          </CardText>
          <CardActions>
            {organization.textingHoursEnforced ? (
              <FlatButton
                label="Change texting hours"
                primary
                onTouchTap={this.handleOpenTextingHoursDialog}
              />
            ) : (
              ""
            )}
          </CardActions>
        </Card>
        <div>{this.renderTextingHoursForm()}</div>
        {this.renderMessageServiceConfig()}
        {this.props.data.organization &&
        this.props.data.organization.texterUIConfig &&
        this.props.data.organization.texterUIConfig.sideboxChoices.length ? (
          <Card>
            <CardHeader
              title="Texter UI Defaults"
              style={{ backgroundColor: theme.colors.green }}
              actAsExpander
              showExpandableButton
            />
            <CardText expandable>
              <CampaignTexterUIForm
                formValues={this.props.data.organization}
                organization={this.props.data.organization}
                onSubmit={async () => {
                  const { texterUIConfig } = this.state;
                  await this.props.mutations.editOrganization({
                    texterUIConfig
                  });
                  this.setState({ texterUIConfig: null });
                }}
                onChange={formValues => {
                  console.log("change", formValues);
                  this.setState(formValues);
                }}
                saveLabel="Save Texter UI Campaign Defaults"
                saveDisabled={!this.state.texterUIConfig}
              />
            </CardText>
          </Card>
        ) : null}
        {this.props.data.organization &&
        this.props.data.organization.settings ? (
          <Card>
            <CardHeader
              title="Overriding default settings"
              style={{ backgroundColor: theme.colors.green }}
              actAsExpander
              showExpandableButton
            />
            <CardText expandable>
              <OrganizationFeatureSettings
                formValues={this.props.data.organization}
                organization={this.props.data.organization}
                onSubmit={async () => {
                  const { settings } = this.state;
                  await this.props.mutations.editOrganization({
                    settings
                  });
                  this.setState({ settings: null });
                }}
                onChange={formValues => {
                  console.log("change", formValues);
                  this.setState(formValues);
                }}
                saveLabel="Save settings"
                saveDisabled={!this.state.settings}
              />
            </CardText>
          </Card>
        ) : null}

        {this.props.data.organization && this.props.params.adminPerms ? (
          <Card>
            <CardHeader
              title="External configuration"
              style={{ backgroundColor: theme.colors.green }}
              actAsExpander
              showExpandableButton
            />
            <CardText expandable>
              <h2>DEBUG Zone</h2>
              <p>Only take actions here if you know what you&rsquo;re doing</p>
              <RaisedButton
                label="Clear Cached Organization And Extension Caches"
                secondary
                style={inlineStyles.dialogButton}
                onTouchTap={
                  this.props.mutations.clearCachedOrgAndExtensionCaches
                }
              />
            </CardText>
          </Card>
        ) : null}
      </div>
    );
  }
}

Settings.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object,
  saveLabel: PropTypes.string
};

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
          optOutMessage
          settings {
            messageHandlers
            actionHandlers
            featuresJSON
            unsetFeatures
          }
          texterUIConfig {
            options
            sideboxChoices
          }
          twilioAccountSid
          twilioAuthToken
          twilioMessageServiceSid
          messageService {
            name
            type
            supportsOrgConfig
            supportsCampaignConfig
            config
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

export const editOrganizationGql = gql`
  mutation editOrganization(
    $organizationId: String!
    $organizationChanges: OrganizationInput!
  ) {
    editOrganization(id: $organizationId, organization: $organizationChanges) {
      id
      settings {
        messageHandlers
        actionHandlers
        featuresJSON
        unsetFeatures
      }
      texterUIConfig {
        options
        sideboxChoices
      }
    }
  }
`;

export const updateMessageServiceConfigGql = gql`
  mutation updateMessageServiceConfig(
    $organizationId: String!
    $messageServiceName: String!
    $config: JSON!
  ) {
    updateMessageServiceConfig(
      organizationId: $organizationId
      messageServiceName: $messageServiceName
      config: $config
    )
  }
`;

export const updateTwilioAuthGql = gql`
  mutation updateTwilioAuth(
    $twilioAccountSid: String
    $twilioAuthToken: String
    $twilioMessageServiceSid: String
    $organizationId: String!
  ) {
    updateTwilioAuth(
      twilioAccountSid: $twilioAccountSid
      twilioAuthToken: $twilioAuthToken
      twilioMessageServiceSid: $twilioMessageServiceSid
      organizationId: $organizationId
    ) {
      id
      twilioAccountSid
      twilioAuthToken
      twilioMessageServiceSid
    }
  }
`;

const mutations = {
  editOrganization: ownProps => organizationChanges => ({
    mutation: editOrganizationGql,
    variables: {
      organizationId: ownProps.params.organizationId,
      organizationChanges
    }
  }),
  updateTextingHours: ownProps => (textingHoursStart, textingHoursEnd) => ({
    mutation: gql`
      mutation updateTextingHours(
        $textingHoursStart: Int!
        $textingHoursEnd: Int!
        $organizationId: String!
      ) {
        updateTextingHours(
          textingHoursStart: $textingHoursStart
          textingHoursEnd: $textingHoursEnd
          organizationId: $organizationId
        ) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      textingHoursStart,
      textingHoursEnd
    }
  }),
  updateTextingHoursEnforcement: ownProps => textingHoursEnforced => ({
    mutation: gql`
      mutation updateTextingHoursEnforcement(
        $textingHoursEnforced: Boolean!
        $organizationId: String!
      ) {
        updateTextingHoursEnforcement(
          textingHoursEnforced: $textingHoursEnforced
          organizationId: $organizationId
        ) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      textingHoursEnforced
    }
  }),
  updateOptOutMessage: ownProps => ({ optOutMessage }) => ({
    mutation: gql`
      mutation updateOptOutMessage(
        $optOutMessage: String!
        $organizationId: String!
      ) {
        updateOptOutMessage(
          optOutMessage: $optOutMessage
          organizationId: $organizationId
        ) {
          id
          optOutMessage
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      optOutMessage
    }
  }),
  updateMessageServiceConfig: ownProps => newConfig => ({
    mutation: updateMessageServiceConfigGql,
    variables: {
      organizationId: ownProps.params.organizationId,
      messageServiceName: ownProps.data.organization.messageService.name,
      config: JSON.stringify(newConfig)
    }
  }),
  updateTwilioAuth: ownProps => (accountSid, authToken, messageServiceSid) => ({
    mutation: updateTwilioAuthGql,
    variables: {
      organizationId: ownProps.params.organizationId,
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
      twilioMessageServiceSid: messageServiceSid
    }
  }),
  clearCachedOrgAndExtensionCaches: ownProps => () => ({
    mutation: gql`
      mutation clearCachedOrgAndExtensionCaches($organizationId: String!) {
        clearCachedOrgAndExtensionCaches(organizationId: $organizationId)
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  })
};

export default loadData({ queries, mutations })(Settings);
