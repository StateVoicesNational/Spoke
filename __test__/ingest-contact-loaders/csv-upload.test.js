// csv-upload libs
import { displayName, available, getClientChoiceData, processContactLoad } from "../../src/ingest-contact-loaders/csv-upload";
import { CampaignContactsForm } from "../../src/ingest-contact-loaders/csv-upload/react-component";

// csv-upload libs for validation
import { unzipPayload } from "../../src/workers/jobs";
import { parseCSV, gzip } from "../../src/lib";

// server-testing libs
import { r } from "../../src/server/models/";
import {
  setupTest,
  cleanupTest,
  runComponentGql,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  saveCampaign,
} from "../test_helpers";

// client-testing libs
import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import CampaignContactsChoiceForm from "../../src/components/CampaignContactsChoiceForm";
import { icons } from "../../src/components/CampaignContactsChoiceForm";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let testAdminUser;
let testInvite;
let testOrganization;
let testCampaign;
let organizationId;

const NUMBER_OF_CONTACTS = 100;


describe("ingest-contact-loader method: csv-upload backend", async () => {
  beforeEach(async () => {
    // Set up an entire working campaign
    await setupTest();
    testAdminUser = await createUser();
    testInvite = await createInvite();
    testOrganization = await createOrganization(testAdminUser, testInvite);
    organizationId = testOrganization.data.createOrganization.id;
    testCampaign = await createCampaign(testAdminUser, testOrganization);
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("csv-upload:available success/failure", async () => {
  });
  it("csv-upload:getClientChoiceData success/failure", async () => {
  });
  it("csv-upload:processContactLoad success", async () => {
  });
  it("csv-upload:processContactLoad dedupe", async () => {
  });
});

describe("ingest-contact-loader method: csv-upload frontend", async () => {
  it("csv-upload:component updates onChange on upload", async () => {
    let didSubmit = false;
    let changeData = null;
    const onSubmit = () => { didSubmit = true; }
    const onChange = (data) => { changeData = data; }
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = shallow(<CampaignContactsForm
                              onChange={onChange}
                              onSubmit={onSubmit}
                              campaignIsStarted={false}
                              icons={icons}
                              saveDisabled={false}
                              saveLabel={"Save"}
                              clientChoiceData={""}
                              jobResultMessage={null}
                            />);
    const component = wrapper.instance();
    console.log('CampaignContactsForm wrapper', component, changeData);
    const contacts = [{first_name: 'asdf', last_name: 'xxxx', cell: '+12125550100', zip: '10025',
                       custom_fields: '{"custom1": "abc"}'}];
    component.handleUploadSuccess({stats: 1}, contacts, ["custom1"]);
    // wait for it to process.....
    await sleep(5);
    console.log('after success', changeData);
    const unzippedData = await unzipPayload({payload: changeData});
    console.log('unzipped', unzippedData);
  });
  it("csv-upload:component handles custom fields", async () => {
  });
  it("csv-upload:component upload error", async () => {
  });
  it("csv-upload:component loads into CampaignContactsChoiceForm", async () => {
    const methodChoices = [{
      name: "csv-upload",
      displayName: displayName(),
      clientChoiceData: ""
    }]
    let didSubmit = false;
    let changeData = null;
    const onSubmit = () => { didSubmit = true; }
    const onChange = (data) => { changeData = data; }
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = shallow(<CampaignContactsChoiceForm
                              onChange={onChange}
                              ensureComplete={true}
                              onSubmit={onSubmit}
                              saveDisabled={false}
                              saveLabel={"Save"}
                              jobResultMessage={"Save"}
                              ingestMethodChoices={methodChoices}
                            />);
    const component = wrapper.instance();
    expect(component.getCurrentMethod().name).toBe("csv-upload");
  });
});
