import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-addtag";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";
import { searchTags } from "../../../src/extensions/contact-loaders/civicrm/util";
import { CIVICRM_CACHE_SECONDS } from "../../../src/extensions/contact-loaders/civicrm/const";

jest.mock("../../../src/server/api/lib/config");
jest.mock("../../../src/extensions/contact-loaders/civicrm/util");

describe("civicrm-addtag", () => {
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
    expect(HandlerToTest.name).toEqual("civicrm-addtag");
    expect(HandlerToTest.displayName()).toEqual("Add tag to CiviCRM contact");
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("civicrm-addtag available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });

  describe("civicrm-addtag available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });

  describe("civicrm-addtag getClientChoiceData()", () => {
    it("returns successful data when data is available", async () => {
      const theTagData = [
        { id: "2", name: "Company" },
        { id: "3", name: "Government Entity" },
        { id: "4", name: "Major Donor" },
        { id: "1", name: "Non-profit" },
        { id: "5", name: "Volunteer" }
      ];

      when(searchTags).mockResolvedValue(theTagData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data:
          '{"items":[{"name":"Company","details":"2"},{"name":"Government Entity","details":"3"},{"name":"Major Donor","details":"4"},{"name":"Non-profit","details":"1"},{"name":"Volunteer","details":"5"}]}',
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });

    it("returns successful data when data is empty", async () => {
      const theTagData = [];

      when(searchTags).mockResolvedValue(theTagData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data: '{"items":[]}',
        expiresSeconds: CIVICRM_CACHE_SECONDS
      });
    });
  });
});
