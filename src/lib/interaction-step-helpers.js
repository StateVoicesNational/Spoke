export function findParent(interactionStep, allInteractionSteps, isModel) {
  let parent = null;
  allInteractionSteps.forEach(step => {
    if (isModel) {
      if (step.id == interactionStep.parent_interaction_id) {
        parent = {
          ...step,
          answerLink: interactionStep.answer_option
        };
      }
    } else {
      if (isModel || (step.question && step.question.answerOptions)) {
        step.question.answerOptions.forEach(answer => {
          if (
            answer.nextInteractionStep &&
            answer.nextInteractionStep.id === interactionStep.id
          ) {
            parent = {
              ...step,
              answerLink: answer.value
            };
          }
        });
      }
    }
  });
  return parent;
}

export function getInteractionPath(
  interactionStep,
  allInteractionSteps,
  isModel
) {
  const path = [];
  let parent = findParent(interactionStep, allInteractionSteps, isModel);
  while (parent !== null) {
    path.unshift(parent);
    parent = findParent(parent, allInteractionSteps, isModel);
  }
  return path;
}

export function interactionStepForId(id, interactionSteps) {
  let interactionStep = null;
  interactionSteps.forEach(step => {
    if (step.id === id) {
      interactionStep = step;
    }
  });
  return interactionStep;
}

export function getChildren(interactionStep, allInteractionSteps, isModel) {
  const children = [];
  allInteractionSteps.forEach(step => {
    const path = getInteractionPath(step, allInteractionSteps, isModel);
    path.forEach(pathElement => {
      if (pathElement.id === interactionStep.id) {
        children.push(step);
      }
    });
  });
  return children;
}

export function getInteractionTree(allInteractionSteps, isModel) {
  const pathLengthHash = {};
  allInteractionSteps.forEach(step => {
    const path = getInteractionPath(step, allInteractionSteps, isModel);
    pathLengthHash[path.length] = pathLengthHash[path.length] || [];
    pathLengthHash[path.length].push({ interactionStep: step, path });
  });
  return pathLengthHash;
}

export function sortInteractionSteps(interactionSteps) {
  const pathTree = getInteractionTree(interactionSteps);
  const orderedSteps = [];
  Object.keys(pathTree).forEach(key => {
    const orderedBranch = pathTree[key].sort(
      (a, b) =>
        JSON.stringify(a.interactionStep) < JSON.stringify(b.interactionStep)
    );
    orderedBranch.forEach(ele => orderedSteps.push(ele.interactionStep));
  });
  return orderedSteps;
}

export function getTopMostParent(interactionSteps, isModel) {
  return getInteractionTree(interactionSteps, isModel)[0][0].interactionStep;
}

export function makeTree(interactionSteps, id = null) {
  const root = interactionSteps.filter(is =>
    id ? is.id === id : is.parentInteractionId === null
  )[0];
  const children = interactionSteps.filter(
    is => is.parentInteractionId === root.id
  );
  return {
    ...root,
    interactionSteps: children.map(c => {
      return makeTree(interactionSteps, c.id);
    })
  };
}

export function assembleAnswerOptions(allInteractionSteps) {
  // creates recursive array required for the graphQL query with 'answerOptions' key
  const interactionStepsCopy = allInteractionSteps.map(is => ({
    ...is,
    answerOptions: []
  }));
  allInteractionSteps.forEach(interactionStep => {
    if (interactionStep.parent_interaction_id) {
      const [parentStep] = interactionStepsCopy.filter(
        parent => parent.id === interactionStep.parent_interaction_id
      );
      if (parentStep) {
        parentStep.answerOptions.push({
          nextInteractionStep: interactionStep,
          value: interactionStep.answer_option,
          action: interactionStep.answer_actions,
          action_data: interactionStep.answer_actions_data,
          interaction_step_id: interactionStep.id,
          parent_interaction_step: interactionStep.parent_interaction_id
        });
      }
    }
  });
  return interactionStepsCopy;
}

export function getAvailableInteractionSteps(
  questionResponses,
  allInteractionSteps
) {
  // helper for the client
  // questionResponses: key=interactionStepId:value=questionResponse.value
  // interactionSteps: all interaction steps
  const availableSteps = [];

  let step = getTopMostParent(allInteractionSteps);

  while (step) {
    availableSteps.push(step);
    const questionResponseValue = questionResponses[step.id];
    if (questionResponseValue) {
      const matchingAnswerOption = step.question.answerOptions.find(
        answerOption => answerOption.value === questionResponseValue
      );
      if (matchingAnswerOption && matchingAnswerOption.nextInteractionStep) {
        step = interactionStepForId(
          matchingAnswerOption.nextInteractionStep.id,
          allInteractionSteps
        );
      } else {
        step = null;
      }
    } else {
      step = null;
    }
  }

  return availableSteps;
}
