import { getCharCount } from "@trt2/gsm-charset-utils";

import { getConfig, getFeatures } from "../../../server/api/lib/config";

/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "mms-when-cheaper";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "MMS when cheaper",
  description:
    "Often special characters will turn a single-segment message => many segments, driving up the cost which can then exceed the cost of an MMS message (mostly the cost of ~2-3 segments). This extension will switch those messages to use MMS",
  canSpendMoney: true,
  moneySpendingOperations: ["onMessageSend"],
  supportsOrgConfig: false,
  supportsCampaignConfig: false
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign,
  service,
  serviceManagerData
}) {
  let mmsSmsCostRatio = getConfig("COST_RATIO_MMS_SMS", organization);
  if (!mmsSmsCostRatio && service.costData) {
    const costs = service.costData(
      organization,
      (serviceManagerData && serviceManagerData.userNumber) ||
        message.user_number
    );
    if (costs && costs.smsSegment && costs.mmsMessage) {
      mmsSmsCostRatio = costs.mmsMessage / costs.smsSegment;
    }
  }
  if (mmsSmsCostRatio) {
    const measureSegments = getCharCount(message.text).msgCount;
    if (measureSegments && measureSegments > Number(mmsSmsCostRatio)) {
      // It must be strictly greater because MMS also has lower rate-limits
      return { forceMms: true };
    }
  }
  return {};
}
