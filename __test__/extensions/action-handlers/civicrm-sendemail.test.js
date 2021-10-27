import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-sendemail";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";
import { searchMessageTemplates } from "../../../src/extensions/contact-loaders/civicrm/util";

jest.mock("../../../src/server/api/lib/config");

describe("test-action-civicrm-sendemail", () => {
  beforeEach(async () => {
    when(hasConfig)
      .calledWith("CIVICRM_API_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_SITE_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_API_URL")
      .mockReturnValue(true);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("passes validation, and comes with standard action handler functionality", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual("civicrm-sendemail");
    expect(HandlerToTest.displayName()).toEqual("Send email to contact");
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("test-action-civicrm-sendemail available()", () => {
    it("is available if the civicrm contact loader is available and has CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("1");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is available but does not have CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(false);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("1");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is available but has non-numeric CIVICRM_MESSAGE_IDS in env", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      when(hasConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue(true);
      when(getConfig)
        .calledWith("CIVICRM_MESSAGE_IDS")
        .mockReturnValue("false");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 0
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 0
      });
    });
  });

  xdescribe("test-action-civicrm-sendemail getClientChoiceData()", () => {
    beforeEach(async () => {
      jest.mock("../../../src/extensions/contact-loaders/civicrm/util");
    });

    afterEach(async () => {
      jest.restoreAllMocks();
    });
    xit("returns successful data when data is available", async () => {
      const theTemplateData = [
        { id: "65", msg_title: "Sample CiviMail Newsletter Template" },
        { id: "68", msg_title: "Volunteer - Registration (on-line)" },
        { id: "69", msg_title: "Self-Roster Invite Email" }
      ];

      searchMessageTemplates.mockResolvedValue(theTemplateData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data:
          '{"items":[{"name":"Company","details":"2"},{"name":"Government Entity","details":"3"},{"name":"Major Donor","details":"4"},{"name":"Non-profit","details":"1"},{"name":"Volunteer","details":"5"}]}',
        expiresSeconds: 3600
      });
    });

    it("returns successful data when data is empty", async () => {
      const theTemplateData = [];

      when(searchMessageTemplates)
        .calledWith()
        .mockResolvedValue(theTemplateData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data: '{"items":[]}',
        expiresSeconds: 3600
      });
    });
  });
});
