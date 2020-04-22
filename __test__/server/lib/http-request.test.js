import each from "jest-each";
import nock from "nock";

import requestWithRetry from "../../../src/server/lib/http-request.js";

describe("requestWithRetry", async () => {
  let url;
  let path;
  let headers;
  let body;

  beforeEach(() => {
    url = "https://example.com";
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

  it("handles the get request and returns the text", async () => {
    const nocked = nock(url)
      .get(path)
      .reply(200, "Hello world.");
    const result = await requestWithRetry(`${url}${path}`);
    const received_body = await result.text();
    expect(received_body).toEqual("Hello world.");
    nocked.done();
  });

  it("handles a post request and returns the text", async () => {
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

  describe("validate status", async () => {
    let nocked;
    beforeEach(async () => {
      nocked = nock(url, {
        encodedQueryParams: true,
        reqheaders: headers
      })
        .post(path)
        .reply(201, "Nevertheless it was persisted.");
    });

    describe("successful status validation", async () => {
      it("validStatuses is provided", async () => {
        const result = await requestWithRetry(`${url}${path}`, {
          method: "POST",
          headers,
          body,
          validStatuses: [201]
        });

        const receivedBody = await result.text();
        expect(receivedBody).toEqual("Nevertheless it was persisted.");
        nocked.done();
      });

      it("statusValidatioFunction is provided", async () => {
        const result = await requestWithRetry(`${url}${path}`, {
          method: "POST",
          headers,
          body,
          statusValidationFunction: status => status === 201
        });

        const receivedBody = await result.text();
        expect(receivedBody).toEqual("Nevertheless it was persisted.");
        nocked.done();
      });
    });

    describe("unsuccessful status validation", async () => {
      it("validStatuses is provided", async () => {
        let error;

        try {
          await requestWithRetry(`${url}${path}`, {
            method: "POST",
            headers,
            body,
            validStatusesL: [200]
          });
        } catch (err) {
          error = err;
        }

        expect(error).not.toBeUndefined();
        expect(error.toString()).toMatch(
          /Error: Request id .+ failed; received status 201/
        );

        nocked.done();
      });

      it("statusValidationFunction is provided", async () => {
        let error;

        try {
          await requestWithRetry(`${url}${path}`, {
            method: "POST",
            headers,
            body,
            statusValidationFunction: status => status === 200
          });
        } catch (err) {
          error = err;
        }

        expect(error).not.toBeUndefined();
        expect(error.toString()).toMatch(
          /Error: Request id .+ failed; received status 201/
        );

        nocked.done();
      });
    });
  });

  describe("when the request times out", async () => {
    it("retries", async () => {
      let error;
      const nocked = nock(url)
        .get(path)
        .times(4)
        .delay(1000)
        .reply(200);
      try {
        await requestWithRetry(`${url}${path}`, {
          method: "GET",
          retries: 3,
          timeout: 500
        });
      } catch (caughtException) {
        error = caughtException;
      } finally {
        expect(error.toString()).toMatch(
          /Error: Request id .+ failed; all 3 retries exhausted/
        );
        nocked.done();
      }
    });

    it("when we don't provide retries and timeout uses the defaults, meaning, it won't time out", async () => {
      let error;
      const nocked = nock(url)
        .get(path)
        .times(1)
        .delay(1000)
        .reply(200);
      try {
        await requestWithRetry(`${url}${path}`, {
          method: "GET"
        });
      } catch (caughtException) {
        error = caughtException;
      } finally {
        expect(error).not.toEqual(expect.anything());
        nocked.done();
      }
    });

    it("it does not retry by default", async () => {
      let error;
      const nocked = nock(url)
        .get(path)
        .times(1)
        .delay(1000)
        .reply(200);
      try {
        await requestWithRetry(`${url}${path}`, {
          method: "GET",
          timeout: 500
        });
      } catch (caughtException) {
        error = caughtException;
      } finally {
        expect(error.toString()).toMatch(
          /Error: Request id .+ failed; timeout after 500ms/
        );
        nocked.done();
      }
    });

    describe("when retries is 0", async () => {
      let error;
      it("it doesn't retry", async () => {
        const nocked = nock(url)
          .get(path)
          .reply(500);
        try {
          await requestWithRetry(`${url}${path}`, {
            method: "GET",
            retries: 0
          });
        } catch (caughtException) {
          error = caughtException;
        } finally {
          expect(error.toString()).toMatch(
            /Error: Request id .+ failed; received status 500/
          );
          nocked.done();
        }
      });

      it("timeout doesn't retry", async () => {
        const nocked = nock(url)
          .get(path)
          .delay(1000)
          .reply(500);
        try {
          await requestWithRetry(`${url}${path}`, {
            method: "GET",
            timeout: 100,
            retries: 0
          });
        } catch (caughtException) {
          error = caughtException;
        } finally {
          expect(error.toString()).toMatch(
            /Error: Request id .+ failed; timeout after 100ms/
          );
          nocked.done();
        }
      });
    });
  });
});
