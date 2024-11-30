import { getTwilio } from "../../service-vendors/twilio";

// Nonprofit and Government Guide to A2P 10DLC Text Messaging
// https://support.twilio.com/hc/en-us/articles/4405850570267-Nonprofit-and-Government-Guide-to-A2P-10DLC-Text-Messaging
// API walkthrough
// https://www.twilio.com/docs/sms/a2p-10dlc/onboarding-isv-api
// API setup options
// https://www.twilio.com/docs/sms/a2p-10dlc/onboarding-isv#1-create-a-twilio-business-profile-in-trust-hub
// Messaging Throughput in the US
// https://support.twilio.com/hc/en-us/articles/1260803225669-Message-throughput-MPS-and-Trust-Scores-for-A2P-10DLC-in-the-US

export class TwilioISV {
  constructor({ organization, limit, debug }) {
    this.organization = organization;
    if (!organization || !organization.id) {
      throw new Error("TwilioISV must include organization argument");
    }
    this.limit = limit || 20;
    this.debug = debug;
  }

  async client() {
    if (!this.twilio) {
      this.twilio = await getTwilio(this.organization);
    }
    return this.twilio;
  }

  async getPolicies() {
    const twilio = await this.client();
    const policies = await twilio.trusthub.policies.list({ limit: this.limit });
    if (this.debug) console.log("POLICIES", policies);
    return policies;
  }

  async getPolicySecondary() {
    const twilio = await this.client();
    // hard-coded policy id for secondary policy
    const policy = await twilio.trusthub
      .policies("RNdfbf3fae0e1107f8aded0e7cead80bf5")
      .fetch();
    return policy;
  }

  async getProfiles() {
    const twilio = await this.client();
    const profiles = await twilio.trusthub.customerProfiles.list({
      limit: this.limit
    });
    if (this.debug) console.log("PROFILES", profiles);
    return profiles;
  }

  async getEntityAssignments(trustProductSid) {
    const twilio = await this.client();
    // trustProductSids look like 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    const assignments = await twilio.trusthub
      .trustProducts(trustProductSid)
      .trustProductsEntityAssignments.list({ limit: this.limit });
    if (this.debug) console.log("ASSIGNMENTS", assignments);
    return assignments;
  }

  async getEndUsers() {
    // combination of representatives and address info
    const twilio = await this.client();
    const endUsers = await twilio.trusthub.endUsers.list({ limit: this.limit });
    if (this.debug) console.log("END-USERS", endUsers);
    return endUsers;
  }

  async getBrands() {
    const twilio = await this.client();
    const brands = await twilio.messaging.brandRegistrations.list({
      limit: this.limit
    });
    if (this.debug) {
      console.log(
        "brand uri",
        twilio.messaging.brandRegistrations._uri,
        twilio.messaging.brandRegistrations._version.fetch
      );
      console.log("BRANDS", brands);
    }
    const brandRegContext = twilio.messaging.brandRegistrations;
    await Promise.all(
      brands.map(async bnd => {
        if (bnd.sid) {
          // FUTURE: Vetting SDK then we dont' have to hack this
          const vettingResp = await brandRegContext._version.fetch({
            uri: `${brandRegContext._uri}/${bnd.sid}/Vettings`,
            method: "GET"
          });
          if (vettingResp && vettingResp.data && vettingResp.data.length) {
            bnd.vettings = vettingResp.data;
          }
        }
      })
    );
    return brands;
  }

  async setBrandCampaignVerify({ brandId, campaignVerifyToken }) {
    if (!brandId || !campaignVerifyToken) {
      throw new Error(
        "setBrandCampaignVerify requires brandId and campaignVerifyToken"
      );
    }
    const twilio = await this.client();
    const brandRegContext = twilio.messaging.brandRegistrations;
    // FUTURE: Vetting SDK then we dont' have to hack this
    const vettingResp = await brandRegContext._version.fetch({
      uri: `${brandRegContext._uri}/${brandId}/Vettings`,
      method: "POST",
      data: {
        VettingProvider: "campaign-verify",
        VettingId: campaignVerifyToken
      }
    });
    console.log("setBrandCampaignVerify", vettingResp);
    // Response: (200 OK)
    // {
    // "vettingSid": "VT12445353",
    // "vettingProvider": "campaign-verify",
    // "vettingId":
    // "cv|1.0|tcr|10dlc|9975c339-d46f-49b7-a399-2e6d5ebac66d|EXAMPLEjEd8xSlaAgRXAXXBUNBT2AgL-LdQuPveFhEyY",
    // "vettingClass": "POLITICAL",
    // "vettingStatus": "IN_PROGRESS",
    // "dateCreated": "2021-09-01T20:25:24.258Z",
    // "dateUpdated": "2021-09-01T20:25:24.258Z"
    // }
    // Response: (400 Bad request)
    // {
    // "code": 412,
    // "message": "Campaign verify vetting ID cannot be submitted when import
    // of another vetting ID is in progress"
    // }
    return vettingResp;
  }

  async listUseCases({ brandId, messageServiceSid }) {
    const twilio = await this.client();
    const useCases = await twilio.messaging
      .services(messageServiceSid /*"MG...."*/)
      .usAppToPersonUsecases.fetch({
        brandRegistrationSid: brandId /*"BN..."*/
      });
    // maybe see what current
  }

  async createMessagingUseCase() {
    /*
    await twilio.messaging.services('MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      .usAppToPerson
      .create({
         description: 'Send marketing messages about sales and offers',
         usAppToPersonUsecase: 'MARKETING',
         hasEmbeddedLinks: true,
         hasEmbeddedPhone: true,
         brandRegistrationSid: 'BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
         messageSamples: ['message_samples']
       })
    */
  }
}

// MOCK BRANDS:
// Mock Brands and campaigns expire after 30 days. After the 30 day period, your mock brand will become invalid and expire.
// You cannot delete a mock brand. You must wait until the mock brand expires. Mock Campaigns can be deleted as described above.
// There are no billing events from mock brand or mock campaign creation.

// MOCK BRAND CREATION
// client.messaging.brandRegistrations
//       .create({
//          brandType: 'STARTER',
//          mock: true,
//          customerProfileBundleSid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX0',
//          a2PProfileBundleSid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX1'
//        }).then(brand_registration => console.log(brand_registration.sid));

// A2P CAMPAIGN REGISTRATION
// client.messaging.services('MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
//       .usAppToPerson
//       .create({
//          brandRegistrationSid: 'BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
//          description: 'Send marketing messages about sales and offers',
//          messageSamples: ['Twilio draw the OWL event is ON'],
//          usAppToPersonUsecase: 'STARTER',
//          hasEmbeddedLinks: true,
//          hasEmbeddedPhone: true
//        }).then(us_app_to_person => console.log(us_app_to_person.sid));
//
// A2P CAMPAIGN REMOVAL/DELETION
// client.messaging.services('MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
//                 .usAppToPerson('QE2c6890da8086d771620e9b13fadeba0b')
//                 .remove();
