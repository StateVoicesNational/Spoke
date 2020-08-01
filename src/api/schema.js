import gql from "graphql-tag";

import { schema as userSchema } from "./user";
import { schema as conversationSchema } from "./conversations";
import { schema as organizationSchema } from "./organization";
import { schema as campaignSchema } from "./campaign";
import { schema as assignmentSchema } from "./assignment";
import { schema as interactionStepSchema } from "./interaction-step";
import { schema as questionSchema } from "./question";
import { schema as questionResponseSchema } from "./question-response";
import { schema as optOutSchema } from "./opt-out";
import { schema as messageSchema } from "./message";
import { schema as campaignContactSchema } from "./campaign-contact";
import { schema as cannedResponseSchema } from "./canned-response";
import { schema as inviteSchema } from "./invite";
import { schema as tagSchema } from "./tag";

const rootSchema = gql`
  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    zip: String
    external_id: String
    customFields: String
  }

  input OptOutInput {
    assignmentId: String!
    cell: Phone!
    reason: String
  }

  input QuestionResponseInput {
    campaignContactId: String!
    interactionStepId: String!
    value: String!
  }

  input AnswerOptionInput {
    action: String
    value: String!
    nextInteractionStepId: String
  }

  input InteractionStepInput {
    id: String
    questionText: String
    script: String
    answerOption: String
    answerActions: String
    answerActionsData: String
    parentInteractionId: String
    isDeleted: Boolean
    interactionSteps: [InteractionStepInput]
  }

  input TexterInput {
    id: String
    needsMessageCount: Int
    maxContacts: Int
    contactsCount: Int
  }

  input CampaignInput {
    title: String
    description: String
    dueBy: Date
    logoImageUrl: String
    primaryColor: String
    introHtml: String
    useDynamicAssignment: Boolean
    batchSize: Int
    ingestMethod: String
    contactData: String
    organizationId: String
    texters: [TexterInput]
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    useOwnMessagingService: Boolean
    phoneNumbers: [String]
    messageserviceSid: String
    overrideOrganizationTextingHours: Boolean
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    texterUIConfig: TexterUIConfigInput
    timezone: String
  }

  input OrganizationInput {
    texterUIConfig: TexterUIConfigInput
  }

  input MessageInput {
    text: String
    contactNumber: Phone
    assignmentId: String
    userId: String
  }

  input InviteInput {
    id: String
    is_valid: Boolean
    hash: String
    created_at: Date
  }

  input UserInput {
    id: String
    firstName: String!
    lastName: String!
    alias: String
    email: String!
    cell: String!
    oldPassword: String
    newPassword: String
    extra: String
  }

  input ContactMessage {
    message: MessageInput!
    campaignContactId: String!
  }

  input OffsetLimitCursor {
    offset: Int!
    limit: Int!
  }

  input CampaignIdContactId {
    campaignId: String!
    campaignContactId: Int!
    messageIds: [Int]!
  }

  input UserPasswordChange {
    email: String!
    password: String!
    passwordConfirm: String!
    newPassword: String!
  }

  type CampaignIdAssignmentId {
    campaignId: String!
    assignmentId: String!
  }

  input TagInput {
    id: String
    name: String!
    group: String
    value: String
    description: String
    isDeleted: Boolean
    organizationId: String
  }

  type FoundContact {
    found: Boolean
  }

  type PageInfo {
    limit: Int!
    offset: Int!
    next: Int
    previous: Int
    total: Int!
  }

  type ReturnString {
    data: String!
  }

  enum SortPeopleBy {
    FIRST_NAME
    LAST_NAME
    NEWEST
    OLDEST
  }

  enum FilterPeopleBy {
    FIRST_NAME
    LAST_NAME
    EMAIL
    ANY
  }

  enum SortCampaignsBy {
    DUE_DATE_ASC
    DUE_DATE_DESC
    ID_ASC
    ID_DESC
    TITLE
    TIMEZONE
  }

  type RootQuery {
    currentUser: User
    organization(id: String!, utc: String): Organization
    campaign(id: String!): Campaign
    inviteByHash(hash: String!): [Invite]
    assignment(assignmentId: String, contactId: String): Assignment
    organizations: [Organization]
    conversations(
      cursor: OffsetLimitCursor!
      organizationId: String!
      campaignsFilter: CampaignsFilter
      assignmentsFilter: AssignmentsFilter
      contactsFilter: ContactsFilter
      messageTextFilter: String
      utc: String
    ): PaginatedConversations
    campaigns(
      organizationId: String!
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      sortBy: SortCampaignsBy
    ): CampaignsReturn
    people(
      organizationId: String!
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      role: String
      sortBy: SortPeopleBy
      filterString: String
      filterBy: FilterPeopleBy
    ): UsersReturn
    user(organizationId: ID!, userId: Int!): User
  }

  type RootMutation {
    createInvite(invite: InviteInput!): Invite
    createCampaign(campaign: CampaignInput!): Campaign
    editCampaign(id: String!, campaign: CampaignInput!): Campaign
    editOrganization(
      id: String!
      organization: OrganizationInput!
    ): Organization
    deleteJob(campaignId: String!, id: String!): JobRequest
    copyCampaign(id: String!): Campaign
    exportCampaign(id: String!): JobRequest
    createCannedResponse(cannedResponse: CannedResponseInput!): CannedResponse
    createOrganization(
      name: String!
      userId: String!
      inviteId: String!
    ): Organization
    joinOrganization(
      organizationUuid: String!
      campaignId: String
      queryParams: String
    ): Organization
    editOrganizationRoles(
      organizationId: String!
      userId: String!
      campaignId: String
      roles: [String]
    ): User
    editUser(organizationId: String!, userId: Int!, userData: UserInput): User
    resetUserPassword(organizationId: String!, userId: Int!): String!
    changeUserPassword(userId: Int!, formData: UserPasswordChange): User
    updateTextingHours(
      organizationId: String!
      textingHoursStart: Int!
      textingHoursEnd: Int!
    ): Organization
    updateTextingHoursEnforcement(
      organizationId: String!
      textingHoursEnforced: Boolean!
    ): Organization
    updateOptOutMessage(
      organizationId: String!
      optOutMessage: String!
    ): Organization
    updateTwilioAuth(
      organizationId: String!
      twilioAccountSid: String
      twilioAuthToken: String
      twilioMessageServiceSid: String
    ): Organization
    bulkSendMessages(assignmentId: Int!): [CampaignContact]
    sendMessage(
      message: MessageInput!
      campaignContactId: String!
    ): CampaignContact
    createOptOut(
      optOut: OptOutInput!
      campaignContactId: String!
    ): CampaignContact
    editCampaignContactMessageStatus(
      messageStatus: String!
      campaignContactId: String!
    ): CampaignContact
    deleteQuestionResponses(
      interactionStepIds: [String]
      campaignContactId: String!
    ): CampaignContact
    updateContactTags(tags: [TagInput], campaignContactId: String!): String
    updateQuestionResponses(
      questionResponses: [QuestionResponseInput]
      campaignContactId: String!
    ): String
    startCampaign(id: String!): Campaign
    archiveCampaign(id: String!): Campaign
    archiveCampaigns(ids: [String!]): [Campaign]
    unarchiveCampaign(id: String!): Campaign
    sendReply(id: String!, message: String!): CampaignContact
    getAssignmentContacts(
      assignmentId: String
      contactIds: [String]
      findNew: Boolean
    ): [CampaignContact]
    findNewCampaignContact(
      assignmentId: String!
      numberContacts: Int!
    ): FoundContact
    releaseContacts(
      assignmentId: String!
      releaseConversations: Boolean
    ): Assignment
    userAgreeTerms(userId: String!): User
    reassignCampaignContacts(
      organizationId: String!
      campaignIdsContactIds: [CampaignIdContactId]!
      newTexterUserId: String!
    ): [CampaignIdAssignmentId]
    bulkReassignCampaignContacts(
      organizationId: String!
      campaignsFilter: CampaignsFilter
      assignmentsFilter: AssignmentsFilter
      contactsFilter: ContactsFilter
      messageTextFilter: String
      newTexterUserId: String!
    ): [CampaignIdAssignmentId]
    importCampaignScript(campaignId: String!, url: String!): Int
    createTag(organizationId: String!, tagData: TagInput!): Tag
    editTag(organizationId: String!, id: String!, tagData: TagInput!): Tag
    deleteTag(organizationId: String!, id: String!): Tag
    buyPhoneNumbers(
      organizationId: ID!
      areaCode: String!
      limit: Int!
      addToOrganizationMessagingService: Boolean
    ): JobRequest
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`;

export const schema = [
  rootSchema,
  userSchema,
  organizationSchema,
  "scalar Date",
  "scalar JSON",
  "scalar Phone",
  campaignSchema,
  assignmentSchema,
  interactionStepSchema,
  optOutSchema,
  messageSchema,
  campaignContactSchema,
  cannedResponseSchema,
  questionResponseSchema,
  questionSchema,
  inviteSchema,
  conversationSchema,
  tagSchema
];
