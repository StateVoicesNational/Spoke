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
      message = `Expected ${receivedString} to equal ${JSON.stringify(
        expectedObject
      )}`;
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
    let makeGetTagsNock;
    let getEventsNock;
    let getTagsNock;
    let getEventsResponse;
    let getTagsResponse;
    let getClientChoiceDataResponse;

    const allNocksDone = () => {
      getEventsNock.done();
      getTagsNock.done();
    };

    const makeAllNocks = ({
      getEventsStatusCode,
      eventsResponse,
      getTagsStatusCode,
      tagsResponse
    }) => {
      getEventsNock = makeGetEventsNock({
        page: 1,
        getEventsStatusCode,
        eventsResponse
      });

      getTagsNock = makeGetTagsNock({
        page: 1,
        getTagsStatusCode,
        tagsResponse
      });
    };

    beforeEach(async () => {
      makeGetEventsNock = ({ page, getEventsStatusCode, eventsResponse }) =>
        nock("https://actionnetwork.org:443", {
          encodedQueryParams: true
        })
          .get(`/api/v2/events?page=${page}`)
          .reply(getEventsStatusCode, eventsResponse);

      makeGetTagsNock = ({ page, getTagsStatusCode, tagsResponse }) =>
        nock("https://actionnetwork.org:443", {
          encodedQueryParams: true
        })
          .get(`/api/v2/tags?page=${page}`)
          .reply(getTagsStatusCode, tagsResponse);
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

      getTagsResponse = {
        total_pages: 1,
        per_page: 25,
        page: 1,
        total_records: 1,
        _embedded: {
          "osdi:tags": [
            {
              name: "release",
              identifiers: [
                "action_network:c1f68579-b36b-4d43-8312-204894af8731"
              ]
            },
            {
              name: "2019 Survey - Trainings",
              identifiers: [
                "action_network:eb24f4ec-2a3b-4ba4-b400-bc9997ca9ca5"
              ]
            }
          ]
        }
      };

      getClientChoiceDataResponse = [
        {
          name: "RSVP RWBP",
          details: expect.stringifiedObjectEqualObject({
            identifier: "3e50f1a2-5470-4ae9-8719-1cb4f5de4d43",
            type: "event"
          })
        },
        {
          name: "TAG release",
          details: expect.stringifiedObjectEqualObject({
            tag: "release",
            type: "tag"
          })
        },
        {
          name: "TAG 2019 Survey - Trainings",
          details: expect.stringifiedObjectEqualObject({
            tag: "2019 Survey - Trainings",
            type: "tag"
          })
        }
      ];

      jest.spyOn(ActionNetwork, "setTimeoutPromise");
    });

    it("returns what we expect", async () => {
      makeAllNocks({
        getEventsStatusCode: 200,
        eventsResponse: getEventsResponse,
        getTagsStatusCode: 200,
        tagsResponse: getTagsResponse
      });

      const clientChoiceData = await ActionNetwork.getClientChoiceData(
        veryFakeOrganization
      );

      expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

      const receivedEvents = JSON.parse(clientChoiceData.data).items;
      expect(receivedEvents).toEqual(getClientChoiceDataResponse);

      allNocksDone();
    });

    describe("when there is more than one page", () => {
      let secondPageEventsResponse;
      let secondPageTagsResponse;
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

        getTagsResponse = {
          total_pages: 2,
          per_page: 2,
          page: 1,
          total_records: 3,
          _embedded: {
            "osdi:tags": [
              {
                name: "release",
                identifiers: [
                  "action_network:c1f68579-b36b-4d43-8312-204894af8731"
                ]
              },
              {
                name: "2019 Survey - Trainings",
                identifiers: [
                  "action_network:eb24f4ec-2a3b-4ba4-b400-bc9997ca9ca5"
                ]
              }
            ]
          }
        };

        secondPageEventsResponse = {
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

        secondPageTagsResponse = {
          total_pages: 2,
          per_page: 2,
          page: 2,
          total_records: 3,
          _embedded: {
            "osdi:tags": [
              {
                name: "2019 Survey - Federal/State Legislation",
                identifiers: [
                  "action_network:c1f68579-b36b-4d43-8312-204894afaaaa"
                ]
              }
            ]
          }
        };

        getClientChoiceDataResponse = [
          {
            name: "RSVP RWBP",
            details: expect.stringifiedObjectEqualObject({
              identifier: "3e50f1a2-5470-4ae9-8719-1cb4f5de4d43",
              type: "event"
            })
          },
          {
            name: "RSVP BCBP",
            details: expect.stringifiedObjectEqualObject({
              identifier: "c3d9aed7-46b2-4a5c-9f85-3df314271081",
              type: "event"
            })
          },
          {
            name: "RSVP RTBP",
            details: expect.stringifiedObjectEqualObject({
              identifier: "40f96e48-1910-47c1-933e-feaeac754e8d",
              type: "event"
            })
          },
          {
            name: "TAG release",
            details: expect.stringifiedObjectEqualObject({
              tag: "release",
              type: "tag"
            })
          },
          {
            name: "TAG 2019 Survey - Trainings",
            details: expect.stringifiedObjectEqualObject({
              tag: "2019 Survey - Trainings",
              type: "tag"
            })
          },
          {
            name: "TAG 2019 Survey - Federal/State Legislation",
            details: expect.stringifiedObjectEqualObject({
              tag: "2019 Survey - Federal/State Legislation",
              type: "tag"
            })
          }
        ];
      });

      it("return the jawns from all the pages", async () => {
        makeAllNocks({
          getEventsStatusCode: 200,
          eventsResponse: getEventsResponse,
          getTagsStatusCode: 200,
          tagsResponse: getTagsResponse
        });

        const eventsSecondPageNock = makeGetEventsNock({
          page: 2,
          statusCode: 200,
          eventsResponse: secondPageEventsResponse
        });

        const tagsSecondPageNock = makeGetTagsNock({
          page: 2,
          statusCode: 200,
          tagsResponse: secondPageTagsResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );

        expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

        const receivedEvents = JSON.parse(clientChoiceData.data).items;
        expect(receivedEvents).toEqual(getClientChoiceDataResponse);

        eventsSecondPageNock.done();
        tagsSecondPageNock.done();
        allNocksDone();
      });

      describe("when there is an error retrieving the first page of events", () => {
        it("returns an error and doesn't make the call for the second page", async () => {
          makeAllNocks({
            getEventsStatusCode: 500,
            eventsResponse: {},
            getTagsStatusCode: 200,
            tagsResponse: getTagsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load choices from ActionNetwork"
            })
          });

          expect(eventsSecondPageNock.isDone()).toEqual(false);
          allNocksDone();
          nock.cleanAll();
        });
      });

      describe("when there is an error retrieving the first page of tags", () => {
        it("returns an error and doesn't make the call for the second page", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse,
            getTagsStatusCode: 500,
            tagsResponse: {}
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const tagsSecondPageNock = makeGetTagsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load choices from ActionNetwork"
            })
          });

          expect(tagsSecondPageNock.isDone()).toEqual(false);
          expect(eventsSecondPageNock.isDone()).toEqual(false);
          allNocksDone();
          nock.cleanAll();
        });
      });

      describe("when there is an error retrieving the second page of events", () => {
        it("returns an error", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse,
            getTagsStatusCode: 200,
            tagsResponse: getTagsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            getEventsStatusCode: 500,
            eventsResponse: {}
          });

          const tagsSecondPageNock = makeGetTagsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load choices from ActionNetwork"
            })
          });

          eventsSecondPageNock.done();
          tagsSecondPageNock.done();
          allNocksDone();
        });
      });

      describe("when there is an error retrieving the second page of tags", () => {
        it("returns an error", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse,
            getTagsStatusCode: 200,
            tagsResponse: getTagsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const tagsSecondPageNock = makeGetTagsNock({
            page: 2,
            getTagsStatusCode: 500,
            tagsResponse: {}
          });

          const response = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

          expect(response).toEqual({
            data: expect.stringifiedObjectEqualObject({
              error: "Failed to load choices from ActionNetwork"
            })
          });

          tagsSecondPageNock.done();
          eventsSecondPageNock.done();
          allNocksDone();
        });
      });

      describe("when there are more than 4 total pages", () => {
        let additionalTagsResponses = [];
        beforeEach(async () => {
          getTagsResponse.total_pages = 3;
          getTagsResponse.perPage = 2;
          getTagsResponse.total_records = 5;

          // eslint-disable-next-line no-underscore-dangle
          secondPageTagsResponse._embedded["osdi:tags"].push({
            name: "2019 Survey - Worker Stories",
            identifiers: ["action_network:c1f68579-b36b-4d43-8312-204894afbbbb"]
          });

          additionalTagsResponses = [
            {
              total_pages: 3,
              per_page: 2,
              page: 3,
              total_records: 9,
              _embedded: {
                "osdi:tags": [
                  {
                    name: "page 3 tag 1"
                  }
                ]
              }
            }
          ];

          getClientChoiceDataResponse.push(
            ...[
              {
                details: '{"type":"tag","tag":"2019 Survey - Worker Stories"}',
                name: "TAG 2019 Survey - Worker Stories"
              },
              {
                details: '{"type":"tag","tag":"page 3 tag 1"}',
                name: "TAG page 3 tag 1"
              }
            ]
          );
        });

        it("return the jawns from all the pages", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse,
            getTagsStatusCode: 200,
            tagsResponse: getTagsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const tagsSecondPageNock = makeGetTagsNock({
            page: 2,
            statusCode: 200,
            tagsResponse: secondPageTagsResponse
          });

          const additionalPagesNocks = additionalTagsResponses.map(
            (response, index) =>
              makeGetTagsNock({
                page: index + 3,
                statusCode: 200,
                tagsResponse: response
              })
          );
          const clientChoiceData = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          const receivedEvents = JSON.parse(clientChoiceData.data).items;

          expect(ActionNetwork.setTimeoutPromise.mock.calls).toEqual([[1100]]);

          expect(receivedEvents).toEqual(getClientChoiceDataResponse);

          additionalPagesNocks.forEach(pageNock => {
            pageNock.done();
          });
          eventsSecondPageNock.done();
          tagsSecondPageNock.done();
          allNocksDone();
        });
      });
      describe("when there are more than 6 total pages", () => {
        let additionalTagsResponses = [];
        beforeEach(async () => {
          getTagsResponse.total_pages = 5;
          getTagsResponse.perPage = 2;
          getTagsResponse.total_records = 9;

          // eslint-disable-next-line no-underscore-dangle
          secondPageTagsResponse._embedded["osdi:tags"].push({
            name: "2019 Survey - Worker Stories",
            identifiers: ["action_network:c1f68579-b36b-4d43-8312-204894afbbbb"]
          });

          additionalTagsResponses = [
            {
              total_pages: 4,
              per_page: 2,
              page: 3,
              total_records: 9,
              _embedded: {
                "osdi:tags": [
                  {
                    name: "page 3 tag 1"
                  },
                  {
                    name: "page 3 tag 2"
                  }
                ]
              }
            },
            {
              total_pages: 4,
              per_page: 2,
              page: 4,
              total_records: 9,
              _embedded: {
                "osdi:tags": [
                  {
                    name: "page 4 tag 1"
                  },
                  {
                    name: "page 4 tag 2"
                  }
                ]
              }
            },
            {
              total_pages: 4,
              per_page: 2,
              page: 5,
              total_records: 9,
              _embedded: {
                "osdi:tags": [
                  {
                    name: "page 5 tag 1"
                  },
                  {
                    name: "page 5 tag 2"
                  }
                ]
              }
            }
          ];

          getClientChoiceDataResponse.push(
            ...[
              {
                details: '{"type":"tag","tag":"2019 Survey - Worker Stories"}',
                name: "TAG 2019 Survey - Worker Stories"
              },
              {
                details: '{"type":"tag","tag":"page 3 tag 1"}',
                name: "TAG page 3 tag 1"
              },
              {
                details: '{"type":"tag","tag":"page 3 tag 2"}',
                name: "TAG page 3 tag 2"
              },
              {
                details: '{"type":"tag","tag":"page 4 tag 1"}',
                name: "TAG page 4 tag 1"
              },
              {
                details: '{"type":"tag","tag":"page 4 tag 2"}',
                name: "TAG page 4 tag 2"
              },
              {
                details: '{"type":"tag","tag":"page 5 tag 1"}',
                name: "TAG page 5 tag 1"
              },
              {
                details: '{"type":"tag","tag":"page 5 tag 2"}',
                name: "TAG page 5 tag 2"
              }
            ]
          );
        });

        it("return the jawns from all the pages", async () => {
          makeAllNocks({
            getEventsStatusCode: 200,
            eventsResponse: getEventsResponse,
            getTagsStatusCode: 200,
            tagsResponse: getTagsResponse
          });

          const eventsSecondPageNock = makeGetEventsNock({
            page: 2,
            statusCode: 200,
            eventsResponse: secondPageEventsResponse
          });

          const tagsSecondPageNock = makeGetTagsNock({
            page: 2,
            statusCode: 200,
            tagsResponse: secondPageTagsResponse
          });

          const additionalPagesNocks = additionalTagsResponses.map(
            (response, index) =>
              makeGetTagsNock({
                page: index + 3,
                statusCode: 200,
                tagsResponse: response
              })
          );
          const clientChoiceData = await ActionNetwork.getClientChoiceData(
            veryFakeOrganization
          );

          const receivedEvents = JSON.parse(clientChoiceData.data).items;

          expect(ActionNetwork.setTimeoutPromise.mock.calls).toEqual([
            [1100],
            [1100]
          ]);

          expect(receivedEvents).toEqual(getClientChoiceDataResponse);

          additionalPagesNocks.forEach(pageNock => {
            pageNock.done();
          });
          eventsSecondPageNock.done();
          tagsSecondPageNock.done();
          allNocksDone();
        });
      });
    });

    describe("when an event doesn't have a short name", () => {
      beforeEach(async () => {
        // eslint-disable-next-line no-underscore-dangle
        getEventsResponse._embedded["osdi:events"][0].name = undefined;
        getClientChoiceDataResponse[0].name =
          "RSVP Randi Weingarten's Birthday Party";
      });

      it("uses title and returns what we expect", async () => {
        makeAllNocks({
          getEventsStatusCode: 200,
          eventsResponse: getEventsResponse,
          getTagsStatusCode: 200,
          tagsResponse: getTagsResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );

        expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

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
          eventsResponse: getEventsResponse,
          getTagsStatusCode: 200,
          tagsResponse: getTagsResponse
        });

        const clientChoiceData = await ActionNetwork.getClientChoiceData(
          veryFakeOrganization
        );

        expect(ActionNetwork.setTimeoutPromise).not.toHaveBeenCalled();

        const receivedEvents = JSON.parse(clientChoiceData.data).items;
        expect(receivedEvents).toEqual(getClientChoiceDataResponse);

        allNocksDone();
      });
    });
  });
});
