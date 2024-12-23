import { 
    preMessageSave,
    postMessageSave
 } from "../../../src/extensions/message-handlers/auto-optin";
import { cacheableData, r } from "../../../src/server/models";

import {
    setupTest,
    cleanupTest,
    createStartedCampaign
} from "../../test_helpers";

const CacheableMessage = require("../../../src/server/models/cacheable_queries/message");
const saveMessage = CacheableMessage.default.save;

const AutoOptin = require("../../../src/extensions/message-handlers/auto-optin");

const config = require("../../../src/server/api/lib/config");

describe("Auto Opt-In Tests", () => {
    let messageToSave;
    let organization;

    beforeEach(() => {
        jest.resetAllMocks();

        global.DEFAULT_SERVICE = "fakeservice";

        jest.spyOn(cacheableData.optIn, "save").mockResolvedValue(null);
        jest.spyOn(cacheableData.campaignContact, "load").mockResolvedValue({
            id: 1,
            assignment_id: 2
        });
        jest.spyOn(AutoOptin, "available").mockReturnValue(true);
        jest.spyOn(config, "getConfig").mockReturnValue("");

        messageToSave = {
            is_from_contact: true,
            contact_number: "+1234567890",
            capmaign_contact_id: 1,
            text: "START",
            campaign_contact_id: 42
        };
        // I think this is the structure,
        // even if wrong, doesnt affect test
        organization = 1;
    })
    
    afterEach(() => {
        global.DEFAULT_SERVICE = "fakeservice";
    });

    describe("preMessageSave", () => {
        it("returns object on default settings", async () => {
            const result = preMessageSave({
                messageToSave,
                organization
            });

            expect(config.getConfig).toHaveBeenCalled();
            expect(result).toEqual({
                contactUpdates: {
                    is_opted_in: true
                },
                handlerContext: {
                    autoOptInReason: "start"
                },
                messageToSave
            })
        });

        it("does not return with a non matching message", async () => {
            messageToSave = {
                ...messageToSave,
                text: "just another message"
            };

            const result = preMessageSave({
                messageToSave,
                organization
            });

            expect(config.getConfig).toHaveBeenCalled();
            expect(result).toEqual(undefined);
        });

        it("does not return, even when START is apart of the text", async () => {
            // This is inline with DEFAULT_AUTO_OPTIN_REGEX_LIST_BASE64.
            // If AUTO_OPTIN_REGEX_LIST_BASE64 is enabled, may change behavior.
            messageToSave = {
                ...messageToSave,
                text: "START, but do not opt me in"
            };

            const result = preMessageSave({
                messageToSave,
                organization
            });

            expect(config.getConfig).toHaveBeenCalled();
            expect(result).toEqual(undefined);
        });

        it("returns an object after changing default regex", async () => {
            // this also tests autoOptInReason is "optin"
            jest.spyOn(config, "getConfig").mockReturnValue(
                "W3sicmVnZXgiOiAiXk9QVC1JTiQiLCAicmVhc29uIjogIm9wdGluIn1d"
            ); // [{"regex": "^OPT-IN$"", "reason": "optin"}]

            messageToSave = {
                ...messageToSave,
                text:"OPT-IN"
            };

            const result = preMessageSave({
                messageToSave,
                organization
            })

            expect(result).toEqual({
                contactUpdates: {
                    is_opted_in: true
                },
                handlerContext: {
                    autoOptInReason: "optin"
                },
                messageToSave
            })
        });

        it("tests autoOptInReason defaults to \"auto_optin\" when no reason is given in regex", async () => {
            jest.spyOn(config, "getConfig").mockReturnValue(
                "W3sicmVnZXgiOiAiXk9QVC1JTiQifV0="
            ); // [{"regex": "^OPT-IN$"}]

            messageToSave = {
                ...messageToSave,
                text: "OPT-IN"
            };

            const result = preMessageSave({
                messageToSave,
                organization
            });

            expect(result).toEqual({
                contactUpdates: {
                    is_opted_in: true
                },
                handlerContext: {
                    autoOptInReason: "auto_optin"
                },
                messageToSave
            })
        });
    })

    describe("postMessageSave", () => {
        let message;
        let organization;
        let handlerContext;
        let campaign;

        beforeEach( async () => {
            jest.restoreAllMocks();

            global.DEFAULT_SERVICE = "fakeservice";

            message = {
                is_from_contact: true,
                campaign_contact_id: 42
            };

            organization = {
                id: 2
            };

            handlerContext = {
                autoOptInReason: "start"
            };

            campaign = {}

            jest.spyOn(cacheableData.campaignContact, "load").mockReturnValue(null);
            jest.spyOn(cacheableData.optIn, "save").mockReturnValue(null);
        });

        afterEach(async () => {
            jest.restoreAllMocks();
            global.DEFAULT_SERVICE = "fakeservice";
        });

        it("saves to optIn table", async () => {
            await postMessageSave({
                message,
                organization,
                handlerContext,
                campaign
            });

            expect(cacheableData.campaignContact.load).toHaveBeenCalled();
            expect(cacheableData.optIn.save).toHaveBeenCalled();
        });

        it("does not save to optin table with no handlerContext.autoOptInReason", async () => {
            handlerContext = {};

            await postMessageSave({
                message,
                organization,
                handlerContext,
                campaign
            });

            expect(cacheableData.campaignContact.load).toHaveBeenCalledTimes(0);
            expect(cacheableData.optIn.save).toHaveBeenCalledTimes(0);
        });

        it("does not save to optin table with when message is not from contact", async () => {
            message = {};

            await postMessageSave({
                message,
                organization,
                handlerContext,
                campaign
            });

            expect(cacheableData.campaignContact.load).toHaveBeenCalledTimes(0);
            expect(cacheableData.optIn.save).toHaveBeenCalledTimes(0);
        });
    });
});

describe("Tests for Auto Opt-Out's members getting called from messageCache.save", () => {
    let contacts;
    let organization;
    let texter;

    let service;
    let messageServiceSID;

    beforeEach(async () => {
        await cleanupTest();
        await setupTest();
        jest.restoreAllMocks();

        global.MESSAGE_HANDLERS = "auto-optin";

        const startedCampaign = await createStartedCampaign();

        ({
            testContacts: contacts,
            testTexterUser: texter,
            testOrganization: {
                data: { createOrganization: organization }
            }
        } = startedCampaign);
        
        service = "twilio";
        messageServiceSID = "some_messsage_service_id";

        const messageToContact = {
            is_from_contact: false,
            contact_number: contacts[0].cell,
            campaign_contact_id: contacts[0].id,
            send_status: "SENT",
            text: "Hi",
            service,
            texter,
            messageservice_sid: messageServiceSID
        };

        await saveMessage({
            messageInstance: messageToContact,
            contact: contacts[0],
            organization,
            texter
        });
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

    afterEach(async () => {
        await cleanupTest();
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

    it("gets called", async () => {
        const message = {
            is_from_contact: true,
            contact_number: contacts[0].cell,
            service,
            messageservice_sid: messageServiceSID,
            text: "START",
            send_status: "DELIVERED" // ??
        };

        jest.spyOn(AutoOptin, "preMessageSave").mockResolvedValue(null);
        jest.spyOn(AutoOptin, "postMessageSave").mockResolvedValue(null);

        await saveMessage({
            messageInstance: message
        });

        expect(AutoOptin.preMessageSave).toHaveBeenCalledWith(
            expect.objectContaining({
                messageToSave: expect.objectContaining({
                    text: "START",
                    contact_number: contacts[0].cell
                })
            })
        );

        expect(AutoOptin.postMessageSave).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.objectContaining({
                    text: "START",
                    contact_number: contacts[0].cell
                })
            })
        );
    });
});