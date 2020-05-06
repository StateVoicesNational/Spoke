/*
Based on:
https://github.com/nodejs/node/blob/master/test/parallel/test-crypto-cipheriv-decipheriv.js

Used to encrypt/decrypt values (like auth tokens) before storing them in the
database, using the SESSION_SECRET environment variable as the encryption key.
*/

const crypto = require("crypto");

const secret = process.env.SESSION_SECRET || global.SESSION_SECRET;
const algorithm = "aes-256-cbc";

if (!secret) {
  throw new Error(
    "The SESSION_SECRET environment variable must be set to use crypto functions!"
  );
}

// The encryption key must be exactly 32 (bytes). We pad the SESSION_SECRET to
// 32 characters because in the default development environment it is shorter.
// In production environments the SESSION_SECRET should be a long random sring.
if (secret.length < 32) {
  // eslint-disable-next-line no-console
  console.warn(
    "Using short (insecure) SESSION_SECRET. Fine for testing, bad for production."
  );
}
const key = Buffer.concat([Buffer.from(secret)], 32);

const symmetricEncrypt = value => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, "utf8", "buffer");
  encrypted = Buffer.concat([encrypted, cipher.final("buffer")]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const symmetricDecrypt = encrypted => {
  let parts = encrypted.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedValue = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedValue, "buffer", "utf8");
  return decrypted + decipher.final("utf8");
};

module.exports = {
  symmetricEncrypt,
  symmetricDecrypt
};
