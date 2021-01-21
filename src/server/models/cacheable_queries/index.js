import assignment from "./assignment";
import campaign from "./campaign";
import campaignContact from "./campaign-contact";
import cannedResponse from "./canned-response";
import contactUserNumber from "./contact-user-number";
import message from "./message";
import optOut from "./opt-out";
import organization from "./organization";
import questionResponse from "./question-response";
import { tagCampaignContactCache as tagCampaignContact } from "./tag-campaign-contact";
import user from "./user";

const cacheableData = {
  assignment,
  campaign,
  campaignContact,
  cannedResponse,
  contactUserNumber,
  message,
  optOut,
  organization,
  questionResponse,
  tagCampaignContact,
  user
};

export default cacheableData;
