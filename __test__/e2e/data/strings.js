import path from 'path'

const org = 'SpokeTestOrg'

const users = {
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
    password: 'SpokeAdmin1!',
    given_name: 'Adminonefirst',
    family_name: 'Adminonelast',
    cell: '4145550001'
  },
  texter0: {
    name: 'texter0',
    email: 'spoketexter0@moveon.org',
    password: 'SpokeTexter0!',
    given_name: 'Texterzerofirst',
    family_name: 'Texterzerolast',
    cell: '4146660000'
  }
}

const campaigns = {
  existingTexter: {
    name: 'existingTexter',
    admin: users.admin0,
    texter: users.texter0,
    existingTexter: true,
    dynamicAssignment: false,
    basics: {
      title: 'Test Campaign Title',
      description: 'Test Campaign Description'
    },
    contacts: {
      csv: path.resolve(__dirname, './people.csv')
    },
    texters: {
      contactLength: 2
    },
    interaction: {
      script: 'Test First {firstName} Last {lastName}!',
      question: 'Test Question?'
    },
    cannedResponses: [
      {
        title: 'Test CR0',
        script: 'Test CR First {firstName} Last {lastName}.'
      }
    ]
  }
}

export default {
  campaigns,
  org,
  users
}
