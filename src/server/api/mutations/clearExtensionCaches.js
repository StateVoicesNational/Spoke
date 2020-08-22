import { accessRequired } from "../errors";
import { clearCacheForOrganization as clearContactLoaderCaches } from "../../../extensions/contact-loaders";
import { clearCacheForOrganization as clearActionHandlerCaches } from "../../../extensions/action-handlers";
import cacheable from "../../../server/models/cacheable_queries";
import { r } from "../../../server/models";

const handlerMap = {
  "contact-loader": clearContactLoaderCaches,
  "action-handler": clearActionHandlerCaches
};

export const clearExtensionCaches = async (
  _,
  { organizationId, cachesToClear },
  { user }
) => {
  await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);

  const descriptiveString = `Cleared extension caches for organizationId: ${organizationId}: ${(
    cachesToClear || []
  )
    .map(ctc => JSON.stringify(ctc))
    .join(",")}`;

  if (!r.redis) {
    return `Redis not configured. Didn't do this. ${descriptiveString}`;
  }

  await cacheable.organization.clear(organizationId);
  await cacheable.organization.load(organizationId);

  const promises = (cachesToClear || []).map(ctc =>
    handlerMap[ctc.extensionType](ctc.name, organizationId)
  );

  Promise.all(promises)
    .then(() => {
      // eslint-disable-next-line no-console
      console.info(descriptiveString);
    })
    .catch(caught => {
      // eslint-disable-next-line no-console
      console.error(`Error ${caught} while ${descriptiveString}`);
    });

  return descriptiveString;
};
