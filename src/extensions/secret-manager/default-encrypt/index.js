import { symmetricDecrypt, symmetricEncrypt } from "../crypto";

export async function getSecret(name, token, organization) {
  return symmetricDecrypt(token);
}

export async function convertSecret(name, organization, secretValue) {
  // returns token, which the caller is still responsible for saving somewhere
  return symmetricEncrypt(secretValue);
}
