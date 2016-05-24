import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { OptOuts } from './opt_outs.js'
import { Assignments } from '../assignments/assignments.js'
import { Meteor } from 'meteor/meteor'
export const insert = new ValidatedMethod({
  name: 'opt_outs.insert',
  validate: new SimpleSchema({
    cell: { type: String },
    assignmentId: { type: String },
  }).validator(),
  run({ cell, assignmentId }) {
    // TODO - optimistic update?
    let organizationId = null
    if (Meteor.isServer) {
      const assignment = Assignments.findOne({_id: assignmentId})
      organizationId = assignment.campaign().organizationId
    }
    const optOut = {
      cell,
      assignmentId,
      organizationId,
      createdAt: new Date()
    }
    console.log("optout", optOut)
    OptOuts.insert(optOut, (error) => {
      if (error) {
        console.log(error)
      }
    })
  }
})