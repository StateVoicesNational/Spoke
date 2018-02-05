import React from 'react'
import {StyleSheetTestUtils} from 'aphrodite'
import {AssignmentTexterContact} from "../../src/containers/AssignmentTexterContact";
import sinon from 'sinon'

jest.mock('../../src/lib/timezones')

const campaign = {
  id: 9,
  isArchived: false,
  useDynamicAssignment: null,
  organization: {
    id: 2,
    textingHoursEnforced: true,
    textingHoursStart: 8,
    textingHoursEnd: 21,
    threeClickEnabled: false
  },
  customFields: []
}

const propsWithEnforcedTextingHoursCampaign = {
  texter: {
    id: 2,
    firstName: "larry",
    lastName: "person",
    assignedCell: null
  },
  campaign: campaign,
  assignment: {
    id: 9,
    userCannedResponses: [],
    campaignCannedResponses: [],
    texter: {
      id: 2,
      firstName: "larry",
      lastName: "person",
      assignedCell: null
    },
    campaign: campaign,
    contacts: [
      {
        id: 19,
        customFields: "{}"
      },
      {
        id: 20,
        customFields: "{}"
      }
    ],
    allContacts: [
      {
        id: 19
      },
      {
        id: 20
      }
    ],
  },
  data: {
    loading: false,
    contact: {
      id: 19,
      assignmentId: 9,
      firstName: "larry",
      lastName: "person",
      cell: "+19734779697",
      zip: "10025",
      customFields: "{}",
      optOut: null,
      currentInteractionStepScript: "{firstName}",
      interactionSteps: [
        {
          id: 11,
          questionResponse: null,
          question: {
            text: "",
            answerOptions: []
          }
        }
      ],
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: -5,
          hasDST: true
        }
      },
      messageStatus: "needsMessage",
      messages: []
    }
  }
}

describe('test isContactBetweenTextingHours', () => {
    var nowStub
    var assignmentTexterContact
    var timezones = require('../../src/lib/timezones')
    beforeAll(() => {
      assignmentTexterContact = new AssignmentTexterContact(propsWithEnforcedTextingHoursCampaign)
      timezones.isBetweenTextingHours.mockImplementation((o, c) => false)
      nowStub = sinon.stub(Date, 'now')
      nowStub.returns(new Date('2018-02-01T15:00:00.000Z'))
    })

    afterAll(() => {
      timezones.isBetweenTextingHours.mockRestore()
      nowStub.restore()
    })

    beforeEach(() => {
      jest.resetAllMocks()
    })

    it('works when the contact has location data', () => {

      let contact = {
        location: {
          city: "New York",
          state: "NY",
          timezone: {
            offset: -5,
            hasDST: true
          }
        }
      }

      expect(assignmentTexterContact.isContactBetweenTextingHours(contact)).toBeFalsy()
      expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1)

      let theCall = timezones.isBetweenTextingHours.mock.calls[0]
      expect(theCall[0]).toEqual({hasDST: true, offset: -5})
      expect(theCall[1]).toEqual({textingHoursStart: 8, textingHoursEnd: 21, textingHoursEnforced: true})


    })

    it('works when the contact does not have location data', () => {

      let contact = {}

      expect(assignmentTexterContact.isContactBetweenTextingHours(contact)).toBeFalsy()
      expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1)

      let theCall = timezones.isBetweenTextingHours.mock.calls[0]
      expect(theCall[0]).toBeNull()
      expect(theCall[1]).toEqual({textingHoursStart: 8, textingHoursEnd: 21, textingHoursEnforced: true})


    })
  }
)
