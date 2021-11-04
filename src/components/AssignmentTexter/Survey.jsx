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

  handleSelectChange = async (interactionStep, answerIndexInput, value) => {
    const { onQuestionResponseChange } = this.props;
    let questionResponseValue = null;
    let nextScript = null;
    let answerIndex = answerIndexInput;
    if (answerIndexInput === null) {
      // need to find the answerIndex in the answerOptions
      const answerOptions =
        interactionStep.question && interactionStep.question.answerOptions;
      if (answerOptions && answerOptions.length) {
        answerOptions.find((ans, i) => {
          if (ans.value === value) {
            answerIndex = i;
            return true;
          }
        });
      } else {
        answerIndex = 0; // shouldn't be empty
      }
    }
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

  renderAnswers(step, currentStepKey) {
    const menuItems = step.question.answerOptions.map(answerOption => (
      <MenuItem
        key={`${currentStepKey}_${step.id}_${
          answerOption.nextInteractionStep
            ? answerOption.nextInteractionStep.id
            : answerOption.value
        }`}
        value={answerOption.value}
      >
        {answerOption.value}
      </MenuItem>
    ));

    menuItems.push(<Divider key={`div${currentStepKey}_${step.id}`} />);
    menuItems.push(
      <MenuItem key="clear${currentStepKey}" value="clearResponse">
        Clear response
      </MenuItem>
    );

    return menuItems;
  }

  renderStep(step, currentStepKey) {
    const { questionResponses, currentInteractionStep } = this.props;
    const isCurrentStep = step.id === currentInteractionStep.id;
    const responseValue = questionResponses[step.id] || "";
    const { question } = step;
    const key = `topdiv${currentStepKey || 0}_${step.id}_${question.text}`;
    return (
      question.text && (
        <TextField
          select
          fullWidth
          label={question.text}
          onChange={event =>
            this.handleSelectChange(step, null, event.target.value)
          }
          key={key}
          name={question.id}
          value={responseValue}
          helperText="Choose answer"
        >
          {this.renderAnswers(step, currentStepKey || "0")}
        </TextField>
      )
    );
  }

  renderCurrentStep(step) {
    const { onRequestClose, questionResponses, listHeader } = this.props;
    const responseValue = questionResponses[step.id];
    return (
      <List key="curlist" style={{ width: "100%" }}>
        <h3 style={{ padding: "0 0 0 6px", margin: 0 }}>
          {listHeader}
          <div style={{ fontWeight: "normal", fontSize: "70%" }}>
            What was their response to:
          </div>
          {step.question.text}
        </h3>
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

  renderMultipleQuestions() {
    const { interactionSteps, currentInteractionStep } = this.props;
    let { showAllQuestions } = this.state;
    return (
      <div>
        <Accordion
          expanded={showAllQuestions}
          onChange={(evt, expanded) => this.handleExpandChange(expanded)}
        >
          <AccordionSummary style={styles.pastQuestionsLink}>
            All questions
            <ArrowRightIcon />
          </AccordionSummary>
          {interactionSteps.map((step, i) => (
            <AccordionDetails key={step.id}>
              {this.renderStep(step, i)}
            </AccordionDetails>
          ))}
        </Accordion>
        {currentInteractionStep
          ? this.renderCurrentStep(currentInteractionStep)
          : null}
      </div>
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
    const { interactionSteps, currentInteractionStep } = this.props;
    if (interactionSteps.length > 1) {
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
