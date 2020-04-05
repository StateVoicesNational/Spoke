import each from "jest-each";
import nock from "nock";

import requestWithRetry from "../../../src/server/lib/http-request.js";

describe("requestWithRetry", () => {
  let url;
  let path;
  let headers;
  let body;

  beforeEach(async () => {
    url = "http://relisten.net";
    path = "/grateful-dead/1981/03/05/";
    headers = {
      "Content-Type": "application/json"
    };
    body = {
      venue: "Utica Memorial Auditorium",
      city: "Utica",
      state: "NY"
    };
  });

  describe("when the request is a successful get that returns text", () => {
    it("handles the request and returns the text", async () => {
      const nocked = nock(url)
        .get(path)
        .reply(200, "Hello world.");
      const result = await requestWithRetry(`${url}${path}`);
      const received_body = await result.text();
      expect(received_body).toEqual("Hello world.");
      nocked.done();
    });
  });

  describe("when the request is a successful post that returns text", () => {
    it("handles the request and returns the text", async () => {
      const nocked = nock(url, {
        encodedQueryParams: true,
        reqheaders: headers
      })
        .post(path)
        .reply(200, "Nevertheless it was persisted.");

      const result = await requestWithRetry(`${url}${path}`, {
        method: "POST",
        headers,
        body
      });

      const received_body = await result.text();
      expect(received_body).toEqual("Nevertheless it was persisted.");
      nocked.done();
    });
  });

  describe("validateStatus", () => {
    let nocked;
    beforeEach(async () => {
      nocked = nock(url, {
        encodedQueryParams: true,
        reqheaders: headers
      })
        .post(path)
        .reply(201, "Nevertheless it was persisted.");
    });

    describe("successful status validation", () => {
      each([
        ["validateStatus is an integer", 201],
        ["validateStatus is an array", [201]],
        ["validateStatus is an function", status => status === 201]
      ]).test("%s", async (description, validateStatus) => {
        const result = await requestWithRetry(`${url}${path}`, {
          method: "POST",
          headers,
          body,
          validateStatus
        });

        const receivedBody = await result.text();
        expect(receivedBody).toEqual("Nevertheless it was persisted.");
        nocked.done();
      });
    });

    describe("unsuccessful status validation", () => {
      each([
        ["validateStatus is an integer", 200],
        ["validateStatus is an array", [200]],
        ["validateStatus is an function", status => status === 200]
      ]).test("%s", async (description, validateStatus, done) => {
        let error;

        try {
          const result = await requestWithRetry(`${url}${path}`, {
            method: "POST",
            headers,
            body,
            validateStatus
          });
        } catch (err) {
          error = err;
        }

        expect(error).not.toBeUndefined();
        expect(error).toEqual(new Error("Request failed with status code 201"));

        nocked.done();
        done();
      });
    });
  });

  describe.only("when the request times out", () => {
    let nocked;
    beforeEach(async () => {
      nocked = nock(url)
        .get(path)
        .times(1)
        .delay(2000)
        .reply(200);
    });

    it("retries", async () => {
      try {
        const result = await requestWithRetry(`${url}${path}`, {
          method: "GET",
          retries: 0,
          timeout: 1000
        });
        const received_body = await result.text();
        //expect(received_body).toEqual("Hello world.");
      } catch (error) {
        console.log("oh shit", error);
      } finally {
        nocked.done();
      }
    });
  });
});
