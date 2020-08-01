import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/integrations/action-handlers";
import nock from "nock";

const NgpVanAction = require("../../../src/integrations/action-handlers/ngpvan-action");
require("../../test_helpers");

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("ngpvn-action", () => {
  let veryFakeOrganization;

  beforeEach(async () => {
    process.env.NGP_VAN_APP_NAME = "fake_app_name";
    process.env.NGP_VAN_API_KEY = "fake_api_key";
    process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = 8;
    process.env.NGP_VAN_WEBHOOK_URL = "https://e6f9b408.ngrok.io";
    process.env.NGP_VAN_MAXIMUM_LIST_SIZE = 300;
    process.env.NGP_VAN_CACHE_TTL = 30;

    veryFakeOrganization = {
      id: 3
    };
  });

  it("passes validation", async () => {
    expect(() => validateActionHandler(NgpVanAction)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(NgpVanAction)
    ).not.toThrowError();
  });

  describe("#getClientChoiceData", async () => {
    let makeGetSurveyQuestionsNock;
    let makeGetActivistCodesNock;
    let makeGetCanvassResponsesResultCodesNock;
    let makeGetCanvassResponsesContactTypesNock;
    let makeGetCanvassResponsesInputTypesNock;

    let getSurveyQuestionsNock;
    let getActivistCodesNock;
    let getCanvassResponsesResultCodesNock;
    let getCanvassResponsesContactTypesNock;
    let getCanvassResponsesInputTypesNock;

    const allNocksDone = () => {
      getCanvassResponsesResultCodesNock.done();
      getActivistCodesNock.done();
      getSurveyQuestionsNock.done();
      getCanvassResponsesContactTypesNock.done();
      getCanvassResponsesInputTypesNock.done();
    };

    const makeAllNocks = ({
      getSurveyResultsStatusCode,
      getSurveyResponsesExtraParameters,
      getCanvasResponsesContactTypesStatusCode,
      getCanvassResponsesContactTypesResult,
      getCanvassResponsesInputTypesResult
    }) => {
      getSurveyQuestionsNock = makeGetSurveyQuestionsNock(
        getSurveyResultsStatusCode,
        getSurveyResponsesExtraParameters
      );
      getActivistCodesNock = makeGetActivistCodesNock();
      getCanvassResponsesResultCodesNock = makeGetCanvassResponsesResultCodesNock();
      getCanvassResponsesInputTypesNock = makeGetCanvassResponsesInputTypesNock(
        { result: getCanvassResponsesInputTypesResult }
      );
      getCanvassResponsesContactTypesNock = makeGetCanvassResponsesContactTypesNock(
        {
          statusCode: getCanvasResponsesContactTypesStatusCode,
          result: getCanvassResponsesContactTypesResult
        }
      );
    };

    beforeEach(async () => {
      makeGetCanvassResponsesContactTypesNock = ({
        statusCode = 200,
        result
      }) =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get(`/v4/canvassResponses/contactTypes`)
          .reply(
            statusCode,
            result || [
              {
                contactTypeId: 4,
                channelTypeName: "Phone",
                name: "Robocall"
              },
              {
                contactTypeId: 37,
                channelTypeName: "Text",
                name: "SMS Text"
              },
              {
                contactTypeId: 79,
                channelTypeName: "Online",
                name: "Social Media"
              },
              {
                contactTypeId: 15,
                channelTypeName: "Other",
                name: "Survey"
              }
            ]
          );
    });

    beforeEach(async () => {
      makeGetCanvassResponsesInputTypesNock = ({ statusCode = 200, result }) =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get(`/v4/canvassResponses/inputTypes`)
          .reply(
            statusCode,
            result || [
              {
                inputTypeId: 11,
                name: "API"
              },
              {
                inputTypeId: 9,
                name: "Auto Dial"
              },
              {
                inputTypeId: 5,
                name: "Back End"
              },
              {
                inputTypeId: 3,
                name: "Bar Code"
              }
            ]
          );
    });

    beforeEach(async () => {
      makeGetSurveyQuestionsNock = (statusCode = 200, extraParams = "") =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get(`/v4/surveyQuestions?statuses=Active${extraParams}`)
          .reply(statusCode, {
            items: [
              {
                surveyQuestionId: 378552,
                type: "GOTV",
                cycle: 2020,
                name: "2020VotePPE",
                mediumName: "2020VoteP",
                shortName: "2020",
                scriptQuestion:
                  "Can we count on you to vote in the 2020 Presidential Primary Election? How do you plan to vote?",
                status: "Active",
                responses: [
                  {
                    surveyResponseId: 1555791,
                    name: "Yes - Early",
                    mediumName: "YEa",
                    shortName: "E"
                  },
                  {
                    surveyResponseId: 1555792,
                    name: "Yes - Eday",
                    mediumName: "YEd",
                    shortName: "D"
                  },
                  {
                    surveyResponseId: 1555793,
                    name: "Yes - Absentee",
                    mediumName: "YAb",
                    shortName: "A"
                  },
                  {
                    surveyResponseId: 1555794,
                    name: "Maybe",
                    mediumName: "May",
                    shortName: "M"
                  },
                  {
                    surveyResponseId: 1555795,
                    name: "No",
                    mediumName: "No",
                    shortName: "N"
                  }
                ]
              },
              {
                surveyQuestionId: 381390,
                type: "GOTV",
                cycle: 2020,
                name: "2020VoteTime",
                mediumName: "2020VoteT",
                shortName: "2020",
                scriptQuestion: "What time of the day do you plan to vote?",
                status: "Active",
                responses: [
                  {
                    surveyResponseId: 1566012,
                    name: "Morning",
                    mediumName: "Mor",
                    shortName: "M"
                  },
                  {
                    surveyResponseId: 1566013,
                    name: "Afternoon",
                    mediumName: "Aft",
                    shortName: "A"
                  },
                  {
                    surveyResponseId: 1566014,
                    name: "Evening",
                    mediumName: "Eve",
                    shortName: "E"
                  }
                ]
              }
            ],
            nextPageLink: null,
            count: 2
          });
    });

    beforeEach(async () => {
      makeGetActivistCodesNock = () =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get("/v4/activistCodes?statuses=Active")
          .reply(200, {
            items: [
              {
                activistCodeId: 4482459,
                type: "Constituency/Issue",
                name: "EdayIssue-PollWorker",
                mediumName: "EdayIssue",
                shortName: "Eda",
                description: null,
                scriptQuestion: null,
                status: "Active"
              },
              {
                activistCodeId: 4153148,
                type: "Constituency/Issue",
                name: "Opt-In: Cell Phone",
                mediumName: "Cell Phon",
                shortName: "Cel",
                description: "Opt-In: Cell Phone",
                scriptQuestion: null,
                status: "Active"
              }
            ],
            nextPageLink: null,
            count: 2
          });
    });

    beforeEach(async () => {
      makeGetCanvassResponsesResultCodesNock = () =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get("/v4/canvassResponses/resultCodes")
          .reply(200, [
            {
              resultCodeId: 18,
              name: "Busy",
              mediumName: "Busy",
              shortName: "BZ"
            },
            {
              resultCodeId: 17,
              name: "Call Back",
              mediumName: "CB",
              shortName: "CB"
            },
            {
              resultCodeId: 14,
              name: "Canvassed",
              mediumName: "Canv",
              shortName: "CV"
            },
            {
              resultCodeId: 13,
              name: "Come Back",
              mediumName: "CB",
              shortName: "CB"
            },
            {
              resultCodeId: 4,
              name: "Deceased",
              mediumName: "Dec",
              shortName: "DC"
            },
            {
              resultCodeId: 25,
              name: "Disconnected",
              mediumName: "Disc",
              shortName: "WX"
            },
            {
              resultCodeId: 22,
              name: "Do Not Call",
              mediumName: "DNC",
              shortName: "XC"
            },
            {
              resultCodeId: 131,
              name: "Do Not Email",
              mediumName: "DNE",
              shortName: "DE"
            },
            {
              resultCodeId: 130,
              name: "Do Not Text",
              mediumName: "DNT",
              shortName: "XT"
            },
            {
              resultCodeId: 23,
              name: "Do Not Walk",
              mediumName: "DNW",
              shortName: "XW"
            }
          ]);
    });

    it("returns what we expect", async () => {
      makeAllNocks({ getSurveyResultsStatusCode: 200 });

      const clientChoiceData = await NgpVanAction.getClientChoiceData();
      const receivedItems = JSON.parse(clientChoiceData.data).items;

      const expectedItems = [
        {
          name: "2020VotePPE - Yes - Early",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 378552,
                surveyResponseId: 1555791
              }
            ]
          })
        },
        {
          name: "2020VotePPE - Yes - Eday",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 378552,
                surveyResponseId: 1555792
              }
            ]
          })
        },
        {
          name: "2020VotePPE - Yes - Absentee",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 378552,
                surveyResponseId: 1555793
              }
            ]
          })
        },
        {
          name: "2020VotePPE - Maybe",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 378552,
                surveyResponseId: 1555794
              }
            ]
          })
        },
        {
          name: "2020VotePPE - No",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 378552,
                surveyResponseId: 1555795
              }
            ]
          })
        },
        {
          name: "2020VoteTime - Morning",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 381390,
                surveyResponseId: 1566012
              }
            ]
          })
        },
        {
          name: "2020VoteTime - Afternoon",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 381390,
                surveyResponseId: 1566013
              }
            ]
          })
        },
        {
          name: "2020VoteTime - Evening",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "SurveyResponse",
                surveyQuestionId: 381390,
                surveyResponseId: 1566014
              }
            ]
          })
        },
        {
          name: "EdayIssue-PollWorker",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "ActivistCode",
                action: "Apply",
                activistCodeId: 4482459
              }
            ]
          })
        },
        {
          name: "Opt-In: Cell Phone",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            responses: [
              {
                type: "ActivistCode",
                action: "Apply",
                activistCodeId: 4153148
              }
            ]
          })
        },
        {
          name: "Busy",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 18
          })
        },
        {
          name: "Call Back",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 17
          })
        },
        {
          name: "Canvassed",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 14
          })
        },
        {
          name: "Come Back",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 13
          })
        },
        {
          name: "Deceased",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 4
          })
        },
        {
          name: "Disconnected",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 25
          })
        },
        {
          name: "Do Not Call",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 22
          })
        },
        {
          name: "Do Not Email",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },

            resultCodeId: 131
          })
        },
        {
          name: "Do Not Text",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },

            resultCodeId: 130
          })
        },
        {
          name: "Do Not Walk",
          details: JSON.stringify({
            canvassContext: { contactTypeId: 37, inputTypeId: 11 },
            resultCodeId: 23
          })
        }
      ];

      expect(receivedItems).toEqual(expectedItems);
      expect(clientChoiceData.expiresSeconds).toEqual(600);

      allNocksDone();
    });

    describe("when there's an election cycle filter", () => {
      beforeEach(async () => {
        process.env.NGP_VAN_ELECTION_CYCLE_FILTER = "2020";
        nock.removeInterceptor(getSurveyQuestionsNock);
      });

      afterEach(async () => {
        delete process.env.NGP_VAN_ELECTION_CYCLE_FILTER;
      });

      it("makes the correct API requests", async () => {
        makeAllNocks({
          getSurveyResultsStatusCode: 200,
          getSurveyResponsesExtraParameters: "&cycle=2020"
        });
        await NgpVanAction.getClientChoiceData();
        allNocksDone();
      });
    });

    describe("when there's an error retrieving surveyQuestions", () => {
      it("returns what we expect", async () => {
        makeAllNocks({ getSurveyResultsStatusCode: 404 });

        const clientChoiceData = await NgpVanAction.getClientChoiceData();
        const receivedError = JSON.parse(clientChoiceData.data).error;

        expect(receivedError).toEqual(
          "Failed to load surveyQuestions, activistCodes or canvass/resultCodes from VAN"
        );

        allNocksDone();
      });
    });

    describe("when there's an error retrieving canvass/contactTypes", () => {
      it("throws an exception", async () => {
        makeAllNocks({ getCanvasResponsesContactTypesStatusCode: 404 });

        const clientChoiceData = await NgpVanAction.getClientChoiceData();
        const receivedError = JSON.parse(clientChoiceData.data).error;

        expect(receivedError).toEqual(
          "Failed to load canvass/contactTypes or canvass/inputTypes from VAN"
        );

        nock.abortPendingRequests();
      });
    });

    describe("when canvass/contactTypes doesn't have the item we want", () => {
      it("throws an exception", async () => {
        makeAllNocks({ getCanvassResponsesContactTypesResult: [] });

        const clientChoiceData = await NgpVanAction.getClientChoiceData();
        const receivedError = JSON.parse(clientChoiceData.data).error;

        expect(receivedError).toEqual(
          "Failed to load canvass/contactTypes or canvass/inputTypes from VAN"
        );

        nock.abortPendingRequests();
      });
    });

    describe("when canvass/inputTypes doesn't have the item we want", () => {
      it("throws an exception", async () => {
        makeAllNocks({ getCanvassResponsesInputTypesResult: [] });

        const clientChoiceData = await NgpVanAction.getClientChoiceData();
        const receivedError = JSON.parse(clientChoiceData.data).error;

        expect(receivedError).toEqual(
          "Failed to load canvass/contactTypes or canvass/inputTypes from VAN"
        );

        nock.abortPendingRequests();
      });
    });
  });

  describe("#clientChoiceDataCacheKey", () => {
    it("returns the organizationId as a string", async () => {
      const cacheKey = NgpVanAction.clientChoiceDataCacheKey(
        veryFakeOrganization
      );
      expect(cacheKey).toEqual("3");
    });
  });

  describe("#available", () => {
    it("delegates to its dependencies and returns something indicating it's available", async () => {
      jest.spyOn(NgpVanAction, "getClientChoiceData").mockResolvedValueOnce({});
      const result = await NgpVanAction.available(veryFakeOrganization);
      expect(result).toEqual({
        result: true,
        expiresSeconds: 86400
      });
      expect(NgpVanAction.getClientChoiceData.mock.calls).toEqual([
        [veryFakeOrganization]
      ]);
    });

    describe("when an enviornment variable is missing", () => {
      beforeEach(async () => {
        delete process.env.NGP_VAN_API_KEY;
      });
      it("returns something indicating it's unavailble", async () => {
        jest.spyOn(NgpVanAction, "getClientChoiceData");
        const result = await NgpVanAction.available(veryFakeOrganization);
        expect(result).toEqual({
          result: false,
          expiresSeconds: 86400
        });
        expect(NgpVanAction.getClientChoiceData).not.toHaveBeenCalled();
      });
    });

    describe("when getClientChoiceData returns an error", () => {
      beforeEach(async () => {
        jest.spyOn(NgpVanAction, "getClientChoiceData").mockResolvedValue({
          data: JSON.stringify({
            error: "Mercury is retrograde"
          })
        });
      });
      it("returns something indicating it's unavailble", async () => {
        const result = await NgpVanAction.available(veryFakeOrganization);
        expect(result).toEqual({
          result: false,
          expiresSeconds: 86400
        });
        expect(NgpVanAction.getClientChoiceData.mock.calls).toEqual([
          [veryFakeOrganization]
        ]);
      });
    });

    describe("when getClientChoiceData throws an exception", () => {
      beforeEach(async () => {
        jest
          .spyOn(NgpVanAction, "getClientChoiceData")
          .mockRejectedValueOnce(new Error("Mercury is retrograde"));
      });
      it("returns something indicating it's unavailble", async () => {
        const result = await NgpVanAction.available(veryFakeOrganization);
        expect(result).toEqual({
          result: false,
          expiresSeconds: 86400
        });
        expect(NgpVanAction.getClientChoiceData.mock.calls).toEqual([
          [veryFakeOrganization]
        ]);
      });
    });
  });

  describe("#processAction", () => {
    let interactionStep;
    let contact;
    let organization;
    let interactionStepValue;

    let unusedQuestionResponse;
    let unusedCampaignContactId;
    let unusedCampaign;

    let makePostPeopleCanvassResponsesNock;
    let postPeopleCanvassResponsesNock;

    beforeEach(async () => {
      interactionStepValue = '{"hex":"#B22222","rgb":{"r":178,"g":34,"b":34}}';
      interactionStep = {
        answer_actions_data: JSON.stringify({
          value: JSON.stringify(interactionStepValue)
        })
      };

      contact = {
        custom_fields: JSON.stringify({
          VanID: "8675309"
        })
      };

      organization = {
        id: 3
      };
    });

    beforeEach(async () => {
      makePostPeopleCanvassResponsesNock = ({ statusCode = 204 } = {}) =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .post(
            `/v4/people/8675309/canvassResponses`,
            JSON.stringify(interactionStepValue)
          )
          .reply(statusCode);
    });

    it("calls the people endpoint", async () => {
      postPeopleCanvassResponsesNock = makePostPeopleCanvassResponsesNock();

      await NgpVanAction.processAction(
        unusedQuestionResponse,
        interactionStep,
        unusedCampaignContactId,
        contact,
        unusedCampaign,
        organization
      );

      postPeopleCanvassResponsesNock.done();
    });

    describe("when VAN returns a status other than 204", () => {
      it("rethrows the exception", async () => {
        postPeopleCanvassResponsesNock = makePostPeopleCanvassResponsesNock({
          statusCode: 500
        });

        let error;
        try {
          await NgpVanAction.processAction(
            unusedQuestionResponse,
            interactionStep,
            unusedCampaignContactId,
            contact,
            unusedCampaign,
            organization
          );
        } catch (caughtException) {
          error = caughtException;
        }

        expect(error.message).toEqual(
          expect.stringMatching(/.*received status 500.*/)
        );

        postPeopleCanvassResponsesNock.done();
      });
    });

    describe("when something throws an exception", () => {
      beforeEach(async () => {
        interactionStepValue =
          '{"hex":"#B22222","rgb":{"r":178,"g":34,"b":34}}';

        // not stringifying in order to force an exception
        interactionStep = {
          answer_actions_data: {
            value: interactionStepValue
          }
        };

        contact = {
          custom_fields: JSON.stringify({
            VanID: "8675309"
          })
        };

        organization = {
          id: 3
        };
      });
      it("rethrows the exception", async () => {
        postPeopleCanvassResponsesNock = makePostPeopleCanvassResponsesNock({
          statusCode: 500
        });

        let error;
        try {
          await NgpVanAction.processAction(
            unusedQuestionResponse,
            interactionStep,
            unusedCampaignContactId,
            contact,
            unusedCampaign,
            organization
          );
        } catch (caughtException) {
          error = caughtException;
        }

        expect(error.message).toEqual(
          expect.stringMatching(/^unexpected token*/i)
        );

        expect(postPeopleCanvassResponsesNock.isDone()).toEqual(false);
        nock.cleanAll();
      });
    });
  });

  describe("#postCanvassResponse", () => {
    let contact;
    let organization;
    let body;

    describe("happy path", () => {
      beforeEach(async () => {
        contact = {
          custom_fields: JSON.stringify({
            VanID: "8675309"
          })
        };

        organization = {
          id: 3
        };

        body = {
          willVote: true
        };
      });

      it("calls the people endpoint", async () => {
        const postPeopleCanvassResponsesNock = nock(
          "https://api.securevan.com:443",
          {
            encodedQueryParams: true
          }
        )
          .post(`/v4/people/8675309/canvassResponses`, JSON.stringify(body))
          .reply(204);

        await NgpVanAction.postCanvassResponse(contact, organization, body);

        postPeopleCanvassResponsesNock.done();
      });
    });

    describe("when custom_fields fails to parse", () => {
      beforeEach(async () => {
        jest.spyOn(console, "error");
        contact = {
          id: 3,
          custom_fields: "won't parse"
        };
      });

      it("logs an error and returns {}", async () => {
        const result = await NgpVanAction.postCanvassResponse(
          contact,
          organization,
          body
        );

        // eslint-disable-next-line no-console
        expect(console.error.mock.calls).toEqual([
          [expect.stringMatching(/Error parsing custom_fields for contact 3.*/)]
        ]);
        expect(result).toEqual({});
      });
    });

    describe("when custom_fields doesn't have VanID", () => {
      beforeEach(async () => {
        jest.spyOn(console, "error");
        contact = {
          id: 3,
          custom_fields: "{}"
        };
      });

      it("logs an error and returns {}", async () => {
        const result = await NgpVanAction.postCanvassResponse(
          contact,
          organization,
          body
        );

        // eslint-disable-next-line no-console
        expect(console.error.mock.calls).toEqual([
          [
            "Cannot sync results to van for campaign_contact 3. No VanID in custom fields"
          ]
        ]);
        expect(result).toEqual({});
      });
    });
  });
});
