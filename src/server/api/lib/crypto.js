const crypto = require("crypto");

const secret = process.env.SESSION_SECRET || global.SESSION_SECRET;
const algorithm = "aes-256-cbc";

if (!secret) {
  throw new Error(
    "The SESSION_SECRET environment variable must be set to use crypto functions!"
  );
}

const key = Buffer.concat([Buffer.from(secret)], 32);

const symmetricEncrypt = value => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const symmetricDecrypt = encrypted => {
  let parts = encrypted.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedValue = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedValue);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  symmetricEncrypt,
  symmetricDecrypt
};
