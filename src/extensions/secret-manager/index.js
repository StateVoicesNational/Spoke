import { symmetricDecrypt } from "../../server/api/lib/crypto";

const SECRET_MANAGER_NAME =
  process.env.SECRET_MANAGER || global.SECRET_MANAGER || "default-encrypt";
const SECRET_MANAGER_COMPONENT = getSetup(SECRET_MANAGER_NAME);

function getSetup(name) {
  try {
    const c = require(`./${name}/index.js`);
    return c;
  } catch (err) {
    console.error("SECRET_MANAGER failed to load", name, err);
  }
}

export async function getSecret(name, token, organization) {
  if (token.startsWith(SECRET_MANAGER_NAME)) {
    return await SECRET_MANAGER_COMPONENT.getSecret(
      name,
      token.slice(SECRET_MANAGER_NAME.length + 1),
      organization
    );
  } else {
    // legacy fallback
    return symmetricDecrypt(token);
  }
}

export async function convertSecret(name, organization, secretValue) {
  // returns token, which the caller is still responsible for saving somewhere
  const token = await SECRET_MANAGER_COMPONENT.convertSecret(
    name,
    organization,
    secretValue
  );
  return `${SECRET_MANAGER_NAME}|${token}`;
}
