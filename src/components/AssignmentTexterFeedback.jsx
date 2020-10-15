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
  actions: {
    margin: "10px 25%",
    display: "flex",
    justifyContent: "space-around"
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
  stepLabel: {
    fontWeight: "bolder",
    fontSize: 16
  },
  stepContent: {
    paddingTop: 10
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

    const getWarningContent = type => {
      const configItem = configItems.find(({ key }) => key === type);
      console.log(type, configItem);
      if (!configItem) return null;
      return (
        <Step>
          <StepLabel>
            <Alert type="warning" message={configItem.warningMessage} />
          </StepLabel>
          <StepContent style={inlineStyles.stepContent}>
            {configItem.content}
          </StepContent>
        </Step>
      );
    };

    const getSuccessContent = type => {
      const configItem = configItems.find(({ key }) => key === type);
      console.log(type, configItem);
      if (!configItem) return null;
      return <Alert type="success" message={configItem.successMessage} />;
    };

    return (
      <Stepper
        style={{ paddingLeft: 30 }}
        activeStep={stepIndex}
        linear={false}
        orientation="vertical"
      >
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>
            {createdBy.name}'s Feedback:
          </StepLabel>
          <StepContent style={{ fontSize: 15, paddingTop: 10 }}>
            {message}
          </StepContent>
        </Step>
        {warningItems.map(([type]) => getWarningContent(type))}
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>Thank You!</StepLabel>
          <StepContent>
            {successItems.map(([type]) => getSuccessContent(type))}
            <Alert type="success" message="Keep up the great work! 🎉" />
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
    const { stepIndex } = this.state;
    const {
      feedback: { issueCounts }
    } = this.props;

    const issuesCount = Object.entries(issueCounts).filter(
      ([, count]) => count && !isNaN(count)
    ).length;

    const totalSteps = 1 + issuesCount;

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

            <div>
              <CardActions style={inlineStyles.actions}>
                <FlatButton
                  label="Back"
                  disabled={stepIndex === 0}
                  onClick={this.handlePrev}
                  style={{ marginRight: 12 }}
                />
                <RaisedButton
                  label={stepIndex >= totalSteps ? "Done" : "Next"}
                  primary
                  onClick={
                    stepIndex < totalSteps ? this.handleNext : this.handleDone
                  }
                />
              </CardActions>
            </div>
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
          feedback
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
