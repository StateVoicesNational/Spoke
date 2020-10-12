import PropTypes from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import Divider from "material-ui/Divider";
import Paper from "material-ui/Paper";
import { Step, Stepper, StepLabel } from "material-ui/Stepper";
import { List, ListItem } from "material-ui/List";
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
    maxWidth: 650,
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
  }
};

export class AssignmentTexterFeedback extends Component {
  state = {
    finished: false,
    stepIndex: 0
  };

  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: laststepIndex + 1,
      finished: stepIndex >= 1
    });
  };

  handlePrev = () => {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  };

  getStepContent = stepIndex => {
    const {
      feedback: { message, createdBy }
    } = this.props;
    const issueCounts = Object.entries(this.props.feedback.issueCounts)
      .map(([key, count]) => {
        if (key === "__typename") return null;
        return [_.startCase(key), count];
      })
      .filter(Boolean);

    if (stepIndex === 0) {
      return (
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {issueCounts.map(([issue, count]) => (
            <Paper
              style={{
                padding: "10px 16px"
              }}
            >
              <span style={{ fontWeight: "bold" }}>{issue}: </span>
              <span
                style={{
                  color: count ? theme.colors.orange : theme.colors.green,
                  fontSize: 16
                }}
              >
                {Number(count).toLocaleString()}
              </span>
            </Paper>
          ))}
        </div>
      );
    }

    return (
      <div style={{ padding: "0 20px" }}>
        <div>{createdBy.name}'s feedback message to you:</div>
        <div
          style={{
            marginLeft: 25,
            paddingLeft: 10,
            marginTop: 10,
            fontSize: 17,
            borderLeft: "5px solid #ddd"
          }}
        >
          {message}
        </div>
      </div>
    );
  };

  render() {
    const { feedback } = this.props;
    const { stepIndex } = this.state;

    const title = "Please review your feedback on this campaign!";
    const subtitle =
      "You will not be able to send more texts until you acknowledge you've read this.";

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
            <Stepper style={{ padding: "0 15%" }} activeStep={stepIndex}>
              <Step>
                <StepLabel>Issues Tally</StepLabel>
              </Step>
              <Step>
                <StepLabel>Reviewer Feedback</StepLabel>
              </Step>
            </Stepper>

            <div>
              <div style={{ minHeight: 100 }}>
                {this.getStepContent(stepIndex)}
              </div>
              <CardActions style={inlineStyles.actions}>
                <FlatButton
                  label="Back"
                  disabled={stepIndex === 0}
                  onClick={this.handlePrev}
                  style={{ marginRight: 12 }}
                />
                <RaisedButton
                  label={stepIndex === 1 ? "I Acknowledge" : "Next"}
                  primary
                  onClick={this.handleNext}
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
