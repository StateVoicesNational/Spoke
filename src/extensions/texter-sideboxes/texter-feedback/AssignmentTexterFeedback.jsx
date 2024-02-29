import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import gql from "graphql-tag";

import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import WarningIcon from "@material-ui/icons/Warning";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import LinkIcon from "@material-ui/icons/Link";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";

import loadData from "../../../containers/hoc/load-data";
import { defaults } from "./config";
import withMuiTheme from "../../../containers/hoc/withMuiTheme";

const Alert = ({ type, message, alertIcon, alert }) => {
  console.log("Alert", type);
  return (
    <div style={alert(type)}>
      {type === "warning" ? (
        <WarningIcon style={alertIcon(type)} />
      ) : (
        <CheckCircleIcon style={alertIcon(type)} />
      )}
      {message}
    </div>
  );
};

class AssignmentTexterFeedback extends Component {
  state = {
    finished: false,
    stepIndex: 0
  };

  styles = StyleSheet.create({
    container: {
      margin: "20px 0"
    },
    title: {
      color: this.props.muiTheme.palette.common.white
    },
    subtitle: {
      color: this.props.muiTheme.palette.common.white
    }
  });

  inlineStyles = {
    feedbackCard: {
      backgroundColor: this.props.muiTheme.palette.info.main,
      maxWidth: 670,
      marginLeft: 12,
      padding: 16
    },
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
    },
    alertIcon: type => ({
      minWidth: 24,
      marginRight: 6,
      transform: "scale(.9)",
      color:
        type === "warning"
          ? this.props.muiTheme.palette.warning.main
          : this.props.muiTheme.palette.success.main
    }),
    alert: type => ({
      margin: "8px 0",
      paddingRight: 20,
      display: "flex",
      alignItems: "center",
      padding: "6px 16px",
      borderRadius: 4,
      outline: "1px solid",
      color:
        type === "warning"
          ? this.props.muiTheme.palette.warning.main
          : this.props.muiTheme.palette.success.main
    })
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
      <div style={this.inlineStyles.stepActions}>
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
          <Alert
            type="warning"
            message={warningMessage}
            alertIcon={this.inlineStyles.alertIcon}
            alert={this.inlineStyles.alert}
          />
        </StepLabel>
        <StepContent style={this.inlineStyles.stepContent}>
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
        style={this.inlineStyles.stepper}
        activeStep={stepIndex}
        linear={false}
        orientation="vertical"
      >
        <Step>
          <StepLabel style={this.inlineStyles.stepLabel}>
            {createdBy.name}&rsquo;s Feedback:
          </StepLabel>
          <StepContent style={this.inlineStyles.stepContent}>
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
          <StepLabel style={this.inlineStyles.stepLabel}>
            {!!successItems.length ? "Skills Mastery" : "Thank You!"}
          </StepLabel>
          <StepContent>
            {successItems.map(({ successMessage }) => (
              <Alert
                type="success"
                message={successMessage}
                alertIcon={this.inlineStyles.alertIcon}
                alert={this.inlineStyles.alert}
              />
            ))}
            {!successItems.length && (
              <Alert
                type="success"
                message="Keep up the great work! 🎉"
                alertIcon={this.inlineStyles.alertIcon}
                alert={this.inlineStyles.alert}
              />
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
      <div className={css(this.styles.container)}>
        <Card style={this.inlineStyles.feedbackCard}>
          <CardHeader
            style={{ paddingTop: 0, paddingLeft: 0 }}
            title={title}
            subheader={subtitle}
            classes={{
              title: css(this.styles.title),
              subheader: css(this.styles.subtitle)
            }}
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

export default loadData({ mutations })(
  withMuiTheme(AssignmentTexterFeedback)
);
