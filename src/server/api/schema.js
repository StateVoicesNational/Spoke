import GraphQLDate from "graphql-date";
import GraphQLJSON from "graphql-type-json";
import { GraphQLError } from "graphql/error";
import isUrl from "is-url";

import { gzip, makeTree } from "../../lib";
import { capitalizeWord } from "./lib/utils";
import {
  assignTexters,
  dispatchContactIngestLoad,
  exportCampaign,
  importScript,
  loadCampaignCache
} from "../../workers/jobs";
import { getIngestMethod } from "../../integrations/contact-loaders";
import {
  Assignment,
  Campaign,
  CannedResponse,
  InteractionStep,
  Invite,
  JobRequest,
  Message,
  Organization,
  QuestionResponse,
  UserOrganization,
  r,
  cacheableData,
  loaders
} from "../models";
import { Notifications, sendUserNotification } from "../notifications";
import { resolvers as assignmentResolvers } from "./assignment";
import { getCampaigns, resolvers as campaignResolvers } from "./campaign";
import { resolvers as campaignContactResolvers } from "./campaign-contact";
import { resolvers as cannedResponseResolvers } from "./canned-response";
import {
  getConversations,
  getCampaignIdMessageIdsAndCampaignIdContactIdsMaps,
  reassignConversations,
  resolvers as conversationsResolver
} from "./conversations";
import {
  accessRequired,
  assignmentRequiredOrAdminRole,
  assignmentRequired,
  authRequired
} from "./errors";
import { resolvers as interactionStepResolvers } from "./interaction-step";
import { resolvers as inviteResolvers } from "./invite";
import { saveNewIncomingMessage } from "./lib/message-sending";
import { getConfig } from "./lib/config";
import { resolvers as messageResolvers } from "./message";
import { resolvers as optOutResolvers } from "./opt-out";
import { resolvers as organizationResolvers } from "./organization";
import { GraphQLPhone } from "./phone";
import { resolvers as questionResolvers } from "./question";
import { resolvers as questionResponseResolvers } from "./question-response";
import { getUsers, resolvers as userResolvers } from "./user";
import { change } from "../local-auth-helpers";

import {
  sendMessage,
  bulkSendMessages,
  findNewCampaignContact
} from "./mutations";

const uuidv4 = require("uuid").v4;
const JOBS_SAME_PROCESS = !!(
  process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
);
const JOBS_SYNC = !!(process.env.JOBS_SYNC || global.JOBS_SYNC);

async function editCampaign(id, campaign, loaders, user, origCampaignRecord) {
  const {
    title,
    description,
    dueBy,
    useDynamicAssignment,
    logoImageUrl,
    introHtml,
    primaryColor,
    overrideOrganizationTextingHours,
    textingHoursEnforced,
    textingHoursStart,
    textingHoursEnd,
    timezone
  } = campaign;
  // some changes require ADMIN and we recheck below
  const organizationId =
    campaign.organizationId || origCampaignRecord.organization_id;
  await accessRequired(
    user,
    organizationId,
    "SUPERVOLUNTEER",
    /* superadmin*/ true
  );
  const organization = await loaders.organization.load(organizationId);
  const campaignUpdates = {
    title,
    description,
    due_by: dueBy,
    use_dynamic_assignment: useDynamicAssignment,
    logo_image_url: logoImageUrl,
    primary_color: primaryColor,
    intro_html: introHtml,
    override_organization_texting_hours: overrideOrganizationTextingHours,
    texting_hours_enforced: textingHoursEnforced,
    texting_hours_start: textingHoursStart,
    texting_hours_end: textingHoursEnd,
    timezone
  };

  Object.keys(campaignUpdates).forEach(key => {
    if (typeof campaignUpdates[key] === "undefined") {
      delete campaignUpdates[key];
    }
  });
  if (campaignUpdates.logo_image_url && !isUrl(logoImageUrl)) {
    campaignUpdates.logo_image_url = "";
  }
  let changed = Boolean(Object.keys(campaignUpdates).length);
  if (changed) {
    await r
      .knex("campaign")
      .where("id", id)
      .update(campaignUpdates);
  }

  if (campaign.ingestMethod && campaign.contactData) {
    await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);
    changed = true;
    const ingestMethod = await getIngestMethod(
      campaign.ingestMethod,
      organization,
      user
    );
    if (ingestMethod) {
      let job = await JobRequest.save({
        queue_name: `${id}:edit_campaign`,
        job_type: `ingest.${campaign.ingestMethod}`,
        locks_queue: true,
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: id,
        payload: campaign.contactData
      });
      await r
        .knex("campaign_admin")
        .where("campaign_id", id)
        .update({
          contacts_count: null,
          ingest_method: campaign.ingestMethod,
          ingest_success: null
        });

      if (JOBS_SAME_PROCESS) {
        dispatchContactIngestLoad(job, organization, {
          /*FUTURE: context obj*/
        });
      }
    } else {
      console.error("ingestMethod unavailable", campaign.ingestMethod);
    }
  }

  if (campaign.hasOwnProperty("texters")) {
    changed = true;
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      job_type: "assign_texters",
      campaign_id: id,
      payload: JSON.stringify({
        id,
        texters: campaign.texters
      })
    });

    if (JOBS_SAME_PROCESS) {
      if (JOBS_SYNC) {
        await assignTexters(job);
      } else {
        assignTexters(job);
      }
    }
  }

  if (campaign.hasOwnProperty("interactionSteps")) {
    changed = true;
    await accessRequired(
      user,
      organizationId,
      "SUPERVOLUNTEER",
      /* superadmin*/ true
    );
    await updateInteractionSteps(
      id,
      [campaign.interactionSteps],
      origCampaignRecord
    );
    await cacheableData.campaign.clear(id);
  }

  if (campaign.hasOwnProperty("cannedResponses")) {
    changed = true;
    const cannedResponses = campaign.cannedResponses;
    const convertedResponses = [];
    for (let index = 0; index < cannedResponses.length; index++) {
      const response = cannedResponses[index];
      convertedResponses.push({
        ...response,
        campaign_id: id,
        id: undefined
      });
    }

    await r
      .table("canned_response")
      .getAll(id, { index: "campaign_id" })
      .filter({ user_id: "" })
      .delete();
    await CannedResponse.save(convertedResponses);
    await cacheableData.cannedResponse.clearQuery({
      userId: "",
      campaignId: id
    });
  }

  const campaignRefreshed = await cacheableData.campaign.load(id, {
    forceLoad: changed
  });

  // hacky easter egg to force reload campaign contacts
  if (
    campaignUpdates.description &&
    campaignUpdates.description.endsWith("..")
  ) {
    // some asynchronous cache-priming
    console.log(
      "force-loading loadCampaignCache",
      campaignRefreshed,
      organization
    );
    await loadCampaignCache(campaignRefreshed, organization, {});
  }

  return Campaign.get(id);
}

async function updateInteractionSteps(
  campaignId,
  interactionSteps,
  origCampaignRecord,
  idMap = {}
) {
  for (let i = 0; i < interactionSteps.length; i++) {
    const is = interactionSteps[i];
    // map the interaction step ids for new ones
    if (idMap[is.parentInteractionId]) {
      is.parentInteractionId = idMap[is.parentInteractionId];
    }
    if (typeof is.id === "undefined") continue;
    if (is.id.indexOf("new") !== -1) {
      const newIstep = await InteractionStep.save({
        parent_interaction_id: is.parentInteractionId || null,
        question: is.questionText,
        script: is.script,
        answer_option: is.answerOption,
        answer_actions: is.answerActions,
        campaign_id: campaignId,
        is_deleted: false
      });
      idMap[is.id] = newIstep.id;
    } else {
      if (
        origCampaignRecord &&
        !origCampaignRecord.is_started &&
        is.isDeleted
      ) {
        await r
          .knex("interaction_step")
          .where({ id: is.id })
          .delete();
      } else {
        await r
          .knex("interaction_step")
          .where({ id: is.id })
          .update({
            question: is.questionText,
            script: is.script,
            answer_option: is.answerOption,
            answer_actions: is.answerActions,
            is_deleted: is.isDeleted
          });
      }
    }
    if (Array.isArray(is.interactionSteps) && is.interactionSteps.length) {
      await updateInteractionSteps(
        campaignId,
        is.interactionSteps,
        origCampaignRecord,
        idMap
      );
    }
  }
}

const rootMutations = {
  RootMutation: {
    userAgreeTerms: async (_, { userId }, { user, loaders }) => {
      if (user.id === Number(userId)) {
        return user.terms ? user : null;
      }
      const currentUser = await r
        .table("user")
        .get(userId)
        .update({
          terms: true
        });
      await cacheableData.user.clearUser(user.id, user.auth0_id);
      return currentUser;
    },

    sendReply: async (_, { id, message }, { user, loaders }) => {
      const contact = await loaders.campaignContact.load(id);
      const campaign = await loaders.campaign.load(contact.campaign_id);

      await accessRequired(user, campaign.organization_id, "ADMIN");

      const [lastMessage] = await r
        .knex("message")
        .where("campaign_contact_id", id)
        .limit(1);

      if (!lastMessage) {
        const errorStatusAndMessage = {
          status: 400,
          message:
            "Cannot fake a reply to a contact that has no existing thread yet"
        };
        throw new GraphQLError(errorStatusAndMessage);
      }

      const userNumber = lastMessage.user_number;
      const contactNumber = contact.cell;
      const mockId = `mocked_${Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "")}`;
      await saveNewIncomingMessage(
        new Message({
          contact_number: contactNumber,
          user_number: userNumber,
          is_from_contact: true,
          text: message,
          error_code: null,
          service_id: mockId,
          campaign_contact_id: contact.id,
          messageservice_sid: lastMessage.messageservice_sid,
          service: lastMessage.service,
          send_status: "DELIVERED"
        }),
        contact
      );
      return loaders.campaignContact.load(id);
    },
    exportCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      const organizationId = campaign.organization_id;
      await accessRequired(user, organizationId, "ADMIN");
      const newJob = await JobRequest.save({
        queue_name: `${id}:export`,
        job_type: "export",
        locks_queue: false,
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: id,
        payload: JSON.stringify({
          id,
          requester: user.id
        })
      });
      if (JOBS_SAME_PROCESS) {
        exportCampaign(newJob);
      }
      return newJob;
    },
    editOrganizationRoles: async (
      _,
      { userId, organizationId, roles },
      { user, loaders }
    ) => {
      const currentRoles = (await r
        .knex("user_organization")
        .where({
          organization_id: organizationId,
          user_id: userId
        })
        .select("role")).map(res => res.role);
      const oldRoleIsOwner = currentRoles.indexOf("OWNER") !== -1;
      const newRoleIsOwner = roles.indexOf("OWNER") !== -1;
      const roleRequired = oldRoleIsOwner || newRoleIsOwner ? "OWNER" : "ADMIN";
      let newOrgRoles = [];

      await accessRequired(user, organizationId, roleRequired);

      currentRoles.forEach(async curRole => {
        if (roles.indexOf(curRole) === -1) {
          await r
            .table("user_organization")
            .getAll([organizationId, userId], { index: "organization_user" })
            .filter({ role: curRole })
            .delete();
        }
      });

      newOrgRoles = roles
        .filter(newRole => currentRoles.indexOf(newRole) === -1)
        .map(newRole => ({
          organization_id: organizationId,
          user_id: userId,
          role: newRole
        }));

      if (newOrgRoles.length) {
        await UserOrganization.save(newOrgRoles, { conflict: "update" });
      }
      await cacheableData.user.clearUser(userId);
      return loaders.organization.load(organizationId);
    },
    editUser: async (_, { organizationId, userId, userData }, { user }) => {
      if (user.id !== userId) {
        // User can edit themselves
        await accessRequired(user, organizationId, "ADMIN", true);
      }
      const userRes = await r
        .knex("user")
        .join("user_organization", "user.id", "user_organization.user_id")
        .where({
          "user_organization.organization_id": organizationId,
          "user.id": userId
        })
        .limit(1);
      if (!userRes || !userRes.length) {
        return null;
      } else {
        const member = userRes[0];

        if (userData) {
          const newUserData = {
            first_name: capitalizeWord(userData.firstName).trim(),
            last_name: capitalizeWord(userData.lastName).trim(),
            alias: userData.alias
              ? capitalizeWord(userData.alias).trim()
              : null,
            email: userData.email,
            cell: userData.cell
          };

          const userRes = await r
            .knex("user")
            .where("id", userId)
            .update(newUserData);
          await cacheableData.user.clearUser(member.id, member.auth0_id);
          userData = {
            id: userId,
            ...newUserData
          };
        } else {
          userData = member;
        }
        return userData;
      }
    },
    resetUserPassword: async (_, { organizationId, userId }, { user }) => {
      if (user.id === userId) {
        throw new Error("You can't reset your own password.");
      }
      await accessRequired(user, organizationId, "ADMIN", true);

      // Add date at the end in case user record is modified after password is reset
      const passwordResetHash = uuidv4();
      const auth0_id = `reset|${passwordResetHash}|${Date.now()}`;

      const userRes = await r
        .knex("user")
        .where("id", userId)
        .update({
          auth0_id
        });
      return passwordResetHash;
    },
    changeUserPassword: async (_, { userId, formData }, { user }) => {
      if (user.id !== userId) {
        throw new Error("You can only change your own password.");
      }

      const { password, newPassword, passwordConfirm } = formData;

      const updatedUser = await change({
        user,
        password,
        newPassword,
        passwordConfirm
      });

      return updatedUser;
    },
    joinOrganization: async (
      _,
      { organizationUuid, queryParams },
      { user, loaders }
    ) => {
      let organization;
      [organization] = await r
        .knex("organization")
        .where("uuid", organizationUuid);
      if (organization) {
        const userOrg = await r
          .table("user_organization")
          .getAll(user.id, { index: "user_id" })
          .filter({ organization_id: organization.id })
          .limit(1)(0)
          .default(null);
        if (!userOrg) {
          await UserOrganization.save({
            user_id: user.id,
            organization_id: organization.id,
            role: "TEXTER"
          }).error(function(error) {
            // Unexpected errors
            console.log("error on userOrganization save", error);
          });
          await cacheableData.user.clearUser(user.id);
        } else {
          // userOrg exists
          console.log(
            "existing userOrg " +
              userOrg.id +
              " user " +
              user.id +
              " organizationUuid " +
              organizationUuid
          );
        }
      } else {
        // no organization
        console.log(
          "no organization with id " + organizationUuid + " for user " + user.id
        );
      }
      return organization;
    },
    assignUserToCampaign: async (
      _,
      { organizationUuid, campaignId, queryParams },
      { user, loaders }
    ) => {
      const campaign = await r
        .knex("campaign")
        .leftJoin("organization", "campaign.organization_id", "organization.id")
        .where({
          "campaign.id": campaignId,
          "campaign.use_dynamic_assignment": true,
          "organization.uuid": organizationUuid
        })
        .select("campaign.*")
        .first();
      if (!campaign) {
        throw new GraphQLError({
          status: 403,
          message: "Invalid join request"
        });
      }
      const assignment = await r
        .table("assignment")
        .getAll(user.id, { index: "user_id" })
        .filter({ campaign_id: campaign.id })
        .limit(1)(0)
        .default(null);
      if (!assignment) {
        await Assignment.save({
          user_id: user.id,
          campaign_id: campaign.id,
          max_contacts: process.env.MAX_CONTACTS_PER_TEXTER
            ? parseInt(process.env.MAX_CONTACTS_PER_TEXTER, 10)
            : null
        });
      }
      return campaign;
    },
    updateTextingHours: async (
      _,
      { organizationId, textingHoursStart, textingHoursEnd },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      await Organization.get(organizationId).update({
        texting_hours_start: textingHoursStart,
        texting_hours_end: textingHoursEnd
      });
      cacheableData.organization.clear(organizationId);

      return await Organization.get(organizationId);
    },
    updateTextingHoursEnforcement: async (
      _,
      { organizationId, textingHoursEnforced },
      { user, loaders }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      await Organization.get(organizationId).update({
        texting_hours_enforced: textingHoursEnforced
      });
      await cacheableData.organization.clear(organizationId);

      return await loaders.organization.load(organizationId);
    },
    updateOptOutMessage: async (
      _,
      { organizationId, optOutMessage },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      const organization = await Organization.get(organizationId);
      const featuresJSON = JSON.parse(organization.features || "{}");
      featuresJSON.opt_out_message = optOutMessage;
      organization.features = JSON.stringify(featuresJSON);

      await organization.save();
      await cacheableData.organization.clear(organizationId);

      return await Organization.get(organizationId);
    },
    createInvite: async (_, { user }) => {
      if (
        (user && user.is_superadmin) ||
        !getConfig("SUPPRESS_SELF_INVITE", null, { truthy: true })
      ) {
        const inviteInstance = new Invite({
          is_valid: true,
          hash: uuidv4()
        });
        const newInvite = await inviteInstance.save();
        return newInvite;
      }
    },
    createCampaign: async (_, { campaign }, { user, loaders }) => {
      await accessRequired(
        user,
        campaign.organizationId,
        "ADMIN",
        /* allowSuperadmin=*/ true
      );
      const campaignInstance = new Campaign({
        organization_id: campaign.organizationId,
        creator_id: user.id,
        title: campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false
      });
      const newCampaign = await campaignInstance.save();
      await r.knex("campaign_admin").insert({
        campaign_id: newCampaign.id
      });
      return editCampaign(newCampaign.id, campaign, loaders, user);
    },
    copyCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");

      const campaignInstance = new Campaign({
        organization_id: campaign.organization_id,
        creator_id: user.id,
        title: "COPY - " + campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false
      });
      const newCampaign = await campaignInstance.save();
      await r.knex("campaign_admin").insert({
        campaign_id: newCampaign.id
      });
      const newCampaignId = newCampaign.id;
      const oldCampaignId = campaign.id;

      let interactions = await r
        .knex("interaction_step")
        .where({ campaign_id: oldCampaignId, is_deleted: false });

      const interactionsArr = [];
      interactions.forEach((interaction, index) => {
        if (interaction.parent_interaction_id) {
          let is = {
            id: "new" + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: "new" + interaction.parent_interaction_id
          };
          interactionsArr.push(is);
        } else if (!interaction.parent_interaction_id) {
          let is = {
            id: "new" + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: interaction.parent_interaction_id
          };
          interactionsArr.push(is);
        }
      });

      await updateInteractionSteps(
        newCampaignId,
        [makeTree(interactionsArr, (id = null))],
        campaign,
        {}
      );

      const originalCannedResponses = await r
        .knex("canned_response")
        .where({ campaign_id: oldCampaignId });
      const copiedCannedResponsePromises = originalCannedResponses.map(
        response => {
          return new CannedResponse({
            campaign_id: newCampaignId,
            title: response.title,
            text: response.text
          }).save();
        }
      );
      await Promise.all(copiedCannedResponsePromises);

      return newCampaign;
    },
    unarchiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      campaign.is_archived = false;
      await campaign.save();
      await cacheableData.campaign.clear(id);
      return campaign;
    },
    archiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      campaign.is_archived = true;
      await campaign.save();
      await cacheableData.campaign.clear(id);
      return campaign;
    },
    archiveCampaigns: async (_, { ids }, { user, loaders }) => {
      // Take advantage of the cache instead of running a DB query
      const campaigns = await Promise.all(
        ids.map(id => loaders.campaign.load(id))
      );

      await Promise.all(
        campaigns.map(campaign =>
          accessRequired(user, campaign.organization_id, "ADMIN")
        )
      );

      campaigns.forEach(campaign => {
        campaign.is_archived = true;
      });
      await Promise.all(
        campaigns.map(async campaign => {
          await campaign.save();
          await cacheableData.campaign.clear(campaign.id);
        })
      );
      return campaigns;
    },
    startCampaign: async (
      _,
      { id },
      { user, loaders, remainingMilliseconds }
    ) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      const organization = await loaders.organization.load(
        campaign.organization_id
      );

      campaign.is_started = true;

      await campaign.save();
      const campaignRefreshed = await cacheableData.campaign.load(id, {
        forceLoad: true
      });
      await sendUserNotification({
        type: Notifications.CAMPAIGN_STARTED,
        campaignId: id
      });

      // some asynchronous cache-priming:
      await loadCampaignCache(campaignRefreshed, organization, {
        remainingMilliseconds
      });
      return campaignRefreshed;
    },
    editCampaign: async (_, { id, campaign }, { user, loaders }) => {
      const origCampaign = await Campaign.get(id);
      if (campaign.organizationId) {
        await accessRequired(user, campaign.organizationId, "ADMIN");
      } else {
        await accessRequired(
          user,
          origCampaign.organization_id,
          "SUPERVOLUNTEER"
        );
      }
      if (
        origCampaign.is_started &&
        campaign.hasOwnProperty("contacts") &&
        campaign.contacts
      ) {
        throw new GraphQLError({
          status: 400,
          message: "Not allowed to add contacts after the campaign starts"
        });
      }
      return editCampaign(id, campaign, loaders, user, origCampaign);
    },
    deleteJob: async (_, { campaignId, id }, { user, loaders }) => {
      const campaign = await Campaign.get(campaignId);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      const res = await r
        .knex("job_request")
        .where({
          id,
          campaign_id: campaignId
        })
        .delete();
      return { id };
    },
    createCannedResponse: async (_, { cannedResponse }, { user, loaders }) => {
      authRequired(user);

      const cannedResponseInstance = new CannedResponse({
        campaign_id: cannedResponse.campaignId,
        user_id: cannedResponse.userId,
        title: cannedResponse.title,
        text: cannedResponse.text
      }).save();
      // deletes duplicate created canned_responses
      let query = r
        .knex("canned_response")
        .where(
          "text",
          "in",
          r
            .knex("canned_response")
            .where({
              text: cannedResponse.text,
              campaign_id: cannedResponse.campaignId
            })
            .select("text")
        )
        .andWhere({ user_id: cannedResponse.userId })
        .del();
      await query;
      cacheableData.cannedResponse.clearQuery({
        campaignId: cannedResponse.campaignId,
        userId: cannedResponse.userId
      });
      return cannedResponseInstance;
    },
    createOrganization: async (
      _,
      { name, userId, inviteId },
      { loaders, user }
    ) => {
      authRequired(user);
      const invite = await loaders.invite.load(inviteId);
      if (!invite || !invite.is_valid) {
        throw new GraphQLError({
          status: 400,
          message: "That invitation is no longer valid"
        });
      }

      const newOrganization = await Organization.save({
        name,
        uuid: uuidv4()
      });
      await UserOrganization.save({
        role: "OWNER",
        user_id: userId,
        organization_id: newOrganization.id
      });
      await Invite.save(
        {
          id: inviteId,
          is_valid: false
        },
        { conflict: "update" }
      );

      return newOrganization;
    },
    editCampaignContactMessageStatus: async (
      _,
      { messageStatus, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      await assignmentRequired(user, contact.assignment_id, null, contact);
      contact.message_status = messageStatus;
      await cacheableData.campaignContact.updateStatus(contact, messageStatus);
      return contact;
    },
    getAssignmentContacts: async (
      _,
      { assignmentId, contactIds, findNew },
      { loaders, user }
    ) => {
      if (contactIds.length === 0) {
        return [];
      }
      const firstContact = await cacheableData.campaignContact.load(
        contactIds[0]
      );
      const campaign = await loaders.campaign.load(firstContact.campaign_id);
      await assignmentRequiredOrAdminRole(
        user,
        campaign.organization_id,
        assignmentId,
        firstContact
      );
      let triedUpdate = false;
      const contacts = contactIds.map(async (contactId, cIdx) => {
        // note we are loading from cacheableData and NOT loaders to avoid loader staleness
        // this is relevant for the possible multiple web dynos
        let contact =
          cIdx === 0
            ? firstContact
            : await cacheableData.campaignContact.load(contactId);

        // If contact.assignment_id is null or misassigned,
        // maybe the cache is stale so try refreshing.
        if (
          contact.cachedResult &&
          Number(contact.assignment_id) !== Number(assignmentId) &&
          !triedUpdate
        ) {
          // In case assignment_id from cache needs to be refreshed, try again
          // user_id will only be a property if it's from a cached response
          triedUpdate = true;
          await cacheableData.campaignContact.updateCampaignAssignmentCache(
            contact.campaign_id,
            contactIds
          );
          contact = await cacheableData.campaignContact.load(contactId);
        }

        if (contact && Number(contact.assignment_id) === Number(assignmentId)) {
          return contact;
        }

        return null;
      });
      if (findNew) {
        // maybe FUTURE: we could automatically add dynamic assignments in the same api call
        // findNewCampaignContact()
      }
      return contacts;
    },
    findNewCampaignContact: async (
      _,
      { assignmentId, numberContacts },
      { user }
    ) => {
      return await findNewCampaignContact(assignmentId, numberContacts, user);
    },

    createOptOut: async (
      _,
      { optOut, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      const campaign = await loaders.campaign.load(contact.campaign_id);

      console.log(
        "createOptOut",
        campaignContactId,
        contact.campaign_id,
        contact.assignment_id
      );
      await assignmentRequiredOrAdminRole(
        user,
        campaign.organization_id,
        contact.assignment_id,
        contact
      );
      console.log(
        "createOptOut post access",
        campaignContactId,
        contact.campaign_id
      );
      const { assignmentId, cell, reason } = optOut;
      await cacheableData.optOut.save({
        cell,
        campaignContactId,
        reason,
        assignmentId,
        campaign
      });
      console.log(
        "createOptOut post save",
        campaignContactId,
        contact.campaign_id
      );
      loaders.campaignContact.clear(campaignContactId.toString());

      return loaders.campaignContact.load(campaignContactId);
    },
    bulkSendMessages: async (_, { assignmentId }, { loaders, user }) => {
      return await bulkSendMessages(assignmentId, loaders, user);
    },
    sendMessage: async (
      _,
      { message, campaignContactId },
      { loaders, user }
    ) => {
      return await sendMessage(message, campaignContactId, loaders, user);
    },
    deleteQuestionResponses: async (
      _,
      { interactionStepIds, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      await assignmentRequired(user, contact.assignment_id, null, contact);
      // TODO: maybe undo action_handler
      await r
        .knex("question_response")
        .where("campaign_contact_id", campaignContactId)
        .whereIn("interaction_step_id", interactionStepIds)
        .delete();

      // update cache
      await cacheableData.questionResponse.reloadQuery(campaignContactId);

      return contact;
    },
    updateQuestionResponses: async (
      _,
      { questionResponses, campaignContactId },
      { loaders }
    ) => {
      const count = questionResponses.length;

      for (let i = 0; i < count; i++) {
        const questionResponse = questionResponses[i];
        const { interactionStepId, value } = questionResponse;
        await r
          .table("question_response")
          .getAll(campaignContactId, { index: "campaign_contact_id" })
          .filter({ interaction_step_id: interactionStepId })
          .delete();

        // TODO: maybe undo action_handler if updated answer

        const qr = await new QuestionResponse({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStepId,
          value
        }).save();
        const interactionStepResult = await r
          .knex("interaction_step")
          // TODO: is this really parent_interaction_id or just interaction_id?
          .where({
            parent_interaction_id: interactionStepId,
            answer_option: value
          })
          .whereNot("answer_actions", "")
          .whereNotNull("answer_actions");

        const interactionStepAction =
          interactionStepResult.length &&
          interactionStepResult[0].answer_actions;
        if (interactionStepAction) {
          // run interaction step handler
          try {
            const handler = require(`../../integrations/action-handlers/${interactionStepAction}.js`);
            handler.processAction(
              qr,
              interactionStepResult[0],
              campaignContactId
            );
          } catch (err) {
            console.error(
              "Handler for InteractionStep",
              interactionStepId,
              "Does Not Exist:",
              interactionStepAction
            );
          }
        }
      }
      // update cache
      await cacheableData.questionResponse.clearQuery(campaignContactId);

      const contact = loaders.campaignContact.load(campaignContactId);
      return contact;
    },
    reassignCampaignContacts: async (
      _,
      { organizationId, campaignIdsContactIds, newTexterUserId },
      { user }
    ) => {
      // verify permissions
      await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);

      // group contactIds by campaign
      // group messages by campaign
      const campaignIdContactIdsMap = new Map();
      const campaignIdMessagesIdsMap = new Map();
      for (const campaignIdContactId of campaignIdsContactIds) {
        const {
          campaignId,
          campaignContactId,
          messageIds
        } = campaignIdContactId;

        if (!campaignIdContactIdsMap.has(campaignId)) {
          campaignIdContactIdsMap.set(campaignId, []);
        }

        campaignIdContactIdsMap.get(campaignId).push(campaignContactId);

        if (!campaignIdMessagesIdsMap.has(campaignId)) {
          campaignIdMessagesIdsMap.set(campaignId, []);
        }

        campaignIdMessagesIdsMap.get(campaignId).push(...messageIds);
      }

      return await reassignConversations(
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap,
        newTexterUserId
      );
    },
    bulkReassignCampaignContacts: async (
      _,
      {
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        newTexterUserId
      },
      { user }
    ) => {
      // verify permissions
      await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);
      const {
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap
      } = await getCampaignIdMessageIdsAndCampaignIdContactIdsMaps(
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter
      );

      return await reassignConversations(
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap,
        newTexterUserId
      );
    },
    importCampaignScript: async (_, { campaignId, url }, { loaders }) => {
      const campaign = await loaders.campaign.load(campaignId);
      if (campaign.is_started || campaign.is_archived) {
        throw new GraphQLError(
          "Cannot import a campaign script for a campaign that is started or archived"
        );
      }

      const compressedString = await gzip(
        JSON.stringify({
          campaignId,
          url
        })
      );
      const job = await JobRequest.save({
        queue_name: `${campaignId}:import_script`,
        job_type: "import_script",
        locks_queue: true,
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: campaignId,
        // NOTE: stringifying because compressedString is a binary buffer
        payload: compressedString.toString("base64")
      });

      const jobId = job.id;

      if (JOBS_SAME_PROCESS) {
        importScript(job);
      }

      return jobId;
    }
  }
};

const rootResolvers = {
  Action: {
    name: o => o.name,
    display_name: o => o.display_name,
    instructions: o => o.instructions
  },
  FoundContact: {
    found: o => o.found
  },
  RootQuery: {
    campaign: async (_, { id }, { loaders, user }) => {
      const campaign = await Campaign.get(id);
      await accessRequired(user, campaign.organization_id, "SUPERVOLUNTEER");
      return campaign;
    },
    assignment: async (_, { id }, { loaders, user }) => {
      authRequired(user);
      const assignment = await loaders.assignment.load(id);
      const campaign = await loaders.campaign.load(assignment.campaign_id);
      if (assignment.user_id == user.id) {
        await accessRequired(
          user,
          campaign.organization_id,
          "TEXTER",
          /* allowSuperadmin=*/ true
        );
      } else {
        await accessRequired(
          user,
          campaign.organization_id,
          "SUPERVOLUNTEER",
          /* allowSuperadmin=*/ true
        );
      }
      return assignment;
    },
    organization: async (_, { id }, { user, loaders }) => {
      await accessRequired(user, id, "TEXTER");
      return await loaders.organization.load(id);
    },
    inviteByHash: async (_, { hash }, { loaders, user }) => {
      authRequired(user);
      return r.table("invite").filter({ hash });
    },
    currentUser: async (_, { id }, { user }) => {
      if (!user) {
        return null;
      } else {
        return user;
      }
    },
    organizations: async (_, { id }, { user }) => {
      if (user.is_superadmin) {
        return r.table("organization");
      } else {
        return await cacheableData.user.userOrgs(user.id, "TEXTER");
      }
    },
    availableActions: (_, { organizationId }, { user }) => {
      if (!process.env.ACTION_HANDLERS) {
        return [];
      }
      const allHandlers = process.env.ACTION_HANDLERS.split(",");

      const availableHandlers = allHandlers
        .map(handler => {
          return {
            name: handler,
            handler: require(`../../integrations/action-handlers/${handler}.js`)
          };
        })
        .filter(async h => h && (await h.handler.available(organizationId)));

      const availableHandlerObjects = availableHandlers.map(handler => {
        return {
          name: handler.name,
          display_name: handler.handler.displayName(),
          instructions: handler.handler.instructions()
        };
      });
      return availableHandlerObjects;
    },
    conversations: async (
      _,
      {
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        utc
      },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);

      return getConversations(
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        utc
      );
    },
    campaigns: async (
      _,
      { organizationId, cursor, campaignsFilter },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getCampaigns(organizationId, cursor, campaignsFilter);
    },
    people: async (
      _,
      { organizationId, cursor, campaignsFilter, role, sortBy },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getUsers(organizationId, cursor, campaignsFilter, role, sortBy);
    }
  }
};

export const resolvers = {
  ...rootResolvers,
  ...userResolvers,
  ...organizationResolvers,
  ...campaignResolvers,
  ...assignmentResolvers,
  ...interactionStepResolvers,
  ...optOutResolvers,
  ...messageResolvers,
  ...campaignContactResolvers,
  ...cannedResponseResolvers,
  ...questionResponseResolvers,
  ...inviteResolvers,
  ...{ Date: GraphQLDate },
  ...{ JSON: GraphQLJSON },
  ...{ Phone: GraphQLPhone },
  ...questionResolvers,
  ...conversationsResolver,
  ...rootMutations
};
