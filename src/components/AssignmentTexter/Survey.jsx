import PropTypes from "prop-types";
import React, { Component } from "react";
import theme from "../../styles/theme";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Subheader from "material-ui/Subheader";
import { List, ListItem } from "material-ui/List";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import SelectField from "material-ui/SelectField";
import ArrowRightIcon from "material-ui/svg-icons/hardware/keyboard-arrow-right";
import ClearIcon from "material-ui/svg-icons/content/clear";

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
    const answerOption = interactionStep.question.answerOptions[answerIndex];

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
        primaryText={answerOption.value}
      />
    ));

    menuItems.push(<Divider key={`div${currentStep}_${step.id}`} />);
    menuItems.push(
      <MenuItem
        key="clear${currentStep}"
        value="clearResponse"
        primaryText="Clear response"
      />
    );

    return menuItems;
  }

  renderStep(step, currentStep) {
    const { questionResponses, currentInteractionStep } = this.props;
    const isCurrentStep = step.id === currentInteractionStep.id;
    const responseValue = questionResponses[step.id];
    const { question } = step;

    return question.text ? (
      <div key={`topdiv${currentStep || 0}_${step.id}`}>
        <SelectField
          style={
            isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect
          }
          onChange={(event, index, value) =>
            this.handleSelectChange(step, index, value)
          }
          key={`select${currentStep || 0}_${step.id}`}
          name={question.id}
          fullWidth
          value={responseValue}
          floatingLabelText={question.text}
          hintText="Choose answer"
        >
          {this.renderAnswers(step, currentStep || 0)}
        </SelectField>
      </div>
    ) : (
      ""
    );
  }

  renderCurrentStep(step, oldStyle) {
    const { onRequestClose, questionResponses, listHeader } = this.props;
    if (oldStyle) {
      return this.renderStep(step, 1);
    }
    const responseValue = questionResponses[step.id];
    return (
      <List key="curlist">
        <h3 style={{ padding: 0, margin: 0 }}>
          {listHeader}
          <div style={{ fontWeight: "normal", fontSize: "70%" }}>
            What was their response to:
          </div>
          {step.question.text}
        </h3>
        {Object.keys(questionResponses).length ? (
          <ListItem
            onClick={() => {
              this.handleExpandChange(true);
            }}
            key={`pastquestions`}
            primaryText={"Past Questions"}
            rightIcon={<ArrowRightIcon />}
            style={styles.pastQuestionsLink}
          />
        ) : null}
        {step.question.answerOptions.map((answerOption, index) => (
          <ListItem
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
            primaryText={answerOption.value}
            secondaryText={
              answerOption.nextInteractionStep &&
              answerOption.nextInteractionStep.script
                ? answerOption.nextInteractionStep.script
                : null
            }
            rightIcon={
              responseValue === answerOption.value ? <ClearIcon /> : null
            }
          />
        ))}
        {responseValue ? null : null}
      </List>
    );
  }

  render() {
    const { interactionSteps, currentInteractionStep } = this.props;
    const oldStyle = typeof this.props.onRequestClose != "function";

    const { showAllQuestions } = this.state;
    return interactionSteps.length === 0 ? null : (
      <Card style={styles.card} onExpandChange={this.handleExpandChange}>
        {oldStyle || showAllQuestions ? (
          <CardHeader
            style={styles.cardHeader}
            title={showAllQuestions ? "All questions" : "Current question"}
            showExpandableButton={oldStyle && interactionSteps.length > 1}
          />
        ) : null}
        <CardText style={styles.cardText} key={"curcard"}>
          {showAllQuestions
            ? ""
            : this.renderCurrentStep(currentInteractionStep, oldStyle)}
        </CardText>
        {showAllQuestions ? (
          <CardText style={styles.cardText} key={"curtext"}>
            {interactionSteps.map(step => this.renderStep(step, 0))}
          </CardText>
        ) : null}
      </Card>
    );
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
