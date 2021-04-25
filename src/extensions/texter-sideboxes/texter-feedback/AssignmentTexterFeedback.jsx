import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import gql from "graphql-tag";

import { Card, CardTitle } from "material-ui/Card";
import { Step, Stepper, StepLabel, StepContent } from "material-ui/Stepper";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import SuccessIcon from "material-ui/svg-icons/action/check-circle";
import LinkIcon from "material-ui/svg-icons/content/link";

import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";

import loadData from "../../../containers/hoc/load-data";
import { defaults } from "./config";
import theme from "../../../styles/theme";

const styles = StyleSheet.create({
  container: {
    margin: "20px 0"
  },
  image: {
    position: "absolute",
    height: "70%",
    top: "20px",
    right: "20px"
  }
});

export const inlineStyles = {
  feedbackCard: {
    backgroundColor: theme.colors.darkBlue,
    maxWidth: 670,
    marginLeft: 12,
    padding: 16
  },
  title: {
    paddingLeft: 0,
    paddingTop: 0,
    fontSize: 22,
    color: theme.colors.white
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.lightGray
  },
  alertIcon: type => ({
    minWidth: 24,
    marginRight: 6,
    transform: "scale(.9)",
    color: type === "warning" ? "#ff9800" : "#4caf50"
  }),
  alert: type => ({
    margin: "8px 0",
    paddingRight: 20,
    display: "flex",
    alignItems: "center",
    padding: "6px 16px",
    borderRadius: 4,
    backgroundColor:
      type === "warning" ? "rgb(255, 244, 229)" : "rgb(237, 247, 237)",
    color: type === "warning" ? "rgb(102, 60, 0)" : "rgb(30, 70, 32)"
  }),
  stepper: {
    paddingLeft: 30,
    paddingBottom: 50
  },
  stepLabel: {
    fontWeight: "bolder",
    fontSize: 16
  },
  stepContent: {
    fontSize: 15,
    paddingTop: 10,
    overflowWrap: "break-word",
    overflow: "inherit",
    hyphens: "manual"
  },
  stepActions: {
    margin: "20px 0 10px 0",
    display: "flex"
  }
};

const Alert = ({ type, message }) => (
  <div style={inlineStyles.alert(type)}>
    {type === "warning" ? (
      <WarningIcon style={inlineStyles.alertIcon(type)} />
    ) : (
      <SuccessIcon style={inlineStyles.alertIcon(type)} />
    )}
    {message}
  </div>
);

export class AssignmentTexterFeedback extends Component {
  state = {
    finished: false,
    stepIndex: 0
  };

  getStepContent = () => {
    const { stepIndex } = this.state;
    const {
      assignment: {
        feedback: { createdBy, message, issueCounts, skillCounts }
      },
      settingsData
    } = this.props;

    let config = defaults;
    if (settingsData && settingsData.texterFeedbackJSON) {
      try {
        config = JSON.parse(settingsData.texterFeedbackJSON);
      } catch (err) {
        console.log("Corrupted TexterFeedback JSON", err);
      }
    }

    const issueItems = Object.entries(issueCounts)
      .map(([key, count]) => {
        const item = config.issues.find(issue => issue.key === key);
        if (count && !isNaN(count) && item) return item;
        return null;
      })
      .filter(Boolean);

    const successItems = [
      // issueItems with successMessage and no count
      ...Object.entries(issueCounts)
        .map(([key, count]) => {
          const item = config.issues.find(issue => issue.key === key);
          if (count === 0 && item && item.successMessage) return item;
          return null;
        })
        .filter(Boolean),
      // skillCounts items
      ...Object.entries(skillCounts).map(([key, count]) => {
        const item = config.skills.find(skill => skill.key === key);
        if (count && !isNaN(count) && item) return item;
        return null;
      })
    ].filter(Boolean);

    const totalSteps = 1 + issueItems.length;

    const StepActions = () => (
      <div style={inlineStyles.stepActions}>
        {stepIndex !== 0 && (
          <Button
            style={{ marginRight: 50 }}
            disabled={stepIndex === 0}
            onClick={this.handlePrev}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={stepIndex < totalSteps ? this.handleNext : this.handleDone}
        >
          {stepIndex >= totalSteps ? "Done" : "Next"}
        </Button>
      </div>
    );

    const getIssueContent = ({ warningMessage, content, moreInfo }) => (
      <Step>
        <StepLabel>
          <Alert type="warning" message={warningMessage} />
        </StepLabel>
        <StepContent style={inlineStyles.stepContent}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
          {moreInfo && (
            <IconButton
              label="More Info"
              target="_blank"
              color="secondary"
              href={moreInfo}
            >
              <LinkIcon />
            </IconButton>
          )}
          <StepActions />
        </StepContent>
      </Step>
    );
    return (
      <Stepper
        style={inlineStyles.stepper}
        activeStep={stepIndex}
        linear={false}
        orientation="vertical"
      >
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>
            {createdBy.name}&rsquo;s Feedback:
          </StepLabel>
          <StepContent style={inlineStyles.stepContent}>
            {message.split("\n").map((line, key) => (
              <span key={key}>
                {line}
                <br />
              </span>
            ))}
            <StepActions />
          </StepContent>
        </Step>
        {issueItems.map(item => getIssueContent(item))}
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>
            {!!successItems.length ? "Skills Mastery" : "Thank You!"}
          </StepLabel>
          <StepContent>
            {successItems.map(({ successMessage }) => (
              <Alert type="success" message={successMessage} />
            ))}
            {!successItems.length && (
              <Alert type="success" message="Keep up the great work! 🎉" />
            )}
            <StepActions />
          </StepContent>
        </Step>
      </Stepper>
    );
  };

  handleNext = () =>
    this.setState(({ stepIndex }) => ({
      stepIndex: stepIndex + 1,
      finished: stepIndex >= 1
    }));

  handlePrev = () =>
    this.setState(({ stepIndex }) => ({
      stepIndex: stepIndex ? stepIndex - 1 : stepIndex
    }));

  handleDone = async () => {
    const { mutations } = this.props;
    await mutations.updateFeedback(true);
  };

  render() {
    const title = "Please review your feedback on this campaign!";
    const subtitle =
      "You can send more texts once you read and acknowledge this.";

    return (
      <div className={css(styles.container)}>
        <Card style={inlineStyles.feedbackCard}>
          <CardTitle
            style={{ paddingTop: 0, paddingLeft: 0 }}
            title={title}
            titleStyle={inlineStyles.title}
            subtitle={subtitle}
            subtitleStyle={inlineStyles.subtitle}
          />

          <Card>
            <div style={{ minHeight: 480 }}>{this.getStepContent()}</div>
          </Card>
        </Card>
      </div>
    );
  }
}

AssignmentTexterFeedback.propTypes = {
  feedback: PropTypes.object,
  mutations: PropTypes.func,
  settingsData: PropTypes.object,
  assignment: PropTypes.object
};

export const mutations = {
  updateFeedback: ownProps => acknowledge => ({
    mutation: gql`
      mutation updateFeedback($assignmentId: String!, $acknowledge: Boolean!) {
        updateFeedback(assignmentId: $assignmentId, acknowledge: $acknowledge) {
          id
          feedback {
            isAcknowledged
          }
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignment.id,
      acknowledge
    }
  })
};

export default loadData({ mutations })(AssignmentTexterFeedback);
