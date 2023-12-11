/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import ConversationPreviewModal, {
  InnerConversationPreviewModal
} from "../../../src/components/IncomingMessageList/ConversationPreviewModal";
import { prepareDataTableData } from "../../../src/components/IncomingMessageList";

import ReactTestUtils from "react-dom/test-utils";
import { createMemoryHistory } from "react-router";
import ApolloClientSingleton from "../../../src/network/apollo-client-singleton";
import { ApolloProvider } from '@apollo/client'
import Dialog from "@material-ui/core/Dialog";

import { r } from "../../../src/server/models";

import {
  setupTest,
  cleanupTest,
  sendMessage,
  getConversations,
  createStartedCampaign
} from "../../test_helpers";

describe.skip("ConversationPreviewModal", () => {
  let startedCampaign;
  let optOutContact;
  let optOut;
  let conversations;
  let conversation;
  let onRequestCloseMock;

  let component;

  beforeAll(async () => {
    // Set up an entire working campaign
    await setupTest();
    jest.restoreAllMocks();
    startedCampaign = await createStartedCampaign();

    // last contact, since conversations now are shown last-contact first
    optOutContact =
      startedCampaign.testContacts[startedCampaign.testContacts.length - 1];

    const message = {
      assignmentId: startedCampaign.assignmentId,
      contactNumber: optOutContact.cell,
      text: "hey now"
    };

    await sendMessage(
      optOutContact.id,
      startedCampaign.assignmentId,
      startedCampaign.testTexterUser,
      message
    );

    optOut = {
      cell: optOutContact.cell,
      assignmentId: startedCampaign.assignmentId.toString()
    };

    const campaignsFilter = {
      campaignId: startedCampaign.dbCampaignContact.campaign_id
    };

    conversations = await getConversations(
      startedCampaign.testAdminUser,
      startedCampaign.organizationId,
      { isOptedOut: false },
      campaignsFilter,
      {}
    );
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterAll(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  describe("when a message review user opts out a user", () => {
    beforeAll(async () => {
      const root = document.createElement("div");
      document.body.appendChild(root);

      conversation = prepareDataTableData(
        conversations.data.conversations.conversations
      )[0];

      onRequestCloseMock = jest.fn();

      component = mount(
        <ApolloProvider client={ApolloClientSingleton}>
          <InnerConversationPreviewModal
            organizationId={startedCampaign.organizationId}
            conversation={conversation}
            onForceRefresh={() => {}}
            onRequestClose={onRequestCloseMock}
          />
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
        InnerConversationPreviewModal
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
        optOut,
        optOutContact.id.toString()
      );
    });
  });
});
