/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import ConversationPreviewModal, {
  _ConversationPreviewModal
} from "../../../src/components/IncomingMessageList/ConversationPreviewModal";
import { prepareDataTableData } from "../../../src/components/IncomingMessageList";

import ReactTestUtils from "react-dom/test-utils";
import Store from "../../../src/store";
import { createMemoryHistory } from "react-router";
import ApolloClientSingleton from "../../../src/network/apollo-client-singleton";
import { ApolloProvider } from "react-apollo";
import Dialog from "material-ui/Dialog";

import { r } from "../../../src/server/models";

import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createContacts,
  createTexter,
  assignTexter,
  startCampaign,
  getCampaignContact,
  sendMessage,
  getConversations
} from "../../test_helpers";

describe("ConversationPreviewModal", async () => {
  let testAdminUser;
  let testInvite;
  let testOrganization;
  let testCampaign;
  let testTexterUser;
  let testContacts;

  let assignmentId;
  let organizationId;
  let optOutContact;

  let optOut;
  let conversations;
  let conversation;
  let onRequestCloseMock;

  let component;
  let store;

  beforeAll(async () => {
    // Set up an entire working campaign
    await setupTest();
    jest.restoreAllMocks();
    testAdminUser = await createUser();
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    testCampaign = await createCampaign(testAdminUser, testOrganization);
    testContacts = await createContacts(testCampaign, 1);
    testTexterUser = await createTexter(testOrganization);
    await startCampaign(testAdminUser, testCampaign);

    await assignTexter(testAdminUser, testTexterUser, testCampaign);
    const dbCampaignContact = await getCampaignContact(testContacts[0].id);
    assignmentId = dbCampaignContact.assignment_id;
    organizationId = testOrganization.data.createOrganization.id;

    optOutContact = testContacts[0];

    const message = {
      assignmentId,
      contactNumber: optOutContact.cell,
      text: "hey now"
    };

    await sendMessage(optOutContact.id, testTexterUser, message);

    optOut = {
      cell: optOutContact.cell,
      assignmentId: assignmentId.toString(),
      reason: ""
    };

    const campaignsFilter = {
      campaignId: dbCampaignContact.campaign_id
    };

    conversations = await getConversations(
      testAdminUser,
      organizationId,
      { isOptedOut: false },
      campaignsFilter,
      {}
    );

    store = new Store(createMemoryHistory("/")).data;
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterAll(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("when a message review user opts out a user", async () => {
    beforeAll(async () => {
      const root = document.createElement("div");
      document.body.appendChild(root);

      conversation = prepareDataTableData(
        conversations.data.conversations.conversations
      )[0];

      onRequestCloseMock = jest.fn();

      component = mount(
        <ApolloProvider store={store} client={ApolloClientSingleton}>
          <MuiThemeProvider>
            <ConversationPreviewModal
              organizationId={organizationId}
              conversation={conversation}
              onForceRefresh={() => {}}
              onRequestClose={onRequestCloseMock}
            />
          </MuiThemeProvider>
        </ApolloProvider>,
        {
          attachTo: root
        }
      );
    });

    it("calls the createOptOut mutation", async () => {
      const createOptOutMock = jest.fn((_optOut, _campaignContactId) =>
        Promise.resolve({ campaignContactId: _campaignContactId })
      );
      const conversationPreviewModal = component.find(
        _ConversationPreviewModal
      );
      conversationPreviewModal
        .first()
        .instance().props.mutations.createOptOut = createOptOutMock;

      const dialog = conversationPreviewModal.find(Dialog);
      expect(dialog.first().instance().props.open).toBe(true);

      const optOutButton = document.querySelector(
        "[data-test=conversationPreviewModalOptOutButton]"
      );

      await ReactTestUtils.Simulate.click(optOutButton);

      expect(createOptOutMock).toBeCalledTimes(1);
      expect(createOptOutMock).toBeCalledWith(
        organizationId,
        optOut,
        optOutContact.id.toString()
      );
    });
  });
});
