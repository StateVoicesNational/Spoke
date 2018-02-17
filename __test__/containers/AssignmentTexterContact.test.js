import React from 'react'
import moment from 'moment-timezone'
import {mount} from "enzyme";
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import {StyleSheetTestUtils} from 'aphrodite'
import {AssignmentTexterContact} from "../../src/containers/AssignmentTexterContact";

var MockDate = require('mockdate');

jest.mock('../../src/lib/timezones')
jest.unmock('../../src/lib/tz-helpers')
jest.useFakeTimers()

var timezones = require('../../src/lib/timezones')
timezones.getLocalTime.mockReturnValue(moment().utc().utcOffset((moment().isDST() && true) ? -4 : -5))

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
  refreshData: jest.fn(),
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

describe('when contact is not within texting hours...', () => {
  var component
  beforeEach(() => {
    timezones.isBetweenTextingHours.mockReturnValue(false)
    StyleSheetTestUtils.suppressStyleInjection();
    component = mount(
      <MuiThemeProvider>
        <AssignmentTexterContact
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          data={propsWithEnforcedTextingHoursCampaign.data}
        />
      </MuiThemeProvider>
    )
  })
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset()
  })
  it('it refreshes data in componentDidMount', () => {
    jest.runOnlyPendingTimers()
    expect(propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls).toHaveLength(1)
  })
})


describe('when contact is within texting hours...', () => {
  var component
  beforeEach(() => {
    timezones.isBetweenTextingHours.mockReturnValue(true)
    StyleSheetTestUtils.suppressStyleInjection();
    component = mount(
      <MuiThemeProvider>
        <AssignmentTexterContact
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          data={propsWithEnforcedTextingHoursCampaign.data}
        />
      </MuiThemeProvider>
    )
  })
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset()
  })
  it('it does NOT refresh data in componentDidMount', () => {
    jest.runOnlyPendingTimers()
    expect(propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls).toHaveLength(0)
  })
})

describe('AssignmentTextContact has the proper enabled/disabled state when created', () => {

  it('is enabled if the contact is inside texting hours', () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(true)
    var assignmentTexterContact = new AssignmentTexterContact(propsWithEnforcedTextingHoursCampaign)
    expect(assignmentTexterContact.state.disabled).toBeFalsy()
    expect(assignmentTexterContact.state.disabledText).toEqual('Sending...')
  })

  it('is disabled if the contact is inside texting hours', () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(false)
    var assignmentTexterContact = new AssignmentTexterContact(propsWithEnforcedTextingHoursCampaign)
    expect(assignmentTexterContact.state.disabled).toBeTruthy()
    expect(assignmentTexterContact.state.disabledText).toEqual('Refreshing because it\'s now out of texting hours for some of your contacts')
  })
})

describe('test isContactBetweenTextingHours', () => {
    var assignmentTexterContact

    beforeAll(() => {
      assignmentTexterContact = new AssignmentTexterContact(propsWithEnforcedTextingHoursCampaign)
      timezones.isBetweenTextingHours.mockImplementation((o, c) => false)
      MockDate.set('2018-02-01T15:00:00.000Z')
    })

    afterAll(() => {
      MockDate.reset()
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
