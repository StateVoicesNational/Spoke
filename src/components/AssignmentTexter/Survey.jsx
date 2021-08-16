import PropTypes from "prop-types";
import React, { Component } from "react";
import theme from "../../styles/theme";

import Divider from "@material-ui/core/Divider";
import ClearIcon from "@material-ui/icons/Clear";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";

import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

const styles = {
  root: {},
  card: {
    marginBottom: 10,
    backgroundColor: theme.components.popup.backgroundColor,
    padding: 10
  },
  cardHeader: {
    padding: 0
  },
  cardText: {
    padding: 0
  },
  pastQuestionsLink: {
    marginTop: "5px",
    borderTop: `1px solid ${theme.components.popup.outline}`,
    borderBottom: `1px solid ${theme.components.popup.outline}`
  }
};

class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllQuestions: false
    };
  }

  getNextScript({ interactionStep, answerIndex }) {
    // filteredAnswerOptions is only on the current script, but we might be choosing a previous script
    const answerOption = (interactionStep.question.filteredAnswerOptions ||
      interactionStep.question.answerOptions)[answerIndex];
    const { nextInteractionStep } = answerOption;
    return nextInteractionStep ? nextInteractionStep.script : null;
  }

  handleExpandChange = newExpandedState => {
    this.setState({ showAllQuestions: newExpandedState });
  };

  handlePrevious = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex - 1
    });
  };

  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex + 1
    });
  };

  handleSelectChange = async (interactionStep, answerIndex, value) => {
    const { onQuestionResponseChange } = this.props;
    let questionResponseValue = null;
    let nextScript = null;

    if (value !== "clearResponse") {
      questionResponseValue = value;
      nextScript = this.getNextScript({ interactionStep, answerIndex });
    }

    onQuestionResponseChange({
      interactionStep,
      questionResponseValue,
      nextScript
    });
  };

  renderAnswers(step, currentStep) {
    const menuItems = step.question.answerOptions.map(answerOption => (
      <MenuItem
        key={`${currentStep}_${step.id}_${
          answerOption.nextInteractionStep
            ? answerOption.nextInteractionStep.id
            : answerOption.value
        }`}
        value={answerOption.value}
      >
        {answerOption.value}
      </MenuItem>
    ));

    menuItems.push(<Divider key={`div${currentStep}_${step.id}`} />);
    menuItems.push(
      <MenuItem key="clear${currentStep}" value="clearResponse">
        Clear response
      </MenuItem>
    );

    return menuItems;
  }

  renderStep(step, currentStep) {
    const { questionResponses, currentInteractionStep } = this.props;
    const isCurrentStep = step.id === currentInteractionStep.id;
    const responseValue = questionResponses[step.id] || "";
    const { question } = step;
    const key = `topdiv${currentStep || 0}_${step.id}_${question.text}`;
    return (
      question.text && (
        <TextField
          select
          fullWidth
          label={question.text}
          onChange={event =>
            this.handleSelectChange(step, currentStep, event.target.value)
          }
          key={key}
          name={question.id}
          value={responseValue}
          helperText="Choose answer"
        >
          {this.renderAnswers(step, currentStep || 0)}
        </TextField>
      )
    );
  }

  renderCurrentStepOldStyle(step) {
    console.log("renderCurrentStepOldStyle", step);
    return this.renderStep(step, 1);
  }

  renderCurrentStep(step) {
    const { onRequestClose, questionResponses, listHeader } = this.props;
    const responseValue = questionResponses[step.id];
    return (
      <List key="curlist" style={{ width: "100%" }}>
        <h3 style={{ padding: 0, margin: 0 }}>
          {listHeader}
          <div style={{ fontWeight: "normal", fontSize: "70%" }}>
            What was their response to:
          </div>
          {step.question.text}
        </h3>
        {Object.keys(questionResponses).length ? (
          <ListItem
            button
            onClick={() => this.handleExpandChange(true)}
            key={`pastquestions`}
            style={styles.pastQuestionsLink}
          >
            <ListItemText primary="All Questions" />
            <ListItemIcon>
              <ArrowRightIcon />
            </ListItemIcon>
          </ListItem>
        ) : null}
        {(
          step.question.filteredAnswerOptions || step.question.answerOptions
        ).map((answerOption, index) => (
          <ListItem
            button
            value={answerOption.value}
            onClick={() => {
              this.handleSelectChange(
                step,
                index,
                responseValue === answerOption.value
                  ? "clearResponse"
                  : answerOption.value
              );
              this.props.onRequestClose();
            }}
            onKeyPress={evt => {
              if (evt.key === "Enter") {
                this.handleSelectChange(
                  step,
                  index,
                  responseValue === answerOption.value
                    ? "clearResponse"
                    : answerOption.value
                );
                this.props.onRequestClose();
              }
            }}
            key={`cur${index}_${answerOption.value}`}
          >
            <ListItemText
              primary={answerOption.value}
              secondary={
                answerOption.nextInteractionStep &&
                answerOption.nextInteractionStep.script
                  ? answerOption.nextInteractionStep.script
                  : null
              }
            />
            {responseValue === answerOption.value && (
              <ListItemIcon>
                <ClearIcon />
              </ListItemIcon>
            )}
          </ListItem>
        ))}
      </List>
    );
  }

  renderOldStyle() {
    const { interactionSteps, currentInteractionStep } = this.props;
    let { showAllQuestions } = this.state;

    return interactionSteps.length === 0 ? null : (
      <React.Fragment>
        <Accordion expanded={true}>
          <AccordionSummary>
            {showAllQuestions ? "All questions" : "Current question"}
          </AccordionSummary>
          <AccordionDetails>
            {showAllQuestions
              ? interactionSteps.map(step => this.renderStep(step, 0))
              : this.renderCurrentStepOldStyle(currentInteractionStep)}
          </AccordionDetails>
        </Accordion>
      </React.Fragment>
    );
  }

  renderMultipleQuestions() {
    const { interactionSteps } = this.props;
    let { showAllQuestions } = this.state;
    return (
      <Accordion
        expanded={showAllQuestions}
        onChange={(evt, expanded) => this.handleExpandChange(expanded)}
      >
        <AccordionSummary>All questions</AccordionSummary>
        {interactionSteps.map(step => (
          <AccordionDetails key={step.id}>
            {this.renderStep(step, 0)}
          </AccordionDetails>
        ))}
      </Accordion>
    );
  }

  renderSingleQuestion() {
    const { currentInteractionStep } = this.props;

    return (
      <Card>
        <CardContent>
          {this.renderCurrentStep(currentInteractionStep)}
        </CardContent>
      </Card>
    );
  }

  render() {
    const { interactionSteps } = this.props;
    const oldStyle = typeof this.props.onRequestClose != "function";

    if (oldStyle) {
      return this.renderOldStyle();
    } else if (interactionSteps.length > 1) {
      return this.renderMultipleQuestions();
    } else if (interactionSteps.length === 1) {
      return this.renderSingleQuestion();
    } else {
      return null;
    }
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: PropTypes.object,
  interactionSteps: PropTypes.array,
  currentInteractionStep: PropTypes.object,
  questionResponses: PropTypes.object,
  listHeader: PropTypes.object,
  onQuestionResponseChange: PropTypes.func,
  onRequestClose: PropTypes.func
};

export default AssignmentTexterSurveys;
