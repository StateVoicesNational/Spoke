import { accessRequired } from "../errors";
import { clearCacheForOrganization as clearContactLoaderCaches } from "../../../extensions/contact-loaders";
import { clearCacheForOrganization as clearActionHandlerCaches } from "../../../extensions/action-handlers";
import cacheable from "../../../server/models/cacheable_queries";
import { r } from "../../../server/models";

export const clearCachedOrgAndExtensionCaches = async (
  _,
  { organizationId },
  { user }
) => {
  await accessRequired(user, organizationId, "ADMIN", true);

  if (!r.redis) {
    return "Redis not configured. No need to clear organization caches";
  }

  try {
    await cacheable.organization.clear(organizationId);
    await cacheable.organization.load(organizationId);
  } catch (caught) {
    // eslint-disable-next-line no-console
    console.error(`Error while clearing organization cache. ${caught}`);
  }

  const promises = [
    clearActionHandlerCaches(organizationId),
    clearContactLoaderCaches(organizationId)
  ];

  try {
    await Promise.all(promises);
  } catch (caught) {
    // eslint-disable-next-line no-console
    console.error(`Error while clearing extension caches. ${caught}`);
  }

  return "Cleared organization and extension caches";
};
