import assignment from "./assignment";
import campaign from "./campaign";
import campaignContact from "./campaign-contact";
import cannedResponse from "./canned-response";
import organizationContact from "./organization-contact";
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
  organizationContact,
  message,
  optOut,
  organization,
  questionResponse,
  tagCampaignContact,
  user
};

export default cacheableData;
