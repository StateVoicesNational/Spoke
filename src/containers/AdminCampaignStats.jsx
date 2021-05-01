import PropTypes from "prop-types";
import React from "react";
import Chart from "../components/Chart";

import LinearProgress from "@material-ui/core/LinearProgress";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Snackbar from "@material-ui/core/Snackbar";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import TexterStats from "../components/TexterStats";
import OrganizationJoinLink from "../components/OrganizationJoinLink";
import AdminCampaignCopy from "./AdminCampaignCopy";
import { withRouter, Link } from "react-router";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";

const inlineStyles = {
  stat: {
    margin: "10px 0",
    width: "100%",
    maxWidth: 400
  },
  count: {
    fontSize: "60px",
    paddingTop: "10px",
    textAlign: "center",
    fontWeight: "bold"
  },
  title: {
    textTransform: "uppercase",
    textAlign: "center"
  }
};

export const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  archivedBanner: {
    backgroundColor: "#FFFBE6",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",
    padding: "15px",
    textAlign: "center",
    marginBottom: "20px"
  },
  header: {
    ...theme.text.header
  },
  flexColumn: {
    flex: 1,
    textAlign: "right",
    display: "flex"
  },
  question: {
    marginBottom: 24
  },
  rightAlign: {
    marginLeft: "auto",
    marginRight: 0
  },
  inline: {
    display: "inline-block",
    marginLeft: 20,
    verticalAlign: "middle"
  },
  spacer: {
    marginRight: 20
  },
  secondaryHeader: {
    ...theme.text.secondaryHeader
  }
});

const Stat = ({ title, count }) => (
  <Card key={title} style={inlineStyles.stat}>
    <CardContent style={inlineStyles.title}>
      <div style={inlineStyles.count}>{count}</div>
      {title}
    </CardContent>
  </Card>
);

Stat.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number
};

class AdminCampaignStats extends React.Component {
  state = {
    copyCampaignId: null, // This is the ID of the most-recently created copy of the campaign.
    copyMessageOpen: false, // This is true when the copy snackbar should be shown.
    exportMessageOpen: false,
    disableExportButton: false
  };

  renderSurveyStats() {
    const { interactionSteps } = this.props.data.campaign;

    return interactionSteps.map(step => {
      if (step.question === "") {
        return <div key={step.id}></div>;
      }

      const totalResponseCount = step.question.answerOptions.reduce(
        (prev, answer) => prev + answer.responderCount,
        0
      );
      return (
        <div key={step.id}>
          <div className={css(styles.secondaryHeader)}>
            {step.question.text}
          </div>
          {totalResponseCount > 0 ? (
            <div className={css(styles.container)}>
              <div className={css(styles.flexColumn)}>
                <Stat title="responses" count={totalResponseCount} />
              </div>
              <div className={css(styles.flexColumn)}>
                <div className={css(styles.rightAlign)}>
                  <Chart
                    data={step.question.answerOptions.map(answer => [
                      answer.value,
                      answer.responderCount
                    ])}
                  />
                </div>
              </div>
            </div>
          ) : (
            "No responses yet"
          )}
        </div>
      );
    });
  }

  renderErrorCounts() {
    const { campaignId, organizationId } = this.props.params;
    const { errorCounts } = this.props.data.campaign.stats;
    const { contactsCount } = this.props.data.campaign;
    console.log("errorcounts", contactsCount, errorCounts);
    if (!errorCounts.length) {
      return null;
    }
    return (
      <div>
        {errorCounts.map(error => (
          <div key={error.code}>
            {error.link ? (
              <a href={error.link} target="_blank">
                Error code {error.code}
              </a>
            ) : (
              error.code
            )}{" "}
            {error.description || null}
            <div>
              <Link
                to={`/admin/${organizationId}/incoming?campaigns=${campaignId}&errorCode=${error.code}`}
              >
                {error.count} errors
              </Link>
            </div>
            <LinearProgress
              variant="determinate"
              value={Math.round((100 * error.count) / contactsCount)}
            />
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { data, params, organizationData } = this.props;
    const { adminPerms, organizationId, campaignId } = params;
    const campaign = data.campaign;
    const currentExportJob = this.props.data.campaign.pendingJobs.filter(
      job => job.jobType === "export"
    )[0];
    const shouldDisableExport =
      this.state.disableExportButton || currentExportJob;

    const exportLabel = currentExportJob
      ? `Exporting (${currentExportJob.status}%)`
      : "Export Data";
    const {
      campaignPhoneNumbersEnabled
    } = this.props.organizationData.organization;
    const showReleaseNumbers =
      campaign.isArchived && campaignPhoneNumbersEnabled;
    return (
      <div>
        <div className={css(styles.container)}>
          {campaign.isArchived ? (
            <div className={css(styles.archivedBanner)}>
              This campaign is archived
              {campaign.isArchivedPermanently
                ? " and its phone numbers have been released"
                : null}
            </div>
          ) : null}

          <div className={css(styles.header)}>
            {campaign.title}
            <br />
            Campaign ID: {campaign.id}
          </div>
          <div className={css(styles.flexColumn)}>
            <div className={css(styles.rightAlign)}>
              <div className={css(styles.inline)}>
                <div className={css(styles.inline)}>
                  <ButtonGroup>
                    {!campaign.isArchived ? (
                      // edit
                      <Button
                        {...dataTest("editCampaign")}
                        onClick={() =>
                          this.props.router.push(
                            `/admin/${organizationId}/campaigns/${campaignId}/edit`
                          )
                        }
                      >
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      {...dataTest("convoCampaign")}
                      onClick={() =>
                        this.props.router.push(
                          `/admin/${organizationId}/incoming?campaigns=${campaignId}`
                        )
                      }
                    >
                      Convos
                    </Button>
                    {adminPerms && [
                      // Buttons for Admins (and not Supervolunteers)
                      // export
                      <Button
                        key="exportCampaign"
                        onClick={async () => {
                          this.setState(
                            {
                              exportMessageOpen: true,
                              disableExportButton: true
                            },
                            () => {
                              this.setState({
                                exportMessageOpen: true,
                                disableExportButton: false
                              });
                            }
                          );
                          await this.props.mutations.exportCampaign(campaignId);
                        }}
                        disabled={shouldDisableExport}
                      >
                        {exportLabel}
                      </Button>, // unarchive
                      campaign.isArchived && (
                        <Button
                          key="unarchiveCampaign"
                          disabled={campaign.isArchivedPermanently}
                          onClick={async () =>
                            await this.props.mutations.unarchiveCampaign(
                              campaignId
                            )
                          }
                        >
                          Unarchive
                        </Button>
                      ),
                      !campaign.isArchived && (
                        <Button
                          key="archiveCampaign"
                          onClick={async () =>
                            await this.props.mutations.archiveCampaign(
                              campaignId
                            )
                          }
                        >
                          Archive
                        </Button>
                      ), // copy
                      <AdminCampaignCopy
                        key="AdminCampaignCopy"
                        organizationId={organizationId}
                        campaignId={campaignId}
                      />,
                      campaign.useOwnMessagingService && (
                        <Button
                          key="messagingService"
                          {...dataTest("messagingService")}
                          disabled={campaign.isArchivedPermanently}
                          onClick={() =>
                            this.props.router.push(
                              `/admin/${organizationId}/campaigns/${campaignId}/messaging-service`
                            )
                          }
                        >
                          Messaging Service
                        </Button>
                      ),
                      showReleaseNumbers && (
                        <Button
                          key="releaseCampaignNumbers"
                          disabled={campaign.isArchivedPermanently}
                          onClick={async () =>
                            this.props.mutations.releaseCampaignNumbers(
                              campaignId
                            )
                          }
                        >
                          Release Numbers
                        </Button>
                      )
                    ]}
                  </ButtonGroup>
                </div>
              </div>
            </div>
          </div>
        </div>
        {campaign.exportResults ? (
          <div>
            {campaign.exportResults.error ? (
              <div>Export failed: {campaign.exportResults.error}</div>
            ) : null}
            {campaign.exportResults.campaignExportUrl &&
            campaign.exportResults.campaignExportUrl.startsWith("http") ? (
              <div>
                Most recent export:
                <a href={campaign.exportResults.campaignExportUrl} download>
                  Contacts Export CSV
                </a>
                <a
                  href={campaign.exportResults.campaignMessagesExportUrl}
                  download
                >
                  Messages Export CSV
                </a>
              </div>
            ) : (
              <div>
                Local export was successful, saved on the server at:
                <br />
                {campaign.exportResults.campaignExportUrl}
                <br />
                {campaign.exportResults.campaignMessagesExportUrl}
              </div>
            )}
          </div>
        ) : null}
        {campaign.joinToken && campaign.useDynamicAssignment ? (
          <OrganizationJoinLink
            organizationUuid={campaign.joinToken}
            campaignId={campaignId}
          />
        ) : null}

        <div className={css(styles.container)}>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Contacts" count={campaign.contactsCount} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Texters" count={campaign.assignments.length} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Sent" count={campaign.stats.sentMessagesCount} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat
              title="Replies"
              count={campaign.stats.receivedMessagesCount}
            />
          </div>
          <div className={css(styles.flexColumn)}>
            <Stat title="Opt-outs" count={campaign.stats.optOutsCount} />
          </div>
        </div>
        <div className={css(styles.header)}>Survey Questions</div>
        {this.renderSurveyStats()}
        {campaign.stats.errorCounts.length > 0 ? (
          <div>
            <div className={css(styles.header)}>Sending Errors</div>
            {this.renderErrorCounts()}{" "}
          </div>
        ) : null}
        <div className={css(styles.header)}>Texter stats</div>
        <div className={css(styles.secondaryHeader)}>% of first texts sent</div>
        <TexterStats campaign={campaign} organizationId={organizationId} />
        <Snackbar
          open={this.state.exportMessageOpen}
          message={
            <span>
              Export started -
              {this.props.organizationData &&
              this.props.organizationData.emailEnabled
                ? " we'll e-mail you when it's done."
                : null}
              {campaign.cacheable ? (
                <span>
                  <a
                    onClick={() => {
                      this.props.data.refetch();
                    }}
                    style={{ textDecoration: "underline" }}
                  >
                    Reload the page
                  </a>{" "}
                  to see a download link when its ready.
                </span>
              ) : null}
            </span>
          }
          autoHideDuration={campaign.cacheable ? null : 5000}
          onClose={() => {
            this.setState({ exportMessageOpen: false });
          }}
        />
      </div>
    );
  }
}

AdminCampaignStats.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object,
  params: PropTypes.object,
  router: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCampaign(
        $campaignId: String!
        $organizationId: String!
        $contactsFilter: ContactsFilter!
        $needsResponseFilter: ContactsFilter!
        $assignmentsFilter: AssignmentsFilter
      ) {
        campaign(id: $campaignId) {
          id
          title
          isArchived
          isArchivedPermanently
          joinToken
          useDynamicAssignment
          useOwnMessagingService
          messageserviceSid
          assignments(assignmentsFilter: $assignmentsFilter) {
            id
            texter {
              id
              roles(organizationId: $organizationId)
              firstName
              lastName
            }
            unmessagedCount: contactsCount(contactsFilter: $contactsFilter)
            unrepliedCount: contactsCount(contactsFilter: $needsResponseFilter)
            contactsCount
          }
          exportResults {
            error
            campaignExportUrl
            campaignMessagesExportUrl
          }
          pendingJobs {
            id
            jobType
            assigned
            status
          }
          interactionSteps {
            id
            question {
              text
              answerOptions {
                value
                responderCount
              }
            }
          }
          contactsCount
          stats {
            sentMessagesCount
            receivedMessagesCount
            optOutsCount
            errorCounts {
              code
              count
              description
              link
            }
          }
          cacheable
        }
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.params.campaignId,
        organizationId: ownProps.params.organizationId,
        assignmentsFilter: {
          stats: true
        },
        contactsFilter: {
          messageStatus: "needsMessage"
        },
        needsResponseFilter: {
          messageStatus: "needsResponse",
          isOptedOut: false
        }
      },
      pollInterval: 5000
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          campaignPhoneNumbersEnabled
          emailEnabled
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      }
    })
  }
};

const mutations = {
  archiveCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation archiveCampaign($campaignId: String!) {
        archiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  unarchiveCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  exportCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation exportCampaign($campaignId: String!) {
        exportCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
  }),
  copyCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation copyCampaign($campaignId: String!) {
        copyCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
  }),
  releaseCampaignNumbers: ownProps => campaignId => ({
    mutation: gql`
      mutation releaseCampaignNumbers($campaignId: ID!) {
        releaseCampaignNumbers(campaignId: $campaignId) {
          id
          messageserviceSid
        }
      }
    `,
    variables: { campaignId },
    refetchQueries: () => ["getOrganizationData"]
  })
};

export default loadData({ queries, mutations })(withRouter(AdminCampaignStats));
