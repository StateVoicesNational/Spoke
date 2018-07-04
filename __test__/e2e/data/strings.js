module.exports = {
  admins: {
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
  },
  org: 'SpokeTestOrg',
  campaign: {
    basics: {
      title: 'Test Campaign Title',
      description: 'Test Campaign Description',
      dueBy: '6/30/2018', // TODO: Not used, but should be dynamically assigned
      introHtml: '', // TODO
      logoImageUrl: '', // TODO
      primaryColor: '' // TODO
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
