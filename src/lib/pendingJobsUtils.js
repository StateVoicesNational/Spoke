import gql from 'graphql-tag'

export const pendingJobsGql = (campaignId) => ({
  query: gql `query getCampaignJobs($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        pendingJobs {
          id
          jobType
          assigned
          status
          resultMessage
        }
      }
    }`,
  variables: {
    campaignId
  },
  pollInterval: 60000
})

