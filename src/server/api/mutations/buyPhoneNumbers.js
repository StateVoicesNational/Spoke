import serviceMap from "../../../extensions/service-vendors";
import { accessRequired } from "../errors";
import { getConfig } from "../lib/config";
import { cacheableData } from "../../models";
import { processServiceManagers } from "../../../extensions/service-managers";
import {
  getServiceFromOrganization,
  getServiceNameFromOrganization
} from "../../../extensions/service-vendors";
import { jobRunner } from "../../../extensions/job-runners";
import { Jobs } from "../../../workers/job-processes";

export const buyPhoneNumbers = async (
  _,
  { organizationId, areaCode, limit },
  { user }
) => {
  await accessRequired(user, organizationId, "ADMIN");
  const organization = await cacheableData.organization.load(organizationId);
  if (
    !getConfig("EXPERIMENTAL_PHONE_INVENTORY", organization, {
      truthy: true
    }) &&
    !getConfig("PHONE_INVENTORY", organization, { truthy: true })
  ) {
    throw new Error("Phone inventory management is not enabled");
  }
  const serviceName = getServiceNameFromOrganization(organization);
  const service = getServiceFromOrganization(organization);
  if (!service || !service.hasOwnProperty("buyNumbersInAreaCode")) {
    throw new Error(
      `Service ${serviceName} does not support phone number buying`
    );
  }
  const opts = {};
  const serviceManagerResult = await processServiceManagers(
    "onBuyPhoneNumbers",
    organization,
    {
      user,
      serviceName,
      areaCode,
      limit,
      opts
    }
  );

  return await jobRunner.dispatchJob({
    queue_name: `${organizationId}:buy_phone_numbers`,
    organization_id: organizationId,
    job_type: Jobs.BUY_PHONE_NUMBERS,
    locks_queue: false,
    payload: JSON.stringify({
      areaCode: serviceManagerResult.areaCode || areaCode,
      limit: serviceManagerResult.limit || limit,
      opts: serviceManagerResult.opts || opts
    })
  });
};

export const deletePhoneNumbers = async (
  _,
  { organizationId, areaCode },
  { user }
) => {
  await accessRequired(user, organizationId, "OWNER");
  const organization = await cacheableData.organization.load(organizationId);
  if (
    !getConfig("EXPERIMENTAL_PHONE_INVENTORY", organization, {
      truthy: true
    }) &&
    !getConfig("PHONE_INVENTORY", organization, { truthy: true })
  ) {
    throw new Error("Phone inventory management is not enabled");
  }
  const serviceName = getServiceNameFromOrganization(organization);
  const service = getServiceFromOrganization(organization);
  if (!service || !service.hasOwnProperty("buyNumbersInAreaCode")) {
    throw new Error(
      `Service ${serviceName} does not support phone number buying`
    );
  }

  return await jobRunner.dispatchJob({
    queue_name: `${organizationId}:delete_phone_numbers`,
    organization_id: organizationId,
    job_type: Jobs.DELETE_PHONE_NUMBERS,
    locks_queue: false,
    payload: JSON.stringify({
      areaCode
    })
  });
};
