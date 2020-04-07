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
      ]).test("%s", async (description, validateStatus) => {
        let error;

        try {
          await requestWithRetry(`${url}${path}`, {
            method: "POST",
            headers,
            body,
            validateStatus
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

  describe("when the request times out", () => {
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

    describe("when we don't provide retries and timeout", () => {
      it("uses the defaults, meaning, it won't time out", async () => {
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
    });

    describe("when we don't provide retries", () => {
      it("it does not retry", async () => {
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
    });

    describe("when retries is 0", () => {
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

      describe("when it times out", () => {
        it("it doesn't retry", async () => {
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
});
