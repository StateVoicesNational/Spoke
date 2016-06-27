import { refreshTestData } from '../../api/server/refresh-test-data.js'
import { seedZipCodes } from '../../api/server/seed-zip-codes.js'
import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { _ } from 'meteor/underscore'
import { moment } from 'meteor/momentjs:moment'


Meteor.startup(() => {
  seedZipCodes()

  if (Meteor.settings.public.refreshTestData) {
    refreshTestData()
  }
})
