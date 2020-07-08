import nock from "nock";
import moment from "moment";
const ActionNetwork = require("../../../src/integrations/action-handlers/action-network");

expect.extend({
  stringifiedObjectEqualObject(receivedString, expectedObject) {
    let pass = true;
    let message = "";
    try {
      expect(JSON.parse(receivedString)).toEqual(expectedObject);
    } catch (caught) {
      pass = false;
      message = caught.message;
    }
    return {
      pass,
      message: () => message
    };
  }
});

describe("action-network", () => {
  let veryFakeOrganization;

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    process.env[ActionNetwork.envVars.API_KEY] = "fake_api_key";

    veryFakeOrganization = {
      id: 3
    };
  });

  describe("#getClientChoiceData", async () => {
    let makeGetEventsNock;
    let getEventsNock;
    let getEventsResponse;
    let getClientChoiceDataResponse;

    const allNocksDone = () => {
      getEventsNock.done();
    };

    const makeAllNocks = ({ getEventsStatusCode, eventsResponse }) => {
      getEventsNock = makeGetEventsNock({
        page: 1,
        statusCode: getEventsStatusCode,
        eventsResponse
      });
    };

    beforeEach(async () => {
      makeGetEventsNock = ({ page, statusCode, eventsResponse }) =>
        nock("https://actionnetwork.org:443", {
          encodedQueryParams: true
        })
          .get(`/api/v2/events?page=${page}`)
          .reply(statusCode, eventsResponse);
    });

    beforeEach(async () => {
      getEventsResponse = {
        total_pages: 1,
        per_page: 25,
        page: 1,
        total_records: 1,
        _embedded: {
          "osdi:events": [
            {
              identifiers: [
                "action_network:3e50f1a2-5470-4ae9-8719-1cb4f5de4d43"
              ],
              title: "Randi Weingarten's Birthday Party",
              name: "RWBP",
              start_date: moment()
                .add(1, "days")
                .utc()
                .format()
            }
          ]
        }
      };

      getClientChoiceDataResponse = [
        {
          name: "RWBP",
          details: expect.stringifiedObjectEqualObject({
            id: "3e50f1a2-5470-4ae9-8719-1cb4f5de4d43",
            type: "event"
          })
        }
      ];
    });

    it("returns what we expect", async () => {
      makeAllNocks({
        getEventsStatusCode: 200,
        eventsResponse: getEventsResponse
      });

      const clientChoiceData = await ActionNetwork.getClientChoiceData(
        veryFakeOrganization
      );
      const receivedEvents = JSON.parse(clientChoiceData.data).items;

      expect(receivedEvents).toEqual(getClientChoiceDataResponse);

      allNocksDone();
    });

    describe("when there is more than one page", () => {
      let secondPageResponse;
      beforeEach(async () => {
        getEventsResponse = {
          total_pages: 2,
          per_page: 2,
          page: 1,
          total_records: 3,
          _embedded: {
            "osdi:events": [
              {
                identifiers: [
                  "action_network:3e50f1a2-5470-4ae9-8719-1cb4f5de4d43"
                ],
                title: "Randi Weingarten's Birthday Party",
                name: "RWBP",
                start_date: moment()
                  .add(1, "days")
                  .utc()
                  .format()
              },
              {
                identifiers: [
                  "action_network:c3d9aed7-46b2-4a5c-9f85-3df314271081"
                ],
                title: "Bonnie Castillo's Birthday Party",
                name: "BCBP",
                start_date: moment()
                  .add(2, "days")
                  .utc()
                  .format()
              }
            ]
          }
        };

        secondPageResponse = {
          total_pages: 2,
          per_page: 2,
          page: 2,
          total_records: 3,
          _embedded: {
            "osdi:events": [
              {
                identifiers: [
                  "action_network:40f96e48-1910-47c1-933e-feaeac754e8d"
                ],
                title: "Richard Trompka's Birthday Party",
                name: "RTBP",
                start_date: moment()
                  .add(3, "days")
                  .utc()
                  .format()
              }
            ]
          }
        };

        getClientChoiceDataResponse = [
          {
            name: "RWBP",
            details: expect.stringifiedObjectEqualObject({
              id: "3e50f1a2-5470-4ae9-8719-1cb4f5de4d43",
              type: "event"
            })
          },
          {
            name: "BCBP",
            details: expect.stringifiedObjectEqualObject({
              id: "c3d9aed7-46b2-4a5c-9f85-3df314271081",
              type: "event"
            })
          },
          {
            name: "RTBP",
            details: expect.stringifiedObjectEqualObject({
              id: "40f96e48-1910-47c1-933e-feaeac754e8d",
              type: "event"
            })
          }
        ];
      });

      it("return the events from all the pages", async () => {
        makeAllNocks({
          getEventsStatusCode: 200,
          eventsResponse: getEventsResponse
        });

        const eventsSecondPageNock = makeGetEventsNock({
          page: 2,
          statusCode: 200,
          eventsResponse: secondPageResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );
        const receivedEvents = JSON.parse(clientChoiceData.data).items;

        expect(receivedEvents).toEqual(getClientChoiceDataResponse);

        eventsSecondPageNock.done();
        allNocksDone();
      });

      describe("when there is an error retrieving the first page", () => {
        it("returns an error and doesn't make the call for the second page", async () => {
          makeAllNocks({
            getEventsStatusCode: 500,
            eventsResponse: {}
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageResponse
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load events from ActionNetwork"
            })
          });

          expect(eventsSecondPageNock.isDone()).toEqual(false);
          allNocksDone();
          nock.cleanAll();
        });
      });

      describe("when there is an error retrieving the second page", () => {
        it("returns an error", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 500,
            eventsResponse: {}
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load events from ActionNetwork"
            })
          });

          eventsSecondPageNock.done();
          allNocksDone();
        });
      });
    });

    describe("when an event doesn't have a short name", () => {
      beforeEach(async () => {
        // eslint-disable-next-line no-underscore-dangle
        getEventsResponse._embedded["osdi:events"][0].name = undefined;
        getClientChoiceDataResponse[0].name =
          "Randi Weingarten's Birthday Party";
      });

      it("uses title and returns what we expect", async () => {
        makeAllNocks({
          getEventsStatusCode: 200,
          eventsResponse: getEventsResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );
        const receivedEvents = JSON.parse(clientChoiceData.data).items;

        expect(receivedEvents).toEqual(getClientChoiceDataResponse);

        allNocksDone();
      });
    });

    describe("when there is an event in the past", () => {
      beforeEach(async () => {
        const pastEvent = {
          identifiers: ["action_network:40f96e48-1910-47c1-933e-feaeac754e8d"],
          title: "Richard Trompka's Birthday Party",
          name: "RTBP",
          start_date: moment()
            .subtract(1, "days")
            .utc()
            .format()
        };

        // eslint-disable-next-line no-underscore-dangle
        getEventsResponse._embedded["osdi:events"].push(pastEvent);
      });

      it("returns only future events", async () => {
        makeAllNocks({
          getEventsStatusCode: 200,
          eventsResponse: getEventsResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );
        const receivedEvents = JSON.parse(clientChoiceData.data).items;

        expect(receivedEvents).toEqual(getClientChoiceDataResponse);

        allNocksDone();
      });
    });
  });
});
