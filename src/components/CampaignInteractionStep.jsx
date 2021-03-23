import type from "prop-types";
import React, { PureComponent } from "react";
import RaisedButton from "material-ui/RaisedButton";
import IconButton from "material-ui/IconButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { Card, CardHeader, CardText } from "material-ui/Card";
import theme from "../styles/theme";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import yup from "yup";
import { isEqual, orderBy, differenceWith } from "lodash";
import { dataTest } from "../lib/attributes";
import { StyleSheet, css } from "aphrodite";

const styleSheet = StyleSheet.create({
  errorMessage: {
    color: theme.colors.red
  }
});

const styles = {
  pullRight: {
    float: "right",
    position: "relative",
    top: "10px",
    icon: "pointer"
  },

  cardHeader: {
    backgroundColor: theme.colors.veryLightGray
  },

  interactionStep: {
    borderLeft: `5px solid ${theme.colors.green}`,
    marginBottom: 24
  },

  answerContainer: {
    marginLeft: "35px",
    marginTop: "10px",
    borderLeft: `3px dashed ${theme.colors.veryLightGray}`
  }
};

export default class CampaignInteractionStep extends PureComponent {
  shouldComponentUpdate(nextProps, nextState) {
    /* Putting each IStep into its own component is necessary
      to leverage this re-render check – otherwise complex interaction
      trees with many steps result in very poor UI responsiveness

      Note: PureComponent only checks on shallow equality; we have complex
      props (arrays & objects) so we have to do a deep check here, which is
      still far more performant than all steps re-rendering on every change
    */

    const { interactionStep, availableActions } = this.props;
    if (
      !isEqual(interactionStep, nextProps.interactionStep) ||
      !isEqual(availableActions, nextProps.availableActions) ||
      !isEqual(this.state, nextState)
    ) {
      return true;
    }
    return false;
  }

  componentDidUpdate(lastProps) {
    /* somewhat hacky way of "focusing" a newly created question.
      with complex trees finding newly created step is a challenge otherwise
    */

    // 1. identify only actually newly created isteps
    const diff =
      differenceWith(
        this.props.interactionStep.interactionSteps || [],
        lastProps.interactionStep.interactionSteps || [],
        isEqual
      ) || [];

    // 2. be absolutely sure we're grabbing the most recently created
    const newStep = orderBy(diff, ["id"], ["desc"]).find(step =>
      step.id.includes("new")
    );

    // 3. all istep components are wrapped in a div w/ ref we can scroll to
    if (newStep) {
      const ref = this[`step${newStep.id}Ref`];
      if (ref) ref.scrollIntoView({ behavior: "smooth" });
    }
  }

  formSchema = yup.object({
    script: yup.string(),
    questionText: yup.string(),
    answerOption: yup.string(),
    answerActions: yup.string(),
    answerActionsData: yup.string()
  });

  render() {
    const {
      interactionStep,
      availableActions,
      title,
      customFields,
      handlers
    } = this.props;

    const answerActions =
      interactionStep.answerActions &&
      availableActions.find(
        action => interactionStep.answerActions === action.name
      );
    let clientChoiceData;
    let instructions;

    if (answerActions) {
      clientChoiceData = answerActions.clientChoiceData;
      instructions = answerActions.instructions;
    }

    return (
      <div>
        {interactionStep.parentInteractionId ? (
          <div>
            <DeleteIcon
              style={styles.pullRight}
              onTouchTap={handlers.deleteStep(interactionStep.id)}
            />
            <RaisedButton
              label="Bump"
              onTouchTap={handlers.bumpStep(interactionStep.id)}
            />
            <RaisedButton
              label="Top"
              onTouchTap={handlers.topStep(interactionStep.id)}
            />
            <RaisedButton
              label="Bottom"
              onTouchTap={handlers.bottomStep(interactionStep.id)}
            />
          </div>
        ) : (
          ""
        )}
        <Card
          style={styles.interactionStep}
          ref={interactionStep.id}
          key={interactionStep.id}
        >
          <CardHeader
            style={styles.cardHeader}
            title={title}
            subtitle={
              interactionStep.parentInteractionId
                ? ""
                : "Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact."
            }
          />
          <CardText>
            <GSForm
              {...dataTest(
                "childInteraction",
                !interactionStep.parentInteractionId
              )}
              schema={this.formSchema}
              value={{
                ...interactionStep,
                ...(interactionStep.answerActionsData && {
                  answerActionsData:
                    typeof interactionStep.answerActionsData === "string"
                      ? JSON.parse(interactionStep.answerActionsData)
                      : interactionStep.answerActionsData
                })
              }}
              onChange={handlers.onFormChange}
            >
              {interactionStep.parentInteractionId ? (
                <Form.Field
                  {...dataTest("answerOption")}
                  name="answerOption"
                  label="Answer"
                  fullWidth
                  hintText="Answer to the previous question"
                />
              ) : (
                ""
              )}
              {interactionStep.parentInteractionId &&
              availableActions &&
              availableActions.length ? (
                <div key={`answeractions-${interactionStep.id}`}>
                  <div>
                    <Form.Field
                      {...dataTest("actionSelect")}
                      floatingLabelText="Action handler"
                      name="answerActions"
                      type="select"
                      default=""
                      choices={[
                        { label: "NONE" },
                        ...availableActions.map(action => ({
                          value: action.name,
                          label: action.displayName
                        }))
                      ]}
                    />
                    <IconButton tooltip="An action is something that is triggered by this answer being chosen, often in an outside system">
                      <HelpIconOutline />
                      <div></div>
                    </IconButton>
                    {instructions ? <div>{instructions}</div> : null}
                  </div>
                  {clientChoiceData && clientChoiceData.length ? (
                    <div>
                      <Form.Field
                        {...dataTest("actionDataAutoComplete")}
                        hintText="Start typing to search for the data to use with the answer action"
                        floatingLabelText="Answer Action Data"
                        fullWidth
                        name="answerActionsData"
                        type="autocomplete"
                        choices={clientChoiceData.map(item => ({
                          value: item.details,
                          label: item.name
                        }))}
                      />
                      {interactionStep.needRequiredAnswerActionsData ? (
                        <div className={css(styleSheet.errorMessage)}>
                          Action requires additional data. Please select
                          something.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                ""
              )}
              <Form.Field
                {...dataTest("editorInteraction")}
                name="script"
                type="script"
                fullWidth
                customFields={customFields}
                label="Script"
                multiLine
                hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
              />
              <Form.Field
                {...dataTest("questionText")}
                name="questionText"
                label="Question"
                fullWidth
                hintText="A question for texters to answer. E.g. Can this person attend the event?"
              />
            </GSForm>
          </CardText>
        </Card>
        <div style={styles.answerContainer}>
          {interactionStep.questionText &&
          interactionStep.script &&
          (!interactionStep.parentInteractionId ||
            interactionStep.answerOption) ? (
            <div>
              <RaisedButton
                {...dataTest("addResponse")}
                label="+ Add a response"
                onTouchTap={handlers.addStep(interactionStep.id)}
                style={{ marginBottom: "10px" }}
              />
            </div>
          ) : (
            ""
          )}
          {interactionStep.interactionSteps
            .filter(childStep => !childStep.isDeleted)
            .map(childStep => (
              <div
                key={`ref-${childStep.id}`}
                ref={div => {
                  this[`step${childStep.id}Ref`] = div;
                }}
              >
                <CampaignInteractionStep
                  key={childStep.id}
                  interactionStep={childStep}
                  availableActions={availableActions}
                  customFields={customFields}
                  title={`Question: ${interactionStep.questionText}`}
                  handlers={handlers}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }
}

CampaignInteractionStep.propTypes = {
  formValues: type.object,
  onChange: type.func,
  ensureComplete: type.bool,
  onSubmit: type.func,
  customFields: type.array,
  saveLabel: type.string,
  errors: type.array,
  availableActions: type.array,
  handlers: type.object
};
