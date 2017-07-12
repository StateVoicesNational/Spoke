import { r } from '../server/models'

// For each answer_option on interaction steps with question:
// - Move the value to the answer_option field of the child interaction step
// - Set the parent_interaction_id of the child to the id of the parent
// - TODO: Drop the answer_options field

// Run this migration on a running dev or prod instance with the following command:
// ./dev-tools/babel-run-with-env.js ./src/migrations/2017-06-30-interaction-step-answer-option.js

(async function () {
  console.log('migrating interaction steps to updated schema')
  try {
    const parentSteps = await r.db('spoke')
      .table('interaction_step')
      .filter((step) => step('answer_options')
      .ne([]))
    console.log(parentSteps)
    const parentCount = parentSteps.length
    for (let i = 0; i < parentCount; i++) {
      const answerCount = parentSteps[i]['answer_options'].length
      for (let j = 0; j < answerCount; j++) {
        const parentId = parentSteps[i]['id']
        const answerOption = parentSteps[i]['answer_options'][j]
        console.log(answerOption)
        const answerStepUpdate = await r.db('spoke')
          .table('interaction_step')
          .get(answerOption.interaction_step_id)
          .update({ 'answer_option': answerOption.value, 'parent_interaction_id': parentId })
        console.log(answerStepUpdate)
      }
    }
  } catch (ex) {
    console.log(ex)
  }
})()
