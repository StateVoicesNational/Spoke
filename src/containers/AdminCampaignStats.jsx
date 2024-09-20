import PropTypes from "prop-types";
import React from "react";
import Chart from "../components/Chart";

import LinearProgress from "@material-ui/core/LinearProgress";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Snackbar from "@material-ui/core/Snackbar";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

import TexterStats from "../components/TexterStats";
import OrganizationJoinLink from "../components/OrganizationJoinLink";
import CampaignServiceManagers from "../components/CampaignServiceManagers";
import AdminCampaignCopy from "./AdminCampaignCopy";
import CollapsibleCard from "../components/CollapsibleCard";
import { withRouter, Link as RouterLink } from "react-router";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import { gql } from "@apollo/client";
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

  renderPieChart(id, text, count, options) {
    return (
      <div key={id}>
        <Typography variant="h5">{text}</Typography>
        {count > 0 ? (
          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <Stat title="responses" count={count} />
            </div>
            <div className={css(styles.flexColumn)} style={{maxWidth: "50%"}}>
              <div className={css(styles.rightAlign)}>
                <Chart
                  data={options.map(answer => [
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
  }

  renderSurveyStats() {
    const { interactionSteps } = this.props.data.campaign;

    if (global.HIDE_BRANCHED_SCRIPTS) return "";

    return interactionSteps.map(step => {
      if (step.question === "") {
        return <div key={step.id}></div>;
      }
      const totalResponseCount = step.question.answerOptions.reduce(
        (prev, answer) => prev + answer.responderCount,
        0
      );
      return this.renderPieChart(
        step.id, step.question.text, totalResponseCount, step.question.answerOptions
      );
    });
  }

  findGroupedAnswerData() {
    const groupedAnswerResponses = {};
    const groupedQuestionResponses = {};
    let totalGroupedResponsesCount = 0;
    let hasGroupedResponses = false;
    const { interactionSteps } = this.props.data.campaign;
    interactionSteps.forEach(step => {
      step.question.answerOptions.forEach(answer => {
        // Grouped Answer Responses
        answer.value.replace(/\[(.*?)\]/g, (match) => {
          hasGroupedResponses = true;
          if (!groupedAnswerResponses[match]) {
            groupedAnswerResponses[match] = {
              total: 0,
              questionAnswers: []
            };
          }
          groupedAnswerResponses[match].total += answer.responderCount;
          totalGroupedResponsesCount += answer.responderCount;
          groupedAnswerResponses[match].questionAnswers.push({
            qid: step.id,
            answer: answer.value,
            count: answer.responderCount
          });
        });
        // Grouped Question Responses
        step.question.text.replace(/\[(.*?)\]/g, (match) => {
          hasGroupedResponses = true;
          if (!groupedQuestionResponses[match]) {
            groupedQuestionResponses[match] = {
              total: 0,
              questionAnswers: {}
            };
          }
          groupedQuestionResponses[match].total += answer.responderCount;
          const qA = groupedQuestionResponses[match].questionAnswers;
          if (!qA[answer.value]) {
            qA[answer.value] = {
              value: answer.value,
              responderCount: 0
            };
          }
          qA[answer.value].responderCount += answer.responderCount;
        });

      });
    });

    return {
      groupedAnswerResponses,
      groupedQuestionResponses,
      totalGroupedResponsesCount,
      hasGroupedResponses,
      totalQuestions: interactionSteps.length
    };
  }

  renderGroupedAnswerStats(groupedResponses) {
    const { groupedAnswerResponses, totalGroupedResponsesCount } = groupedResponses;
    const keys = Object.keys(groupedAnswerResponses);
    return (
      keys.length
        ? this.renderPieChart(
          "groupedResponses",
          "Responses Grouped by Answers (with []'s)",
          totalGroupedResponsesCount,
          keys.map(k => ({
            value: k,
            responderCount: groupedAnswerResponses[k].total
          }))
        )
        : null
    );
  }

  renderGroupedQuestionStats(groupedResponses) {
    const { groupedQuestionResponses } = groupedResponses;
    const keys = Object.keys(groupedQuestionResponses);
    return keys.map(k =>
      this.renderPieChart(
        `grouped${k}`,
        `Grouped Questions with ${k}`,
        groupedQuestionResponses[k].total,
        Object.keys(groupedQuestionResponses[k].questionAnswers).map(qkey => (
          groupedQuestionResponses[k].questionAnswers[qkey]
        ))
      )
    );
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
              <RouterLink
                to={`/admin/${organizationId}/incoming?campaigns=${campaignId}&errorCode=${error.code}`}
              >
                {error.count} errors
              </RouterLink>
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
    const groupedResponses = this.findGroupedAnswerData();
    return (
      <div>
        <div className={css(styles.container)}>
          {campaign.isArchived && (
            <div className={css(styles.archivedBanner)}>
              This campaign is archived
              {campaign.isArchivedPermanently &&
                " and its phone numbers have been released"}
            </div>
          )}

          <div>
            <Typography variant="h5">
              {campaign.title}
              <br />
              Campaign ID: {campaign.id}
            </Typography>
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
                      </Button>,
                      // unarchive
                      campaign.isArchived && (
                        <Button
                          key="unarchiveCampaign"
                          disabled={
                            campaign.isArchivedPermanently ||
                            campaign.serviceManagers
                              .map(sm => sm.unArchiveable)
                              .reduce((a, b) => a || b, false)
                          }
                          onClick={async () =>
                            await this.props.mutations.unarchiveCampaign(
                              campaignId
                            )
                          }
                        >
                          Unarchive
                        </Button>
                      ),
                      // archive
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
                      ),
                      // copy
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
        {campaign.exportResults && (
          <div>
            {campaign.exportResults.error && (
              <div>Export failed: {campaign.exportResults.error}</div>
            )}
            {campaign.exportResults.campaignExportUrl && (
            (campaign.exportResults.campaignExportUrl.startsWith("http")) ? (
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
            ) : (campaign.exportResults.campaignExportUrl.startsWith("file://") && (
                <div>
                  Local export was successful, saved on the server at:
                  <br />
                  {campaign.exportResults.campaignExportUrl}
                  <br />
                  {campaign.exportResults.campaignMessagesExportUrl}
                </div>
              )
            ))}
          </div>
        )}
        {campaign.joinToken && campaign.useDynamicAssignment && (
          <OrganizationJoinLink
            organizationUuid={campaign.joinToken}
            campaignId={campaignId}
          />
        )}
        <CampaignServiceManagers
          campaign={campaign}
          organization={this.props.organizationData.organization}
          serviceManagerComponentName={"CampaignStats"}
          onSubmit={this.props.mutations.updateServiceManager}
        />
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

        {groupedResponses.hasGroupedResponses ? (
          <CollapsibleCard title={"Grouped Responses"}>
            <div>{this.renderGroupedAnswerStats(groupedResponses)}</div>
            <div>{this.renderGroupedQuestionStats(groupedResponses)}</div>
          </CollapsibleCard>
        ) : null}
        {global.HIDE_BRANCHED_SCRIPTS ? (
          ""
        ) : (
          <CollapsibleCard
            title={`Survey Responses (${groupedResponses.totalQuestions} questions)`}
            startCollapsed={groupedResponses.hasGroupedResponses || groupedResponses.totalQuestions > 15 /* to avoid default large renders */}
          >
            {this.renderSurveyStats()}
          </CollapsibleCard>
        )}

        {campaign.stats.errorCounts.length > 0 && (
          <CollapsibleCard title={"Sending Errors"} colorTheme={"warning"}>
            {this.renderErrorCounts()}{" "}
          </CollapsibleCard>
        )}
        <CollapsibleCard
          title={"Texter stats (% of first texts sent)"}
          startCollapsed={campaign.assignments.length > 30 /* to avoid default large renders */}
        >
          <TexterStats campaign={campaign} organizationId={organizationId} />
        </CollapsibleCard>
        <Snackbar
          open={this.state.exportMessageOpen}
          message={
            <span>
              Export started -
              {(this.props.organizationData &&
                this.props.organizationData.organization.emailEnabled) ?
                " we'll e-mail you when it's done. " :
              (campaign.cacheable && (
                <span>
                  <Link
                    onClick={() => {
                      this.props.data.refetch();
                    }}
                  >
                    {" Reload the page"} {/*Hacky way to add a space at the beginning */}
                  </Link>{" "}
                  to see a download link when its ready.
                </span>
              ))}
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
        $fromCampaignStatsPage: Boolean
      ) {
        campaign(id: $campaignId) {
          id
          title
          isArchived
          joinToken
          useDynamicAssignment
          isArchivedPermanently
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
          serviceManagers(fromCampaignStatsPage: $fromCampaignStatsPage) {
            id
            name
            displayName
            data
            unArchiveable
          }
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
        },
        fromCampaignStatsPage: true
      },
      pollInterval: 5000
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          theme
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
  }),
  updateServiceManager: ownProps => (serviceManagerName, updateData) => ({
    mutation: gql`
      mutation updateServiceManager(
        $organizationId: String!
        $campaignId: String!
        $serviceManagerName: String!
        $updateData: JSON!
        $fromCampaignStatsPage: Boolean
      ) {
        updateServiceManager(
          organizationId: $organizationId
          campaignId: $campaignId
          serviceManagerName: $serviceManagerName
          updateData: $updateData
          fromCampaignStatsPage: $fromCampaignStatsPage
        ) {
          id
          data
          unArchiveable
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationData.organization.id,
      campaignId: ownProps.data.campaign.id,
      serviceManagerName,
      updateData,
      fromCampaignStatsPage: true
    }
  })
};

export default loadData({ queries, mutations })(withRouter(AdminCampaignStats));
