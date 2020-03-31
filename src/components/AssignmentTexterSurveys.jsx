import PropTypes from "prop-types";
import React, { Component } from "react";
import { grey50 } from "material-ui/styles/colors";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Subheader from "material-ui/Subheader";
import { List, ListItem } from "material-ui/List";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import SelectField from "material-ui/SelectField";

const styles = {
  root: {},
  card: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: grey50,
    padding: 10
  },
  cardHeader: {
    padding: 0
  },
  cardText: {
    padding: 0
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

  renderCurrentStep(step) {
    const { onRequestClose } = this.props;
    if (typeof this.props.onRequestClose != "function") {
      return this.renderStep(step, 1);
    }
    return (
      <List key="curlist">
        <Divider key="curdivider" />
        <Subheader key="cursubheader">{step.question.text}</Subheader>
        {step.question.answerOptions.map((answerOption, index) => (
          <ListItem
            value={answerOption.value}
            onTouchTap={() => {
              this.handleSelectChange(step, index, answerOption.value);
              this.props.onRequestClose();
            }}
            key={`cur${index}_${answerOption.value}`}
            primaryText={answerOption.value}
          />
        ))}
      </List>
    );
  }

  render() {
    const { interactionSteps, currentInteractionStep } = this.props;

    const { showAllQuestions } = this.state;
    return interactionSteps.length === 0 ? null : (
      <Card style={styles.card} onExpandChange={this.handleExpandChange}>
        <CardHeader
          style={styles.cardHeader}
          title={showAllQuestions ? "All questions" : "Current question"}
          showExpandableButton={interactionSteps.length > 1}
        />
        <CardText style={styles.cardText} key={"curcard"}>
          {showAllQuestions
            ? ""
            : this.renderCurrentStep(currentInteractionStep)}
        </CardText>
        <CardText style={styles.cardText} key={"curtext"} expandable>
          {interactionSteps.map(step => this.renderStep(step, 0))}
        </CardText>
      </Card>
    );
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: PropTypes.object,
  interactionSteps: PropTypes.array,
  currentInteractionStep: PropTypes.object,
  questionResponses: PropTypes.object,
  onQuestionResponseChange: PropTypes.func,
  onRequestClose: PropTypes.func
};

export default AssignmentTexterSurveys;
