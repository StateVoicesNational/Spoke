/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import Form from "react-formal";
import moment from "moment";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";

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
import loadData from "../hoc/load-data";
import withSetTheme from "../hoc/withSetTheme";
import GSSubmitButton from "../../components/forms/GSSubmitButton";
import GSForm from "../../components/forms/GSForm";
import CampaignTexterUIForm from "../../components/CampaignTexterUIForm";
import OrganizationFeatureSettings from "../../components/OrganizationFeatureSettings";
import { getServiceVendorComponent } from "../../extensions/service-vendors/components";
import { getServiceManagerComponent } from "../../extensions/service-managers/components";
import GSTextField from "../../components/forms/GSTextField";
import ThemeEditor from "./themeEditor";

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

const formatTextingHours = hour => moment(hour, "H").format("h a");
class Settings extends React.Component {
  state = {
    formIsSubmitting: false
  };

  inlineStyles = {
    dialogButton: {
      display: "inline-block"
    },
    shadeBox: {
      backgroundColor: this.props.muiTheme.palette.action.hover
    },
    cardHeader: {
      cursor: "pointer"
    },
    errorBox: {
      backgroundColor: this.props.muiTheme.palette.action.hover,
      color: this.props.muiTheme.palette,
      fontWeight: "bolder"
    }
  };

  getCardHeaderStyle() {
    return Object.assign({}, this.inlineStyles.cardHeader, {
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
                style={this.inlineStyles.dialogButton}
                label="Save"
              />
            </div>
          </GSForm>
        </DialogContent>
      </Dialog>
    );
  }

  renderServiceManagers() {
    const {
      id: organizationId,
      serviceManagers
    } = this.props.data.organization;
    if (!serviceManagers.length) {
      return null;
    }
    const allFullyConfigured = serviceManagers
      .map(sm => sm.fullyConfigured !== false)
      .reduce((a, b) => a && b, true);
    return (
      <Card>
        <CardHeader
          title={"Service Management"}
          style={{
            backgroundColor: allFullyConfigured
              ? this.props.muiTheme.palette.success.main
              : this.props.muiTheme.palette.warning.main
          }}
        />
        <CardContent>
          {serviceManagers.map(sm => {
            const ServiceManagerComp = getServiceManagerComponent(
              sm.name,
              "OrgConfig"
            );
            const serviceManagerName = sm.name;
            return (
              <Card key={sm.name}>
                <CardHeader
                  title={sm.displayName}
                  style={{
                    backgroundColor:
                      sm.fullyConfigured === true
                        ? this.props.muiTheme.palette.success.main
                        : sm.fullyConfigured === false
                        ? this.props.muiTheme.palette.warning.main
                        : this.props.muiTheme.palette.grey[300]
                  }}
                />
                <CardContent>
                  <ServiceManagerComp
                    serviceManagerInfo={sm}
                    organizationId={organizationId}
                    inlineStyles={this.inlineStyles}
                    styles={styles}
                    saveLabel={this.props.saveLabel}
                    onSubmit={updateData =>
                      this.props.mutations.updateServiceManager(
                        serviceManagerName,
                        updateData
                      )
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  renderServiceVendorConfig() {
    const { id: organizationId, serviceVendor } = this.props.data.organization;
    if (!serviceVendor) {
      return null;
    }

    const { name, supportsOrgConfig, config } = serviceVendor;
    if (!supportsOrgConfig) {
      return null;
    }
    const component = getServiceVendorComponent(name);
    const ConfigServiceVendor = component.OrgConfig;
    if (!ConfigServiceVendor) {
      return null;
    }

    return (
      <Card>
        <CardHeader
          title={`${name.toUpperCase().charAt(0) + name.slice(1)} Config`}
          style={{
            backgroundColor: this.state.serviceVendorAllSet
              ? this.props.muiTheme.palette.success.main
              : this.props.muiTheme.palette.warning.main
          }}
        />
        <ConfigServiceVendor
          organizationId={organizationId}
          config={config}
          inlineStyles={this.inlineStyles}
          styles={styles}
          saveLabel={this.props.saveLabel}
          onSubmit={newConfig => {
            return this.props.mutations.updateServiceVendorConfig(newConfig);
          }}
          onAllSetChanged={allSet => {
            this.setState({ serviceVendorAllSet: allSet });
          }}
          requestRefetch={async () => {
            return this.props.data.refetch();
          }}
        />
      </Card>
    );
  }

  render() {
    const { organization } = this.props.data;
    const { optOutMessage, id: organizationId } = organization;
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

          <CardContent>
            <ThemeEditor organizationId={organizationId} />
          </CardContent>
        </Card>
        <div>{this.renderTextingHoursForm()}</div>
        {this.renderServiceManagers()}
        {this.renderServiceVendorConfig()}
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
                  variant="outlined"
                  style={this.inlineStyles.dialogButton}
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
          serviceVendor {
            id
            name
            supportsOrgConfig
            config
          }
          serviceManagers {
            id
            name
            displayName
            supportsOrgConfig
            data
            fullyConfigured
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

export const updateServiceVendorConfigGql = gql`
  mutation updateServiceVendorConfig(
    $organizationId: String!
    $serviceName: String!
    $config: JSON!
  ) {
    updateServiceVendorConfig(
      organizationId: $organizationId
      serviceName: $serviceName
      config: $config
    ) {
      id
      config
    }
  }
`;

export const updateServiceManagerGql = gql`
  mutation updateServiceManager(
    $organizationId: String!
    $serviceManagerName: String!
    $updateData: JSON!
  ) {
    updateServiceManager(
      organizationId: $organizationId
      serviceManagerName: $serviceManagerName
      updateData: $updateData
    ) {
      id
      data
      fullyConfigured
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
  updateServiceVendorConfig: ownProps => newConfig => {
    return {
      mutation: updateServiceVendorConfigGql,
      variables: {
        organizationId: ownProps.params.organizationId,
        serviceName: ownProps.data.organization.serviceVendor.name,
        config: JSON.stringify(newConfig)
      }
    };
  },
  updateServiceManager: ownProps => (serviceManagerName, updateData) => {
    return {
      mutation: updateServiceManagerGql,
      variables: {
        serviceManagerName,
        updateData,
        organizationId: ownProps.params.organizationId
      }
    };
  },
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

const enhancedSettings = withSetTheme(
  loadData({ queries, mutations })(Settings)
);

export default enhancedSettings;
