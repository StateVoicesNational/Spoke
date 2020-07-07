import serviceMap from "../lib/services";
import { accessRequired } from "../errors";
import { getConfig } from "../lib/config";
import { cacheableData } from "../../models";
import { jobRunner } from "../../../integrations/job-runners";
import { Jobs } from "../../../workers/job-processes";

export const buyPhoneNumbers = async (
  _,
  { organizationId, areaCode, limit, addToOrganizationMessagingService },
  { user }
) => {
  await accessRequired(user, organizationId, "OWNER");
  const org = await cacheableData.organization.load(organizationId);
  if (!getConfig("EXPERIMENTAL_PHONE_INVENTORY", org, { truthy: true })) {
    throw new Error("Phone inventory management is not enabled");
  }
  const serviceName = getConfig("DEFAULT_SERVICE", org);
  const service = serviceMap[serviceName];
  if (!service || !service.hasOwnProperty("buyNumbersInAreaCode")) {
    throw new Error(
      `Service ${serviceName} does not support phone number buying`
    );
  }

  let messagingServiceSid;
  if (addToOrganizationMessagingService) {
    const msgSrv = JSON.parse(org.features || "{}").TWILIO_MESSAGE_SERVICE_SID;
    if (serviceName !== "twilio" || !msgSrv) {
      throw new Error(
        "This organization is not configured to use its own Twilio Messaging Service"
      );
    }
    messagingServiceSid = msgSrv;
  }
  return await jobRunner.dispatchJob({
    queue_name: `${organizationId}:buy_phone_numbers`,
    organization_id: organizationId,
    job_type: Jobs.BUY_PHONE_NUMBERS,
    locks_queue: false,
    payload: JSON.stringify({
      areaCode,
      limit,
      messagingServiceSid
    })
  });
};
