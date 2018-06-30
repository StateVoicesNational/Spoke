// import moment from 'moment'

module.exports = {
  admin: {
    email: 'spokeadmin0222@moveon.org',
    password: 'SpokeAdmin0!',
    given_name: 'TestAdminFirst',
    family_name: 'TestAdminLast',
    cell: '555-555-5555'
  },
  org: 'SpokeTestOrg',
  campaign: {
    basics: {
      title: 'Test Campaign Title',
      description: 'Test Campaign Description',
      dueBy: '6/30/2018', // Use moment or something to generate date in m/d/yyyy format
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
