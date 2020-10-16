import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import { Step, Stepper, StepLabel, StepContent } from "material-ui/Stepper";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import SuccessIcon from "material-ui/svg-icons/action/check-circle";
import { StyleSheet, css } from "aphrodite";
import loadData from "../containers/hoc/load-data";
import gql from "graphql-tag";

import configItems from "../extensions/texter-sideboxes/texter-feedback/config";

import theme from "../styles/theme";

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
      feedback: { createdBy, message, issueCounts }
    } = this.props;

    const warningItems = Object.entries(issueCounts).filter(
      ([, count]) => count && !isNaN(count)
    );

    const successItems = Object.entries(issueCounts).filter(
      ([, count]) => count === 0
    );

    const totalSteps = 1 + warningItems.length;

    const StepActions = () => (
      <div style={inlineStyles.stepActions}>
        {stepIndex !== 0 && (
          <FlatButton
            label="Back"
            style={{ marginRight: 50 }}
            disabled={stepIndex === 0}
            onClick={this.handlePrev}
          />
        )}
        <RaisedButton
          label={stepIndex >= totalSteps ? "Done" : "Next"}
          primary
          onClick={stepIndex < totalSteps ? this.handleNext : this.handleDone}
        />
      </div>
    );

    const getWarningContent = type => {
      const configItem = configItems.find(({ key }) => key === type);
      if (!configItem) return null;
      return (
        <Step>
          <StepLabel>
            <Alert type="warning" message={configItem.warningMessage} />
          </StepLabel>
          <StepContent style={inlineStyles.stepContent}>
            {configItem.content}
            <StepActions />
          </StepContent>
        </Step>
      );
    };

    const getSuccessContent = type => {
      const configItem = configItems.find(({ key }) => key === type);
      if (!configItem) return null;
      return <Alert type="success" message={configItem.successMessage} />;
    };

    return (
      <Stepper
        style={inlineStyles.stepper}
        activeStep={stepIndex}
        linear={false}
        orientation="vertical"
      >
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>
            {createdBy.name}'s Feedback:
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
        {warningItems.map(([type]) => getWarningContent(type))}
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>Thank You!</StepLabel>
          <StepContent>
            {successItems.map(([type]) => getSuccessContent(type))}
            <Alert type="success" message="Keep up the great work! 🎉" />
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
    const { feedback, mutations } = this.props;
    feedback.isAcknowledged = true;
    const feedbackString = JSON.stringify(feedback);
    await mutations.updateFeedback(feedbackString);
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
  mutations: PropTypes.func
};

export const mutations = {
  updateFeedback: ownProps => feedback => ({
    mutation: gql`
      mutation updateFeedback($assignmentId: String!, $feedback: String!) {
        updateFeedback(assignmentId: $assignmentId, feedback: $feedback) {
          id
          feedback {
            isAcknowledged
          }
        }
      }
    `,
    variables: {
      assignmentId: ownProps.assignmentId,
      feedback
    }
  })
};

export default loadData({ mutations })(AssignmentTexterFeedback);
