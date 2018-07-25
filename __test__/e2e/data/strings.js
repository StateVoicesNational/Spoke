import path from 'path'
import _ from 'lodash'

// Common to all campaigns
const contacts = {
  csv: path.resolve(__dirname, './people.csv')
}

const texters = {
  contactLength: 2,
  contactLengthAfterOptOut: 1
}

const interaction = {
  script: 'Test First {firstName} Last {lastName}!',
  question: 'Test Question?',
  answers: [
    {
      answerOption: 'Test Answer 0',
      script: 'Test Answer 0 {firstName}.',
      questionText: 'Test Child Question 0?'
    },
    {
      answerOption: 'Test Answer 1',
      script: 'Test Answer 1 {lastName}.',
      questionText: 'Test Child Question 1?'
    }
  ]
}

const interactionShort = {
  script: 'S',
  question: 'Q',
  answers: [
    {
      answerOption: 'TA0',
      script: 'TA0.',
      questionText: 'TCQ0?'
    },
    {
      answerOption: 'TA1',
      script: 'TA1.',
      questionText: 'TCQ1?'
    }
  ]
}

const cannedResponses = [
  {
    title: 'Test CR0',
    script: 'Test CR First {firstName} Last {lastName}.'
  }
]

const cannedResponsesShort = [
  {
    title: 'CR',
    script: 'S'
  }
]

const standardReply = 'Test Reply'

const org = 'SpokeTestOrg'

const users = {
  /**
   * Note: Changing passwords for existing Auth0 users requires the user be removed from Auth0
   */
  admin0: {
    name: 'admin0',
    email: 'spokeadmin0@moveon.org',
    password: 'SpokeAdmin0!',
    given_name: 'Adminzerofirst',
    family_name: 'Adminzerolast',
    cell: '4145550000'
  },
  admin1: {
    name: 'admin1',
    email: 'spokeadmin1@moveon.org',
    email_changed: 'spokeadmin1b@moveon.org',
    password: 'SpokeAdmin1!',
    given_name: 'Adminonefirst',
    given_name_changed: 'Adminonefirstb',
    family_name: 'Adminonelast',
    family_name_changed: 'Adminonelastb',
    cell: '2125550001',
    cell_changed: '6085550001'
  },
  texter0: {
    name: 'texter0',
    email: 'spoketexter0@moveon.org',
    password: 'SpokeTexter0!',
    given_name: 'Texterzerofirst',
    family_name: 'Texterzerolast',
    cell: '4146660000'
  },
  texter1: {
    name: 'texter1',
    email: 'spoketexter1@moveon.org',
    email_changed: 'spoketexter1b@moveon.org',
    password: 'SpokeTexter1!',
    given_name: 'Texteronefirst',
    given_name_changed: 'Texteronefirstb',
    family_name: 'Texteronelast',
    family_name_changed: 'Texteronelastb',
    cell: '4146660001',
    cell_changed: '6086660001'
  },
  texter2: {
    name: 'texter2',
    email: 'spoketexter2@moveon.org',
    password: 'SpokeTexter2!',
    given_name: 'Textertwofirst',
    family_name: 'Textertwolast',
    cell: '4146660002'
  },
  texter3: {
    name: 'texter3',
    email: 'spoketexter3@moveon.org',
    password: 'SpokeTexter3!',
    given_name: 'Texterthreefirst',
    family_name: 'Texterthreelast',
    cell: '4146660003'
  }
}

const campaigns = {
  noExistingTexter: {
    name: 'noExistingTexter',
    optOut: false,
    admin: users.admin0,
    texter: users.texter0,
    existingTexter: false,
    basics: {
      title: 'Test NET Campaign Title',
      description: 'Test NET Campaign Description'
    },
    contacts,
    texters,
    interaction,
    cannedResponses,
    standardReply
  },
  existingTexter: {
    name: 'existingTexter',
    optOut: false,
    admin: users.admin0,
    texter: users.texter1,
    existingTexter: true,
    basics: {
      title: 'Test ET Campaign Title',
      description: 'Test ET Campaign Description'
    },
    contacts,
    texters,
    interaction,
    cannedResponses,
    standardReply
  },
  noExistingTexterOptOut: {
    name: 'noExistingTexterOptOut',
    optOut: true,
    admin: users.admin0,
    texter: users.texter2,
    existingTexter: false,
    basics: {
      title: 'Test NETOO Campaign Title',
      description: 'Test NETOO Campaign Description'
    },
    contacts,
    texters: _.assign({}, texters, { contactLength: texters.contactLengthAfterOptOut }),
    interaction,
    cannedResponses,
    standardReply
  },
  existingTexterOptOut: {
    name: 'existingTexterOptOut',
    optOut: true,
    admin: users.admin0,
    texter: users.texter3,
    existingTexter: true,
    basics: {
      title: 'Test ETOO Campaign Title',
      description: 'Test ETOO Campaign Description'
    },
    contacts,
    texters: _.assign({}, texters, { contactLength: texters.contactLengthAfterOptOut }),
    interaction,
    cannedResponses,
    standardReply
  },
  copyCampaign: {
    name: 'copyCampaign',
    admin: users.admin0,
    texter: users.texter0,
    existingTexter: true,
    dynamicAssignment: false,
    basics: {
      title: 'Test C Campaign Title',
      title_copied: 'COPY - Test C Campaign Title',
      description: 'Test C Campaign Description'
    },
    contacts,
    texters,
    interaction,
    cannedResponses
  },
  editCampaign: {
    name: 'editCampaign',
    admin: users.admin1,
    existingTexter: false,
    dynamicAssignment: true,
    basics: {
      title: 'Test E Campaign Title',
      title_changed: 'Test E Campaign Title Changed',
      description: 'Test E Campaign Description'
    },
    contacts,
    texters,
    interaction,
    cannedResponses
  },
  timezone: {
    name: 'timezoneCampaign',
    optOut: false,
    admin: users.admin0,
    texter: users.texter1,
    existingTexter: true,
    basics: {
      title: 'Title',
      description: 'Desc'
    },
    contacts,
    texters,
    interaction: interactionShort,
    cannedResponses: cannedResponsesShort
  },
  userManagement: {
    name: 'userManagement',
    admin: users.admin1,
    texter: users.texter1
  }
}

export default {
  campaigns,
  org,
  users
}
