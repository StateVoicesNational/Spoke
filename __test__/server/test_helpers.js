import {createLoaders} from '../../src/server/models'
import {graphql} from 'graphql'
import {resolvers, schema} from '../../src/server/api/schema'
import {CampaignContact, User, UserOrganization, Assignment} from '../../src/server/models/index'
import {makeExecutableSchema as _makeExecutableSchema} from 'graphql-tools'

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders()
  }
}

export function makeExecutableSchema() {
  return _makeExecutableSchema({
    typeDefs: schema,
    resolvers,
    allowUndefinedInResolve: true
  })
}

// data creation functions

export async function createUser(userInfo = {
  auth0_id: 'test123',
  first_name: 'TestUserFirst',
  last_name: 'TestUserLast',
  cell: '555-555-5555',
  email: 'testuser@example.com'
}) {
  const user = new User(userInfo)
  try {
    await user.save()
    console.log('created user')
    console.log(user)
    return user
  } catch (err) {
    console.error('Error saving user')
    return false
  }
}

export async function createUserOrganization(userID, organizationID, role) {
  const userOrganization = new UserOrganization({user_id: userID, organization_id: organizationID, role: role})
  try {
    await userOrganization.save()
    console.log('created user-organization')
    console.log(userOrganization)
    return userOrganization
  } catch (err) {
    console.error('Error saving user-organization')
    return false
  }
}


export async function createAssignment(userID, campaignID, maxContacts) {
  const assignment = new Assignment({user_id: userID, campaign_id: campaignID, max_contacts: maxContacts})
  try {
    await assignment.save()
    console.log('created assignment')
    console.log(Assignment)
    return assignment
  } catch (err) {
    console.error('Error saving assignment')
    return false
  }
}

export async function createContact(campaignId) {
  const contact = new CampaignContact({
    first_name: 'Ann',
    last_name: 'Lewis',
    cell: '5555555555',
    zip: '12345',
    campaign_id: campaignId
  })
  try {
    await contact.save()
    console.log('created contact')
    console.log(contact)
    return contact
  } catch (err) {
    console.error('Error saving contact: ', err)
    return false
  }
}

const rootValue = {}
const mySchema = makeExecutableSchema()

export async function createInvite() {
  const inviteQuery = `mutation {
    createInvite(invite: {is_valid: true}) {
      id
    }
  }`
  const context = getContext()
  try {
    const invite = await graphql(mySchema, inviteQuery, rootValue, context)
    return invite
  } catch (err) {
    console.error('Error creating invite ' + err)
    return false
  }
}

export async function createOrganization(user, name, userId, inviteId) {
  const context = getContext({user})

  const orgQuery = `mutation createOrganization($name: String!, $userId: String!, $inviteId: String!) {
    createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
      id
      uuid
      name
      threeClickEnabled
      textingHoursEnforced
      textingHoursStart
      textingHoursEnd
    }
  }`

  const variables = {
    userId,
    name,
    inviteId
  }

  try {
    const org = await graphql(mySchema, orgQuery, rootValue, context, variables)
    return org
  } catch (err) {
    console.error('Error creating organization')
    return false
  }
}

export async function createCampaign(user, title, description, organizationId, contacts = []) {
  const context = getContext({user})

  const campaignQuery = `mutation createCampaign($input: CampaignInput!) {
    createCampaign(campaign: $input) {
      id
      title
      contacts {
        firstName
        lastName
      }
    }
  }`
  const variables = {
    'input': {
      title,
      description,
      organizationId,
      contacts
    }
  }

  try {
    const campaign = await graphql(mySchema, campaignQuery, rootValue, context, variables)
    return campaign
  } catch (err) {
    console.error('Error creating campaign')
    return false
  }
}
