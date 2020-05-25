import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/integrations/action-handlers";
import * as NgpVanAction from "../../../src/integrations/action-handlers/ngpvan-action";
import nock from "nock";

describe("ngpvn-action", () => {
  beforeEach(async () => {
    process.env.NGP_VAN_APP_NAME = "AVNY.003.hustle";
    process.env.NGP_VAN_API_KEY = "e8ea38bf-4564-6d45-20f8-96fdbf12823c";
    process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = 8;
    process.env.NGP_VAN_WEBHOOK_URL = "https://e6f9b408.ngrok.io";
    process.env.NGP_VAN_MAXIMUM_LIST_SIZE = 300;
    process.env.NGP_VAN_CACHE_TTL = 30;
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

    beforeEach(async () => {
      makeGetSurveyQuestionsNock = (statusCode = 200) =>
        nock("https://api.securevan.com:443", {
          encodedQueryParams: true
        })
          .get("/v4/surveyQuestions?statuses=Active")
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
      const getSurveyQuestionsNock = makeGetSurveyQuestionsNock(200);
      const getActivistCodesNock = makeGetActivistCodesNock();
      const getCanvassResponsesResultCodesNock = makeGetCanvassResponsesResultCodesNock();

      const clientChoiceData = await NgpVanAction.getClientChoiceData();
      const receivedItems = JSON.parse(clientChoiceData.data).items;

      const expectedItems = [
        {
          name: "2020VotePPE - Yes - Early",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 378552,
            surveyResponseId: 1555791
          })
        },
        {
          name: "2020VotePPE - Yes - Eday",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 378552,
            surveyResponseId: 1555792
          })
        },
        {
          name: "2020VotePPE - Yes - Absentee",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 378552,
            surveyResponseId: 1555793
          })
        },
        {
          name: "2020VotePPE - Maybe",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 378552,
            surveyResponseId: 1555794
          })
        },
        {
          name: "2020VotePPE - No",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 378552,
            surveyResponseId: 1555795
          })
        },
        {
          name: "2020VoteTime - Morning",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 381390,
            surveyResponseId: 1566012
          })
        },
        {
          name: "2020VoteTime - Afternoon",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 381390,
            surveyResponseId: 1566013
          })
        },
        {
          name: "2020VoteTime - Evening",
          details: JSON.stringify({
            type: "SurveyResponse",
            surveyQuestionId: 381390,
            surveyResponseId: 1566014
          })
        },
        {
          name: "EdayIssue-PollWorker",
          details: JSON.stringify({
            type: "ActivistCode",
            action: "Apply",
            activistCodeId: 4482459
          })
        },
        {
          name: "Opt-In: Cell Phone",
          details: JSON.stringify({
            type: "ActivistCode",
            action: "Apply",
            activistCodeId: 4153148
          })
        },
        {
          name: "Busy",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 18 })
        },
        {
          name: "Call Back",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 17 })
        },
        {
          name: "Canvassed",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 14 })
        },
        {
          name: "Come Back",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 13 })
        },
        {
          name: "Deceased",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 4 })
        },
        {
          name: "Disconnected",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 25 })
        },
        {
          name: "Do Not Call",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 22 })
        },
        {
          name: "Do Not Email",
          details: JSON.stringify({
            type: "CanvassResponse",
            resultCodeId: 131
          })
        },
        {
          name: "Do Not Text",
          details: JSON.stringify({
            type: "CanvassResponse",
            resultCodeId: 130
          })
        },
        {
          name: "Do Not Walk",
          details: JSON.stringify({ type: "CanvassResponse", resultCodeId: 23 })
        }
      ];

      expect(receivedItems).toEqual(expectedItems);
      expect(clientChoiceData.expiresSeconds).toEqual(30);

      getCanvassResponsesResultCodesNock.done();
      getActivistCodesNock.done();
      getSurveyQuestionsNock.done();
    });

    describe("when there's an error ", () => {
      it("returns what we expect", async () => {
        const getSurveyQuestionsNock = makeGetSurveyQuestionsNock(404);
        const getActivistCodesNock = makeGetActivistCodesNock();
        const getCanvassResponsesResultCodesNock = makeGetCanvassResponsesResultCodesNock();

        const clientChoiceData = await NgpVanAction.getClientChoiceData();
        const receivedError = JSON.parse(clientChoiceData.data).error;

        expect(receivedError).toEqual(
          "Failed to load surveyQuestions, activistCodes or canvassResultCodes from VAN"
        );

        getCanvassResponsesResultCodesNock.done();
        getActivistCodesNock.done();
        getSurveyQuestionsNock.done();
      });
    });
  });
});
