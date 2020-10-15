import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import Divider from "material-ui/Divider";
import Paper from "material-ui/Paper";
import { Step, Stepper, StepLabel, StepContent } from "material-ui/Stepper";
import { List, ListItem } from "material-ui/List";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import SuccessIcon from "material-ui/svg-icons/action/check-circle";
import { StyleSheet, css } from "aphrodite";
import _ from "lodash";

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

    const issueItems = Object.entries(issueCounts).filter(
      ([, count]) => count && !isNaN(count)
    );

    const positiveItems = Object.entries(issueCounts).filter(
      ([, count]) => count === 0
    );

    const getIssueContent = type => {
      switch (type) {
        case "optOuts": {
          return (
            <Step>
              <StepLabel>
                <Alert
                  type="warning"
                  message="Please review the Opt-Out Policy"
                />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                At WFP, we <b>DO</b> Opt Out voters who ask to be removed from
                texting (“Stop,” “please remove my number,” “don’t text me,”
                “unsubscribe”) or who send racist, sexist, or threatening
                replies. We <b>DO NOT</b> Opt Out voters who disagree with our
                views, simply send profanity, or who update their information
                with us (e.g. letting us know that they moved, that we have the
                wrong number, etc). Please take a look at the texter FAQ for a
                refresher at{" "}
                <a href="https:://wfpus.org/TextFAQ">wfpus.org/TextFAQ</a>.
              </StepContent>
            </Step>
          );
        }
        case "tags": {
          return (
            <Step>
              <StepLabel>
                <Alert type="warning" message="Incorrect use of Tags" />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                Please make sure that you are using tags for all updates to
                voter information like Wrong Number, Out of District, and Cannot
                Vote. That is a three step process to select the tag, save the
                tags, and then send the appropriate response. If you have
                multiple tags and you’re not sure when Other Response to send,
                the higher response (with the lower number) is likely the right
                choice.
              </StepContent>
            </Step>
          );
        }
        case "responses": {
          return (
            <Step>
              <StepLabel>
                <Alert
                  type="warning"
                  message="Remember Priority of Responses"
                />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                When a voter gives lots of information, please remember our
                Priority of Responses! Opt out is first priority, then select
                and save any appropriate tags, then if the voter answered the
                question at hand send a Survey Response (the top list in the All
                Responses dropdown). Other Responses are a last resort.
              </StepContent>
            </Step>
          );
        }
        case "hostile": {
          return (
            <Step>
              <StepLabel>
                <Alert
                  type="warning"
                  message="Missing ask or included unofficial info"
                />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                Let’s stick to the scripted responses as much as possible! If a
                scripted message will not address the particular issue, make
                sure to always include the appropriate ask at the end of the
                message and make sure the source of your information is coming
                from an official campaign source or local government source for
                voter information.
              </StepContent>
            </Step>
          );
        }
        case "length": {
          return (
            <Step>
              <StepLabel>
                <Alert type="warning" message="Messages that are too long" />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                When a voter asks questions that require a response greater than
                306 characters, we want to send consecutive messages, ensure
                that we log a Survey Response if the voter answered the question
                at hand, and include the ask at the end of the last message
                sent! If possible, let’s keep all responses to 306 characters or
                less.
              </StepContent>
            </Step>
          );
        }
        case "skips": {
          return (
            <Step>
              <StepLabel>
                <Alert
                  type="warning"
                  message="Skipped messages that needed a response"
                />
              </StepLabel>
              <StepContent style={inlineStyles.stepContent}>
                I see a conversation that needed a response but was skipped.
                Please know that we only use the Skip button when a conversation
                has ended, when tagging Help Needed, or when we receive an
                automated “I’m Driving” message.
              </StepContent>
            </Step>
          );
        }
        default:
          return null;
      }
    };

    const getPositiveContent = type => {
      switch (type) {
        case "optOuts":
          return (
            <Alert type="success" message="You had no issues with Opt Outs!" />
          );
        case "tags":
          return (
            <Alert
              type="success"
              message="You had no issues with applying tags!"
            />
          );
        case "responses":
          return (
            <Alert
              type="success"
              message="You had no issues with choosing responses!"
            />
          );
        case "hostile":
          return (
            <Alert
              type="success"
              message="You used the script and provided accurate info!"
            />
          );
        default:
          return null;
      }
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
        {issueItems.map(([type, count], i) => getIssueContent(type, count, i))}
        <Step>
          <StepLabel style={inlineStyles.stepLabel}>Thank You</StepLabel>
          <StepContent>
            {positiveItems.map(([type]) => getPositiveContent(type))}
            {issueItems.length && (
              <Alert type="success" message="Keep up the great work! 🎉" />
            )}
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

  render() {
    const { stepIndex } = this.state;
    const {
      feedback: { issueCounts }
    } = this.props;

    const totalSteps =
      1 +
      Object.entries(issueCounts).filter(([, count]) => count && !isNaN(count))
        .length;

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
                    stepIndex < totalSteps
                      ? this.handleNext
                      : this.props.handleDone
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
  feedback: PropTypes.object
};

export default AssignmentTexterFeedback;
