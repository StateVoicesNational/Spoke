import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import Form from "react-formal";
import moment from "moment";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";
import { compose } from "recompose";

import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import loadData from "./hoc/load-data";
import withMuiTheme from "./hoc/withMuiTheme";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import theme from "../styles/theme";
import DisplayLink from "../components/DisplayLink";
import GSForm from "../components/forms/GSForm";
import CampaignTexterUIForm from "../components/CampaignTexterUIForm";
import OrganizationFeatureSettings from "../components/OrganizationFeatureSettings";
import GSTextField from "../components/forms/GSTextField";

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
    textAlign: "right"
  },
  cardHeader: {
    cursor: "pointer"
  }
});

let inlineStyles = {
  dialogButton: {
    display: "inline-block"
  },
  shadeBox: {
    backgroundColor: theme.colors.lightGray
  },
  cardHeader: {
    cursor: "pointer"
  }
};

const formatTextingHours = hour => moment(hour, "H").format("h a");
class Settings extends React.Component {
  state = {
    formIsSubmitting: false
  };

  getCardHeaderStyle() {
    return Object.assign({}, inlineStyles.cardHeader, {
      backgroundColor: this.props.muiTheme.palette.primary.main,
      color: this.props.muiTheme.palette.primary.contrastText
    });
  }

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
        maxWidth="md"
        open={!!this.state.textingHoursDialogOpen}
        onClose={this.handleCloseTextingHoursDialog}
      >
        <DialogContent>
          <GSForm
            schema={formSchema}
            onSubmit={this.handleSubmitTextingHoursForm}
            defaultValue={{ textingHoursStart, textingHoursEnd }}
          >
            <div>
              Enter the hour in 24-hour time, so e.g. 9am-9pm would be Start
              Time: 9 and End Time: 21.
            </div>
            <Form.Field
              as={GSTextField}
              label="Start time (24h)"
              name="textingHoursStart"
              type="select"
              fullWidth
              choices={hourChoices}
            />
            <Form.Field
              as={GSTextField}
              label="End time (24h)"
              name="textingHoursEnd"
              type="select"
              fullWidth
              choices={hourChoices}
            />
            <div className={css(styles.dialogActions)}>
              <Button
                variant="outlined"
                onClick={this.handleCloseTextingHoursDialog}
              >
                Cancel
              </Button>
              <Form.Submit
                as={GSSubmitButton}
                style={inlineStyles.dialogButton}
                label="Save"
              />
            </div>
          </GSForm>
        </DialogContent>
      </Dialog>
    );
  }

  handleOpenTwilioDialog = () => this.setState({ twilioDialogOpen: true });

  handleCloseTwilioDialog = () => this.setState({ twilioDialogOpen: false });

  handleSubmitTwilioAuthForm = async ({
    accountSid,
    authToken,
    messageServiceSid
  }) => {
    const res = await this.props.mutations.updateTwilioAuth(
      accountSid,
      authToken === "<Encrypted>" ? false : authToken,
      messageServiceSid
    );
    if (res.errors) {
      this.setState({ twilioError: res.errors.message });
    } else {
      this.setState({ twilioError: undefined });
    }
    this.handleCloseTwilioDialog();
  };

  renderTwilioAuthForm() {
    const { organization } = this.props.data;
    const {
      twilioAccountSid,
      twilioAuthToken,
      twilioMessageServiceSid
    } = organization;
    const allSet =
      twilioAccountSid && twilioAuthToken && twilioMessageServiceSid;
    let baseUrl = "http://base";
    if (typeof window !== "undefined") {
      baseUrl = window.location.origin;
    }
    const formSchema = yup.object({
      accountSid: yup
        .string()
        .nullable()
        .max(64),
      authToken: yup
        .string()
        .nullable()
        .max(64),
      messageServiceSid: yup
        .string()
        .nullable()
        .max(64)
    });

    const dialogActions = [
      <Button
        variant="outlined"
        style={inlineStyles.dialogButton}
        onClick={this.handleCloseTwilioDialog}
      >
        Cancel
      </Button>,
      <Form.Submit
        as={GSSubmitButton}
        label="Save"
        style={inlineStyles.dialogButton}
      />
    ];

    return (
      <Card>
        <CardHeader
          title="Twilio Credentials"
          className={css(styles.cardHeader)}
          style={{
            backgroundColor: allSet
              ? this.props.muiTheme.palette.primary.main
              : this.props.muiTheme.palette.warning.light
          }}
        />
        {allSet && (
          <CardContent style={inlineStyles.shadeBox}>
            <DisplayLink
              url={`${baseUrl}/twilio/${organization.id}`}
              textContent="Twilio credentials are configured for this organization. You should set the inbound Request URL in your Twilio messaging service to this link."
            />
          </CardContent>
        )}
        {this.state.twilioError && (
          <CardContent style={inlineStyles.shadeBox}>
            {this.state.twilioError}
          </CardContent>
        )}
        <CardContent>
          <div className={css(styles.section)}>
            <span className={css(styles.sectionLabel)}>
              You can set Twilio API credentials specifically for this
              Organization by entering them here.
            </span>
            <GSForm
              schema={formSchema}
              onSubmit={this.handleSubmitTwilioAuthForm}
              defaultValue={{
                accountSid: twilioAccountSid,
                authToken: twilioAuthToken,
                messageServiceSid: twilioMessageServiceSid
              }}
            >
              <Form.Field
                as={GSTextField}
                label="Twilio Account SID"
                name="accountSid"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Twilio Auth Token"
                name="authToken"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Default Message Service SID"
                name="messageServiceSid"
                fullWidth
              />

              <Form.Submit
                as={GSSubmitButton}
                label={this.props.saveLabel || "Save Twilio Credentials"}
                onClick={this.handleOpenTwilioDialog}
              />
              <Dialog
                actions={dialogActions}
                modal={true}
                open={this.state.twilioDialogOpen}
              >
                Changing the Account SID or Messaging Service SID will break any
                campaigns that are currently running. Do you want to contunue?
              </Dialog>
            </GSForm>
          </div>
        </CardContent>
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
          <CardHeader title="Settings" style={this.getCardHeaderStyle()} />
          <CardContent>
            <div className={css(styles.section)}>
              <GSForm
                schema={formSchema}
                onSubmit={this.props.mutations.updateOptOutMessage}
                defaultValue={{ optOutMessage }}
              >
                <Form.Field
                  as={GSTextField}
                  label="Default Opt-Out Message"
                  name="optOutMessage"
                  fullWidth
                />

                <Form.Submit
                  as={GSSubmitButton}
                  label={this.props.saveLabel || "Save Opt-Out Message"}
                />
              </GSForm>
            </div>
          </CardContent>

          <CardContent>
            <div className={css(styles.section)}>
              <span className={css(styles.sectionLabel)}></span>
              <FormControlLabel
                color="primary"
                control={
                  <Switch
                    color="primary"
                    checked={organization.textingHoursEnforced}
                    onChange={async (event, isToggled) =>
                      await this.props.mutations.updateTextingHoursEnforcement(
                        isToggled
                      )
                    }
                  />
                }
                labelPlacement="start"
                label="Enforce texting hours?"
              />
            </div>

            {organization.textingHoursEnforced && (
              <div className={css(styles.section)}>
                <span className={css(styles.sectionLabel)}>Texting hours:</span>
                <span className={css(styles.textingHoursSpan)}>
                  {formatTextingHours(organization.textingHoursStart)} to{" "}
                  {formatTextingHours(organization.textingHoursEnd)}
                </span>
                {window.TZ
                  ? ` in your organisation's local time. Timezone ${window.TZ}`
                  : " in contacts local time (or 12pm-6pm EST if timezone is unknown)"}
              </div>
            )}
          </CardContent>
          <CardActions>
            {organization.textingHoursEnforced && (
              <Button
                color="primary"
                variant="outlined"
                onClick={this.handleOpenTextingHoursDialog}
              >
                Change texting hours
              </Button>
            )}
          </CardActions>
        </Card>
        <div>{this.renderTextingHoursForm()}</div>
        {window.TWILIO_MULTI_ORG && this.renderTwilioAuthForm()}
        {this.props.data.organization &&
          this.props.data.organization.texterUIConfig &&
          this.props.data.organization.texterUIConfig.sideboxChoices.length && (
            <Card>
              <CardHeader
                title="Texter UI Defaults"
                style={this.getCardHeaderStyle()}
                action={
                  <IconButton>
                    <ExpandMoreIcon />
                  </IconButton>
                }
                onClick={() =>
                  this.setState({
                    TexterUIDefaults: !this.state.TexterUIDefaults
                  })
                }
              />
              <Collapse
                in={this.state.TexterUIDefaults}
                timeout="auto"
                unmountOnExit
              >
                <CardContent>
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
                </CardContent>
              </Collapse>
            </Card>
          )}
        {this.props.data.organization && this.props.data.organization.settings && (
          <Card>
            <CardHeader
              title="Overriding default settings"
              style={this.getCardHeaderStyle()}
              action={
                <IconButton>
                  <ExpandMoreIcon />
                </IconButton>
              }
              onClick={() =>
                this.setState({
                  OverridingDefaultSettings: !this.state
                    .OverridingDefaultSettings
                })
              }
            />
            <Collapse
              in={this.state.OverridingDefaultSettings}
              timeout="auto"
              unmountOnExit
            >
              <CardContent>
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
              </CardContent>
            </Collapse>
          </Card>
        )}

        {this.props.data.organization && this.props.params.adminPerms && (
          <Card>
            <CardHeader
              title="External configuration"
              style={this.getCardHeaderStyle()}
              action={
                <IconButton>
                  <ExpandMoreIcon />
                </IconButton>
              }
              onClick={() =>
                this.setState({
                  ExternalConfiguration: !this.state.ExternalConfiguration
                })
              }
            />
            <Collapse
              in={this.state.ExternalConfiguration}
              timeout="auto"
              unmountOnExit
            >
              <CardContent>
                <h2>DEBUG Zone</h2>
                <p>
                  Only take actions here if you know what you&rsquo;re doing
                </p>
                <Button
                  color="secondary"
                  variant="contained"
                  style={inlineStyles.dialogButton}
                  onClick={
                    this.props.mutations.clearCachedOrgAndExtensionCaches
                  }
                >
                  Clear Cached Organization And Extension Caches
                </Button>
              </CardContent>
            </Collapse>
          </Card>
        )}
      </div>
    );
  }
}

Settings.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
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
  updateTwilioAuth: ownProps => (accountSid, authToken, messageServiceSid) => ({
    mutation: gql`
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
    `,
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

export default compose(
  withMuiTheme,
  loadData({ queries, mutations })
)(Settings);
