import crypto from "../../../../src/server/api/lib/crypto";

beforeEach(() => {
  jest.resetModules();
});

it("encrypted value should be different", () => {
  const plaintext = "test_auth_token";
  const encrypted = crypto.symmetricEncrypt(plaintext);
  expect(encrypted).not.toEqual(plaintext);
});

it("decrypted value should match original", () => {
  const plaintext = "another_test_auth_token";
  const encrypted = crypto.symmetricEncrypt(plaintext);
  const decrypted = crypto.symmetricDecrypt(encrypted);
  expect(decrypted).toEqual(plaintext);
});

it("session secret must exist", () => {
  function encrypt() {
    delete global.SESSION_SECRET;
    const crypto2 = require("../../../../src/server/api/lib/crypto");
    const plaintext = "foo";
    const encrypted = crypto2.symmetricEncrypt(plaintext);
  }
  expect(encrypt).toThrowError(
    "The SESSION_SECRET environment variable must be set to use crypto functions!"
  );
});
