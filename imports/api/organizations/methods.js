import { Roles } from 'meteor/alanning:roles'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

import { Organizations } from './organizations.js';

export const insert = new ValidatedMethod({
  name: 'organizations.insert',
  validate: new SimpleSchema({
    name: { type: String }
  }).validator(),
  run({ name }) {
    const organizationId = Organizations.insert({
      name,
      createdAt: new Date()
    })

    Roles.addUsersToRoles(this.userId, ['admin'], organizationId)
  }
})

export const addTexter = new ValidatedMethod({
  name: 'organizations.addTexter',
  validate: new SimpleSchema({
    organizationId: { type: String },
  }).validator(),
  run({ organizationId }) {
    if (!this.userId)
      return

    Roles.addUsersToRoles(this.userId, ['texter'], organizationId)
  }
})