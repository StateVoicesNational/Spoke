import PropTypes from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import Chart from "../components/Chart";
import { Card, CardTitle, CardText } from "material-ui/Card";
import LinearProgress from "material-ui/LinearProgress";
import TexterStats from "../components/TexterStats";
import Snackbar from "material-ui/Snackbar";
import { withRouter } from "react-router";
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
    textAlign: "center",
    color: "gray"
  }
};

const styles = StyleSheet.create({
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
    <CardTitle title={count} titleStyle={inlineStyles.count} />
    <CardText style={inlineStyles.title}>{title}</CardText>
  </Card>
);

Stat.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number
};

class AdminCampaignStats extends React.Component {
  state = {
    exportMessageOpen: false,
    disableExportButton: false
  };

  renderSurveyStats() {
    const { interactionSteps } = this.props.data.campaign;

    return interactionSteps.map(step => {
      if (step.question === "") {
        return <div></div>;
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
            <div>{error.count} errors</div>
            <LinearProgress
              color="red"
              mode="determinate"
              value={Math.round((100 * error.count) / contactsCount)}
            />
          </div>
        ))}
      </div>
    );
  }

  renderCopyButton() {
    return (
      <RaisedButton
        label="Copy Campaign"
        onTouchTap={async () =>
          await this.props.mutations.copyCampaign(this.props.params.campaignId)
        }
      />
    );
  }

  render() {
    const { data, params } = this.props;
    const { organizationId, campaignId } = params;
    const campaign = data.campaign;
    const { adminPerms } = this.props.params;
    const currentExportJob = this.props.data.campaign.pendingJobs.filter(
      job => job.jobType === "export"
    )[0];
    const shouldDisableExport =
      this.state.disableExportButton || currentExportJob;

    const exportLabel = currentExportJob
      ? `Exporting (${currentExportJob.status}%)`
      : "Export Data";

    return (
      <div>
        <div className={css(styles.container)}>
          {campaign.isArchived ? (
            <div className={css(styles.archivedBanner)}>
              This campaign is archived
            </div>
          ) : (
            ""
          )}

          <div className={css(styles.header)}>
            {campaign.title}
            <br />
            Campaign ID: {campaign.id}
          </div>
          <div className={css(styles.flexColumn)}>
            <div className={css(styles.rightAlign)}>
              <div className={css(styles.inline)}>
                <div className={css(styles.inline)}>
                  {!campaign.isArchived ? (
                    // edit
                    <RaisedButton
                      {...dataTest("editCampaign")}
                      onTouchTap={() =>
                        this.props.router.push(
                          `/admin/${organizationId}/campaigns/${campaignId}/edit`
                        )
                      }
                      label="Edit"
                    />
                  ) : null}
                  {adminPerms
                    ? [
                        // Buttons for Admins (and not Supervolunteers)
                        // export
                        <RaisedButton
                          onTouchTap={async () => {
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
                            await this.props.mutations.exportCampaign(
                              campaignId
                            );
                          }}
                          label={exportLabel}
                          disabled={shouldDisableExport}
                        />, // unarchive
                        campaign.isArchived ? (
                          <RaisedButton
                            onTouchTap={async () =>
                              await this.props.mutations.unarchiveCampaign(
                                campaignId
                              )
                            }
                            label="Unarchive"
                          />
                        ) : null, // archive
                        !campaign.isArchived ? (
                          <RaisedButton
                            onTouchTap={async () =>
                              await this.props.mutations.archiveCampaign(
                                campaignId
                              )
                            }
                            label="Archive"
                          />
                        ) : null, // copy
                        <RaisedButton
                          {...dataTest("copyCampaign")}
                          label="Copy Campaign"
                          onTouchTap={async () =>
                            await this.props.mutations.copyCampaign(
                              this.props.params.campaignId
                            )
                          }
                        />,
                        campaign.useOwnMessagingService ? (
                          <RaisedButton
                            {...dataTest("messagingService")}
                            onTouchTap={() =>
                              this.props.router.push(
                                `/admin/${organizationId}/campaigns/${campaignId}/messaging-service`
                              )
                            }
                            label="Messaging Service"
                          />
                        ) : null
                      ]
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
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
        <TexterStats campaign={campaign} />
        <Snackbar
          open={this.state.exportMessageOpen}
          message="Export started - we'll e-mail you when it's done"
          autoHideDuration={5000}
          onRequestClose={() => {
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
        $assignmentsFilter: AssignmentsFilter
      ) {
        campaign(id: $campaignId) {
          id
          title
          isArchived
          useDynamicAssignment
          useOwnMessagingService
          assignments(assignmentsFilter: $assignmentsFilter) {
            id
            texter {
              id
              roles(organizationId: $organizationId)
              firstName
              lastName
            }
            unmessagedCount: contactsCount(contactsFilter: $contactsFilter)
            contactsCount
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
        }
      },
      pollInterval: 5000
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
  })
};

export default loadData({ queries, mutations })(withRouter(AdminCampaignStats));
