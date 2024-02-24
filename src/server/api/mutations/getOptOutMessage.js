import optOutMessageCache from "../../models/cacheable_queries/opt-out-message";
import zipStateCache from "../../models/cacheable_queries/zip";

export const getOptOutMessage = async (
  _,
  { organizationId, zip, defaultMessage }
) => {
  try {
    const queryResult = await optOutMessageCache.query({
      organizationId: organizationId,
      state: await zipStateCache.query({ zip: zip })
    });

    return queryResult || defaultMessage;
  } catch (e) {
    console.error(e);
    return defaultMessage;
  }
};
