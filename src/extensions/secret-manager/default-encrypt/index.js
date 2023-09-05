import { symmetricDecrypt, symmetricEncrypt } from "../crypto";

export async function getSecret(name, token, organization) {
  try {
    return symmetricDecrypt(token);
  } catch (e) {
    // Can't decrypt, return value as-is.
    return token;
  }
}

export async function convertSecret(name, organization, secretValue) {
  // returns token, which the caller is still responsible for saving somewhere
  return symmetricEncrypt(secretValue);
}
