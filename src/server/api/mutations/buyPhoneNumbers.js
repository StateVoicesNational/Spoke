import serviceMap from "../lib/services";
import { accessRequired } from "../errors";
import { getConfig } from "../lib/config";
import { JobRequest } from "../../models";
import { buyPhoneNumbers as buyNumbersJob } from "../../../workers/jobs";

const JOBS_SAME_PROCESS = !!(
  process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
);

export const buyPhoneNumbers = async (
  _,
  { organizationId, areaCode, limit, addToOrganizationMessagingService },
  { loaders, user }
) => {
  await accessRequired(user, organizationId, "OWNER");
  const org = await loaders.organization.load(organizationId);
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
  const job = await JobRequest.save({
    queue_name: `${organizationId}:buy_phone_numbers`,
    organization_id: organizationId,
    job_type: "buy_phone_numbers",
    locks_queue: false,
    assigned: JOBS_SAME_PROCESS,
    payload: JSON.stringify({
      areaCode,
      limit,
      messagingServiceSid
    })
  });
  if (JOBS_SAME_PROCESS) {
    buyNumbersJob(job);
  }
  return job;
};
