import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import IconButton from "material-ui/IconButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { Card, CardHeader, CardText } from "material-ui/Card";
import theme from "../styles/theme";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import HelpIconOutline from "material-ui/svg-icons/action/help-outline";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import yup from "yup";
import { makeTree } from "../lib";
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

export default class CampaignInteractionStepsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focusedField: null,
      availableActionsLookup: props.availableActions.reduce(
        (lookup, action) => {
          const toReturn = {
            ...lookup
          };
          toReturn[action.name] = action;
          return toReturn;
        },
        {}
      ),
      interactionSteps: this.props.formValues.interactionSteps[0]
        ? this.props.formValues.interactionSteps
        : [
            {
              id: "newId",
              parentInteractionId: null,
              questionText: "",
              answerOption: "",
              script: "",
              answerActions: "",
              answerActionsData: "",
              isDeleted: false
            }
          ],
      displayAllSteps: false
    };
  }
  /*
    this.state.displayAllSteps is used to cause only the root interaction
    node to render when the component first mounts.  ComponentDidMount sets
    displayAllSteps to true, which forces render to run again, this time
    including all interaction steps. This cuts half the time required to
    render the interaction steps after clicking the header to expand the
    interaction steps card.

    FUTURE: reevaluate this after React >=16 upgrade
  */
  componentDidMount = () => {
    if (!this.state.displayAllSteps) {
      this.setState({ displayAllSteps: true });
    }
  };

  onSave = async () => {
    const tweakedInteractionSteps = this.state.interactionSteps.map(is => {
      const tweakedInteractionStep = {
        ...is
      };

      delete tweakedInteractionStep.needRequiredAnswerActionsData;

      if (is.answerActionsData && typeof is.answerActionsData !== "string") {
        tweakedInteractionStep.answerActionsData = JSON.stringify(
          is.answerActionsData
        );
      }

      return tweakedInteractionStep;
    });

    await this.props.onChange({
      interactionSteps: tweakedInteractionSteps
    });
    return this.props.onSubmit();
  };

  addStep(parentInteractionId) {
    return () => {
      const newId =
        "new" +
        Math.random()
          .toString(36)
          .replace(/[^a-zA-Z1-9]+/g, "");
      this.setState({
        interactionSteps: [
          ...this.state.interactionSteps,
          {
            id: newId,
            parentInteractionId,
            questionText: "",
            script: "",
            answerOption: "",
            answerActions: "",
            answerActionsData: "",
            isDeleted: false
          }
        ]
      });
    };
  }

  deleteStep(id) {
    return () => {
      this.setState({
        interactionSteps: this.state.interactionSteps.map(is => {
          const copiedInteractionStep = {
            ...is
          };

          if (copiedInteractionStep.id === id) {
            copiedInteractionStep.isDeleted = true;
            this.state.interactionSteps
              .filter(isp => isp.parentInteractionId === is.id)
              .forEach(isp => {
                this.deleteStep(isp.id);
              });
          }
          return copiedInteractionStep;
        })
      });
    };
  }

  handleFormChange(event) {
    const handler =
      event.answerActions &&
      this.state.availableActionsLookup[event.answerActions];
    this.setState({
      answerActions: handler,
      answerActionsData: event.answerActionsData,
      interactionSteps: this.state.interactionSteps.map(is => {
        const copiedEvent = {
          ...event
        };
        delete copiedEvent.interactionSteps;
        if (is.id === event.id) {
          copiedEvent.needRequiredAnswerActionsData =
            handler &&
            !event.answerActionsData &&
            handler.clientChoiceData &&
            handler.clientChoiceData.length > 0;
          return copiedEvent;
        }
        return is;
      })
    });
  }

  formSchema = yup.object({
    script: yup.string(),
    questionText: yup.string(),
    answerOption: yup.string(),
    answerActions: yup.string(),
    answerActionsData: yup.string()
  });

  renderInteractionStep(interactionStep, availableActions, title = "Start") {
    const answerActions =
      interactionStep.answerActions &&
      availableActions[interactionStep.answerActions];
    let clientChoiceData;
    let instructions;

    if (answerActions) {
      clientChoiceData = answerActions.clientChoiceData;
      instructions = answerActions.instructions;
    }

    return (
      <div>
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
              onChange={this.handleFormChange.bind(this)}
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
              {interactionStep.parentInteractionId ? (
                <DeleteIcon
                  style={styles.pullRight}
                  onTouchTap={this.deleteStep(interactionStep.id).bind(this)}
                />
              ) : (
                ""
              )}
              {interactionStep.parentInteractionId &&
              this.props.availableActions &&
              this.props.availableActions.length ? (
                <div key={`answeractions-${interactionStep.id}`}>
                  <div>
                    <Form.Field
                      {...dataTest("actionSelect")}
                      floatingLabelText="Action handler"
                      name="answerActions"
                      type="select"
                      default=""
                      choices={[
                        ...this.props.availableActions.map(action => ({
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
                customFields={this.props.customFields}
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
                onTouchTap={this.addStep(interactionStep.id).bind(this)}
                style={{ marginBottom: "10px" }}
              />
            </div>
          ) : (
            ""
          )}
          {this.state.displayAllSteps &&
            interactionStep.interactionSteps
              .filter(is => !is.isDeleted)
              .map(is => (
                <div>
                  {this.renderInteractionStep(
                    is,
                    availableActions,
                    `Question: ${interactionStep.questionText}`
                  )}
                </div>
              ))}
        </div>
      </div>
    );
  }

  render() {
    const availableActions = this.props.availableActions.reduce(
      (result, action) => {
        const toReturn = {
          ...result
        };
        toReturn[action.name] = action;
        return toReturn;
      },
      {}
    );

    const tree = makeTree(this.state.interactionSteps);

    return (
      <div>
        <CampaignFormSectionHeading
          title="What do you want to discuss?"
          subtitle="You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity."
        />
        {this.renderInteractionStep(tree, availableActions)}
        <RaisedButton
          {...dataTest("interactionSubmit")}
          disabled={this.state.interactionSteps.some(
            is => is.needRequiredAnswerActionsData && !is.isDeleted
          )}
          primary
          label={this.props.saveLabel}
          onTouchTap={this.onSave.bind(this)}
        />
      </div>
    );
  }
}

CampaignInteractionStepsForm.propTypes = {
  formValues: type.object,
  onChange: type.func,
  ensureComplete: type.bool,
  onSubmit: type.func,
  customFields: type.array,
  saveLabel: type.string,
  errors: type.array,
  availableActions: type.array
};
