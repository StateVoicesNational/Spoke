import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { makeTree } from "../lib";
import { dataTest } from "../lib/attributes";

import InteractionStep from "./CampaignInteractionStep";

export default class CampaignInteractionStepsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
          ]
    };
  }

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
      // keep it simple – and sortable
      const newId = `new${Date.now()}`;

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

  bumpStep(id) {
    return () => {
      const step = this.state.interactionSteps.find(is => is.id === id);
      const livingSiblings = [];
      const otherRelatives = [];
      for (const is of this.state.interactionSteps) {
        if (
          is.parentInteractionId !== step.parentInteractionId ||
          step.isDeleted
        ) {
          otherRelatives.push(is);
        } else {
          livingSiblings.push(is);
        }
      }
      const i = livingSiblings.findIndex(is => is.id === id);
      if (i > 0) {
        livingSiblings.splice(i, 1);
        livingSiblings.splice(i - 1, 0, step);
        this.setState({
          interactionSteps: otherRelatives.concat(livingSiblings)
        });
      }
    };
  }

  topStep(id) {
    return () => {
      const target = this.state.interactionSteps.filter(x => x.id === id);
      const others = this.state.interactionSteps.filter(x => x.id !== id);
      this.setState({
        interactionSteps: target.concat(others)
      });
    };
  }

  bottomStep(id) {
    return () => {
      const target = this.state.interactionSteps.filter(x => x.id === id);
      const others = this.state.interactionSteps.filter(x => x.id !== id);
      this.setState({
        interactionSteps: others.concat(target)
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

  render() {
    const parentStepTree = makeTree(this.state.interactionSteps);

    return (
      <div>
        <CampaignFormSectionHeading
          title="What do you want to discuss?"
          subtitle="You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity."
        />
        <InteractionStep
          interactionStep={parentStepTree}
          availableActions={this.props.availableActions}
          title="Start"
          customFields={this.props.customFields}
          handlers={{
            addStep: this.addStep.bind(this),
            deleteStep: this.deleteStep.bind(this),
            bumpStep: this.bumpStep.bind(this),
            topStep: this.topStep.bind(this),
            bottomStep: this.bottomStep.bind(this),
            onFormChange: this.handleFormChange.bind(this)
          }}
        />
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
