import PropTypes from "prop-types";
import React from "react";

import WarningIcon from "material-ui/svg-icons/alert/warning";
import DoneIcon from "material-ui/svg-icons/action/done";
import CancelIcon from "material-ui/svg-icons/navigation/cancel";

import Avatar from "material-ui/Avatar";
import theme from "../styles/theme";
import CircularProgress from "material-ui/CircularProgress";
import { Card, CardHeader, CardText, CardActions } from "material-ui/Card";
import { Link } from "react-router";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import RaisedButton from "material-ui/RaisedButton";
import CampaignBasicsForm from "../components/CampaignBasicsForm";
import CampaignMessagingServiceForm from "../components/CampaignMessagingServiceForm";
import CampaignContactsChoiceForm from "../components/CampaignContactsChoiceForm";
import CampaignTextersForm from "../components/CampaignTextersForm";
import CampaignInteractionStepsForm from "../components/CampaignInteractionStepsForm";
import CampaignCannedResponsesForm from "../components/CampaignCannedResponsesForm";
import CampaignDynamicAssignmentForm from "../components/CampaignDynamicAssignmentForm";
import CampaignTexterUIForm from "../components/CampaignTexterUIForm";
import { dataTest, camelCase } from "../lib/attributes";
import CampaignTextingHoursForm from "../components/CampaignTextingHoursForm";

import AdminScriptImport from "../containers/AdminScriptImport";
import { makeTree } from "../lib";

const campaignInfoFragment = `
  id
  title
  description
  dueBy
  joinToken
  batchSize
  isStarted
  isArchived
  contactsCount
  customFields
  useDynamicAssignment
  logoImageUrl
  introHtml
  primaryColor
  useOwnMessagingService
  messageserviceSid
  overrideOrganizationTextingHours
  textingHoursEnforced
  textingHoursStart
  textingHoursEnd
  texterUIConfig {
    options
    sideboxChoices
  }
  timezone
  texters {
    id
    firstName
    lastName
    assignment(campaignId:$campaignId) {
      contactsCount
      needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
      maxContacts
    }
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
  cannedResponses {
    id
    title
    text
  }
  ingestMethodsAvailable {
    name
    displayName
    clientChoiceData
  }
  ingestMethod {
    name
    success
    result
    reference
    contactsCount
    deletedOptouts
    deletedDupes
    updatedAt
  }
  editors
  pendingJobs {
    id
    jobType
    assigned
    status
    resultMessage
  }
`;

export const campaignDataQuery = gql`query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`;

export class AdminCampaignEdit extends React.Component {
  constructor(props) {
    super(props);
    const isNew = props.location.query.new;
    this.state = {
      expandedSection: isNew ? 0 : null,
      campaignFormValues: props.campaignData.campaign,
      startingCampaign: false,
      isPolling: false
    };
  }

  startPollingIfNecessary = () => {
    if (!this.state.isPolling) {
      console.log("Start polling");
      this.setState(
        {
          isPolling: true
        },
        () => this.props.campaignData.startPolling(2500)
      );
    }
  };

  stopPollingIfNecessary = () => {
    if (this.state.isPolling) {
      console.log("Stop polling");
      this.setState(
        {
          isPolling: false
        },
        () => {
          this.props.campaignData.stopPolling();
        }
      );
    }
  };

  componentDidMount() {
    if (this.props.campaignData.campaign.pendingJobs.length > 0) {
      this.startPollingIfNecessary();
    }
  }

  componentWillReceiveProps(newProps) {
    // This should only update the campaignFormValues sections that
    // are NOT expanded so the form data doesn't compete with the user
    // The basic flow of data:
    // 1. User adds data to a section -> this.state.campaignFormValues
    // 2. User saves -> (handleSave) mutations.editCampaign ->
    // 3. Refetch/poll updates data in loadData component wrapper
    //    and triggers *this* method => this.props.campaignData => this.state.campaignFormValues
    // So campaignFormValues should always be the diffs between server and client form data
    let { expandedSection, isPolling } = this.state;
    let expandedKeys = [];
    if (expandedSection !== null) {
      expandedSection = this.sections()[expandedSection];
      expandedKeys = expandedSection.keys;
    }

    const campaignDataCopy = {
      ...newProps.campaignData.campaign
    };
    expandedKeys.forEach(key => {
      // contactsCount is in two sections
      // That means it won't get updated if *either* is opened
      // but we want it to update in either
      if (key === "contactsCount") {
        return;
      }
      delete campaignDataCopy[key];
    });
    // NOTE: Since this does not _deep_ copy the values the
    // expandedKey pointers will remain the same object as before
    // so setState passes on those subsections should1 not refresh
    const pushToFormValues = {
      ...this.state.campaignFormValues,
      ...campaignDataCopy
    };
    // contactData needs to be *deleted*
    // when contacts are done on backend so that Contacts section
    // can be marked saved, but only when user is NOT editing Contacts
    if (campaignDataCopy.contactsCount > 0) {
      const specialCases = ["contactData"];
      specialCases.forEach(key => {
        if (expandedKeys.indexOf(key) === -1) {
          delete pushToFormValues[key];
        }
      });
    }

    const newPendingJobs = newProps.campaignData.campaign.pendingJobs;
    if (newPendingJobs.length > 0) {
      this.startPollingIfNecessary();
    }

    if (newPendingJobs.length === 0) {
      this.stopPollingIfNecessary();
    }

    this.setState({
      campaignFormValues: pushToFormValues
    });
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state;

    if (newExpandedState) {
      this.setState({ expandedSection: index });
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null });
    }
  };

  getSectionState(section) {
    const sectionState = {};
    section.keys.forEach(key => {
      sectionState[key] = this.state.campaignFormValues[key];
    });
    return sectionState;
  }

  isNew() {
    return this.props.location.query.new;
  }

  async handleDeleteJob(jobId) {
    if (
      confirm(
        "Discarding the job will not necessarily stop it from running." +
          " However, if the job failed, discarding will let you try again." +
          " Are you sure you want to discard the job?"
      )
    ) {
      await this.props.mutations.deleteJob(jobId);
    }
  }

  handleChange = formValues => {
    console.log("handleChange", formValues);
    this.setState({
      campaignFormValues: {
        ...this.state.campaignFormValues,
        ...formValues
      }
    });
  };

  handleSubmit = async () => {
    const section = this.sections()[this.state.expandedSection];
    if (!section.doNotSaveAfterSubmit) {
      await this.handleSave();
    }
    this.setState(
      {
        expandedSection:
          this.state.expandedSection >= this.sections().length - 1 ||
          !this.isNew()
            ? null
            : this.state.expandedSection + 1
      },
      () => {
        // manually refetching after the expanded section changes makes sure
        // that componentWillReceiveProps does not ignore server results for
        // the section we just saved.
        this.props.campaignData.refetch();
      }
    );
  };

  handleSave = async () => {
    // only save the current expanded section
    const { expandedSection } = this.state;
    if (expandedSection === null) {
      return;
    }

    const section = this.sections()[expandedSection];
    let newCampaign = {};
    if (this.checkSectionSaved(section)) {
      return; // already saved and no data changes
    }

    newCampaign = {
      ...this.getSectionState(section)
    };

    if (Object.keys(newCampaign).length > 0) {
      // Transform the campaign into an input understood by the server
      delete newCampaign.customFields;
      delete newCampaign.contactsCount;
      if (newCampaign.hasOwnProperty("texters")) {
        newCampaign.texters = newCampaign.texters.map(texter => ({
          id: texter.id,
          needsMessageCount: texter.assignment.needsMessageCount,
          maxContacts: texter.assignment.maxContacts,
          contactsCount: texter.assignment.contactsCount
        }));
      }
      if (newCampaign.hasOwnProperty("interactionSteps")) {
        newCampaign.interactionSteps = makeTree(newCampaign.interactionSteps);
      }

      return await this.props.mutations.editCampaign(
        this.props.campaignData.campaign.id,
        newCampaign
      );
    }
  };

  checkSectionSaved(section) {
    // Tests section's keys of campaignFormValues against props.campaignData
    // * Determines greyness of section button
    // * Determine if section is marked done (in green) along with checkSectionCompleted()
    // * Must be false for a section to save!!
    // Only Contacts section implements checkSaved()
    if (section.hasOwnProperty("checkSaved")) {
      return section.checkSaved();
    }
    const sectionState = {};
    const sectionProps = {};
    section.keys.forEach(key => {
      sectionState[key] = this.state.campaignFormValues[key];
      sectionProps[key] = this.props.campaignData.campaign[key];
    });
    if (JSON.stringify(sectionState) !== JSON.stringify(sectionProps)) {
      return false;
    }
    return true;
  }

  checkSectionCompleted(section) {
    return section.checkCompleted();
  }

  sections() {
    const pendingJobs = this.props.campaignData.campaign.pendingJobs;
    const finalSections = [
      {
        title: "Basics",
        content: CampaignBasicsForm,
        keys: [
          "title",
          "description",
          "dueBy",
          "logoImageUrl",
          "primaryColor",
          "introHtml"
        ],
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        checkCompleted: () =>
          this.state.campaignFormValues.title !== "" &&
          this.state.campaignFormValues.description !== "" &&
          this.state.campaignFormValues.dueBy !== null
      },
      {
        title: "Contacts",
        content: CampaignContactsChoiceForm,
        keys: ["contactData", "ingestMethod"],
        checkCompleted: () =>
          this.props.campaignData.campaign.contactsCount > 0,
        checkSaved: () => !this.state.campaignFormValues.contactData,
        blocksStarting: true,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false,
        extraProps: {
          contactsCount: this.props.campaignData.campaign.contactsCount,
          ingestMethodChoices:
            this.props.campaignData.campaign.ingestMethodsAvailable || "",
          pastIngestMethod:
            this.props.campaignData.campaign.ingestMethod || null,
          jobResultMessage:
            (
              pendingJobs
                .filter(job => /ingest/.test(job.jobType))
                .reverse()[0] || {}
            ).resultMessage || ""
        }
      },
      {
        title: "Texters",
        content: CampaignTextersForm,
        keys: ["texters", "contactsCount"],
        checkCompleted: () =>
          (this.state.campaignFormValues.texters.length > 0 &&
            this.state.campaignFormValues.contactsCount ===
              this.state.campaignFormValues.texters.reduce(
                (left, right) => left + right.assignment.contactsCount,
                0
              )) ||
          this.state.campaignFormValues.useDynamicAssignment === true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          orgTexters: this.props.organizationData.organization.texters,
          organizationUuid: this.props.organizationData.organization.uuid,
          useDynamicAssignment: this.props.campaignData.campaign
            .useDynamicAssignment,
          campaignId: this.props.campaignData.campaign.id
        }
      },
      {
        title: "Interactions",
        content: CampaignInteractionStepsForm,
        keys: ["interactionSteps"],
        checkCompleted: () =>
          this.state.campaignFormValues.interactionSteps[0] &&
          this.state.campaignFormValues.interactionSteps.some(
            step => step.script
          ),
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields,
          availableActions: this.props.organizationData.organization
            .availableActions
        }
      },
      {
        title: "Canned Responses",
        content: CampaignCannedResponsesForm,
        keys: ["cannedResponses"],
        checkCompleted: () => true,
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields
        }
      },
      {
        title: "Dynamic Assignment",
        content: CampaignDynamicAssignmentForm,
        keys: ["batchSize", "useDynamicAssignment"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          joinToken: this.props.campaignData.campaign.joinToken,
          campaignId: this.props.campaignData.campaign.id
        }
      },
      {
        title: "Texter Experience",
        content: CampaignTexterUIForm,
        keys: ["texterUIConfig"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false,
        extraProps: {
          organization: this.props.organizationData.organization
        }
      },
      {
        title: "Texting Hours",
        content: CampaignTextingHoursForm,
        keys: [
          "overrideOrganizationTextingHours",
          "textingHoursEnforced",
          "textingHoursStart",
          "textingHoursEnd",
          "timezone"
        ],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false
      }
    ];
    if (window.EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE) {
      finalSections.push({
        title: "Messaging Service",
        content: CampaignMessagingServiceForm,
        keys: ["useOwnMessagingService", "messageserviceSid"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false
      });
    }
    if (window.CAN_GOOGLE_IMPORT) {
      // TODO: consider merging this component into Interactions
      finalSections.push({
        title: "Script Import",
        content: AdminScriptImport,
        keys: [],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false,
        extraProps: {
          startImport: async url =>
            this.props.mutations.importCampaignScript(
              this.props.campaignData.campaign.id,
              url
            ),
          hasPendingJob: pendingJobs.some(
            j => j.jobType === "import_script" && !j.resultMessage
          ),
          jobError: (pendingJobs[0] || {}).resultMessage
        },
        doNotSaveAfterSubmit: true
      });
    }
    return finalSections;
  }

  sectionSaveStatus(section) {
    const pendingJobs = this.props.campaignData.campaign.pendingJobs;
    let sectionIsSaving = false;
    let relatedJob = null;
    let savePercent = 0;
    let jobMessage = null;
    let jobId = null;
    if (pendingJobs.length > 0) {
      if (section.title === "Contacts") {
        relatedJob = pendingJobs.filter(job =>
          job.jobType.startsWith("ingest")
        )[0];
      } else if (section.title === "Texters") {
        relatedJob = pendingJobs.filter(
          job => job.jobType === "assign_texters"
        )[0];
      } else if (section.title === "Script Import") {
        relatedJob = pendingJobs.filter(
          job => job.jobType === "import_script"
        )[0];
      }
    }

    if (relatedJob) {
      sectionIsSaving = !relatedJob.resultMessage;
      savePercent = relatedJob.status;
      jobMessage = relatedJob.resultMessage;
      jobId = relatedJob.id;
    }
    return {
      sectionIsSaving,
      savePercent,
      jobMessage,
      jobId
    };
  }

  renderCurrentEditors() {
    const { editors } = this.props.campaignData.campaign;
    if (editors) {
      return <div>This campaign is being edited by: {editors}</div>;
    }
    return "";
  }

  renderCampaignFormSection(section, forceDisable) {
    let shouldDisable = forceDisable || this.checkSectionSaved(section);
    const ContentComponent = section.content;
    const formValues = this.getSectionState(section);
    return (
      <ContentComponent
        onChange={this.handleChange}
        formValues={formValues}
        saveLabel={this.isNew() ? "Save and goto next section" : "Save"}
        saveDisabled={shouldDisable}
        ensureComplete={this.props.campaignData.campaign.isStarted}
        onSubmit={this.handleSubmit}
        {...section.extraProps}
      />
    );
  }

  renderHeader() {
    const notStarting = this.props.campaignData.campaign.isStarted ? (
      <div
        {...dataTest("campaignIsStarted")}
        style={{
          color: theme.colors.green,
          fontWeight: 800
        }}
      >
        This campaign is running!
        {this.renderCurrentEditors()}
      </div>
    ) : (
      this.renderStartButton()
    );

    return (
      <div>
        {this.props.campaignData.campaign.title && (
          <h2>{this.props.campaignData.campaign.title}</h2>
        )}
        <div
          style={{
            marginBottom: 15,
            fontSize: 16
          }}
        >
          {this.state.startingCampaign ? (
            <div
              style={{
                color: theme.colors.gray,
                fontWeight: 800
              }}
            >
              <CircularProgress
                size={0.5}
                style={{
                  verticalAlign: "middle",
                  display: "inline-block"
                }}
              />
              Starting your campaign...
            </div>
          ) : (
            notStarting
          )}
        </div>
      </div>
    );
  }

  renderStartButton() {
    if (!this.props.params.adminPerms) {
      // Supervolunteers don't have access to start the campaign or un/archive it
      return null;
    }
    const orgConfigured = this.props.organizationData.organization
      .fullyConfigured;
    const settingsLink = `/admin/${this.props.organizationData.organization.id}/settings`;
    let isCompleted = this.props.campaignData.campaign.pendingJobs.length === 0;
    this.sections().forEach(section => {
      if (
        (section.blocksStarting && !this.checkSectionCompleted(section)) ||
        !this.checkSectionSaved(section)
      ) {
        isCompleted = false;
      }
    });

    return (
      <div
        style={{
          ...theme.layouts.multiColumn.container
        }}
      >
        <div
          style={{
            ...theme.layouts.multiColumn.flexColumn
          }}
        >
          {!orgConfigured ? (
            <span>
              Your organization is missing required configuration. Please{" "}
              <Link to={settingsLink}>update your settings</Link> or contact an
              adminstrator
            </span>
          ) : !isCompleted ? (
            "You need to complete all the sections below before you can start this campaign"
          ) : (
            "Your campaign is all good to go! >>>>>>>>>"
          )}
          {this.renderCurrentEditors()}
        </div>
        <div>
          {this.props.campaignData.campaign.isArchived ? (
            <RaisedButton
              label="Unarchive"
              onTouchTap={async () =>
                await this.props.mutations.unarchiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          ) : (
            <RaisedButton
              label="Archive"
              onTouchTap={async () =>
                await this.props.mutations.archiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          )}
          <RaisedButton
            {...dataTest("startCampaign")}
            primary
            label="Start This Campaign!"
            disabled={!isCompleted || !orgConfigured}
            onTouchTap={async () => {
              if (!isCompleted || !orgConfigured) {
                return;
              }
              this.setState({
                startingCampaign: true
              });
              await this.props.mutations.startCampaign(
                this.props.campaignData.campaign.id
              );
              this.setState({
                startingCampaign: false
              });
            }}
          />
        </div>
      </div>
    );
  }
  render() {
    const sections = this.sections();
    const { expandedSection } = this.state;
    const { adminPerms } = this.props.params;
    return (
      <div>
        {this.renderHeader()}
        {sections.map((section, sectionIndex) => {
          const sectionIsDone =
            this.checkSectionCompleted(section) &&
            this.checkSectionSaved(section);
          const sectionIsExpanded = sectionIndex === expandedSection;
          let avatar = null;
          const cardHeaderStyle = {
            backgroundColor: theme.colors.lightGray
          };
          const avatarStyle = {
            display: "inline-block",
            verticalAlign: "middle"
          };

          const {
            sectionIsSaving,
            savePercent,
            jobMessage,
            jobId
          } = this.sectionSaveStatus(section);
          const sectionCanExpandOrCollapse =
            (section.expandAfterCampaignStarts ||
              !this.props.campaignData.campaign.isStarted) &&
            (adminPerms || section.expandableBySuperVolunteers);

          if (sectionIsSaving) {
            avatar = <CircularProgress style={avatarStyle} size={25} />;
            cardHeaderStyle.background = theme.colors.lightGray;
            cardHeaderStyle.width = `${savePercent}%`;
          } else if (sectionIsExpanded && sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.lightYellow;
          } else if (!sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.lightGray;
          } else if (sectionIsDone) {
            avatar = (
              <Avatar
                icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor = theme.colors.green;
          } else if (!sectionIsDone) {
            avatar = (
              <Avatar
                icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor = theme.colors.yellow;
          }
          return (
            <Card
              {...dataTest(camelCase(`${section.title}`))}
              key={section.title}
              expanded={sectionIsExpanded && sectionCanExpandOrCollapse}
              expandable={sectionCanExpandOrCollapse}
              onExpandChange={newExpandedState =>
                this.onExpandChange(sectionIndex, newExpandedState)
              }
              style={{
                marginTop: 1
              }}
            >
              <CardHeader
                title={section.title}
                titleStyle={{
                  width: "100%"
                }}
                style={cardHeaderStyle}
                actAsExpander={!sectionIsSaving && sectionCanExpandOrCollapse}
                showExpandableButton={
                  !sectionIsSaving && sectionCanExpandOrCollapse
                }
                avatar={avatar}
              />
              <CardText expandable>
                {this.renderCampaignFormSection(section, sectionIsSaving)}
              </CardText>
              {sectionIsSaving && adminPerms ? (
                <CardActions>
                  <div>Current Status: {savePercent}% complete</div>
                  {jobMessage ? <div>Message: {jobMessage}</div> : null}
                  <RaisedButton
                    label="Discard Job"
                    icon={<CancelIcon />}
                    onTouchTap={() => this.handleDeleteJob(jobId)}
                  />
                </CardActions>
              ) : null}
            </Card>
          );
        })}
      </div>
    );
  }
}

AdminCampaignEdit.propTypes = {
  campaignData: PropTypes.object,
  mutations: PropTypes.object,
  organizationData: PropTypes.object,
  params: PropTypes.object,
  location: PropTypes.object
};

const queries = {
  campaignData: {
    query: campaignDataQuery,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.params.campaignId
      },
      pollInterval: 60000
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          uuid
          fullyConfigured
          texters: people(role: "ANY") {
            id
            roles(organizationId: $organizationId)
            firstName
            lastName
            displayName
          }
          availableActions {
            name
            displayName
            instructions
            clientChoiceData {
              name
              details
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      },
      pollInterval: 20000
    })
  }
};

// TODO: use fragment?
const mutations = {
  archiveCampaign: ownProps => campaignId => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: ownProps => campaignId => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  startCampaign: ownProps => campaignId => ({
    mutation: gql`mutation startCampaign($campaignId: String!) {
        startCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  editCampaign: ownProps => (campaignId, campaign) => ({
    // Note: we don't fetch the campaignInfoFragment here because we want to
    // refetch manually in handleSubmit after updating the expanded section.
    // If we were to fetch the fragment here, the refetch would be ignored.
    mutation: gql`
      mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          id
        }
      }
    `,
    variables: {
      campaignId,
      campaign
    }
  }),
  deleteJob: ownProps => jobId => ({
    mutation: gql`
      mutation deleteJob($campaignId: String!, $id: String!) {
        deleteJob(campaignId: $campaignId, id: $id) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.params.campaignId,
      id: jobId
    },
    refetchQueries: () => ["getCampaign"]
  }),
  importCampaignScript: ownProps => (campaignId, url) => ({
    mutation: gql`
      mutation importCampaignScript($campaignId: String!, $url: String!) {
        importCampaignScript(campaignId: $campaignId, url: $url)
      }
    `,
    variables: {
      campaignId,
      url
    }
  })
};

export const operations = { queries, mutations };
export default loadData(operations)(AdminCampaignEdit);
