// csv-upload libs
import {
  displayName,
  available,
  getClientChoiceData,
  processContactLoad
} from "../../../src/integrations/contact-loaders/csv-upload";
import {
  ensureCamelCaseRequiredHeaders,
  CampaignContactsForm
} from "../../../src/integrations/contact-loaders/csv-upload/react-component";

// csv-upload libs for validation
import { unzipPayload } from "../../../src/workers/jobs";
import { gzip } from "../../../src/lib";
const srcLib = require("../../../src/lib/parse_csv");

// server-testing libs
import { r } from "../../../src/server/models/";
import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  sleep
} from "../../test_helpers";

// client-testing libs
import React from "react";
import { shallow, mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { StyleSheetTestUtils } from "aphrodite";
import CampaignContactsChoiceForm from "../../../src/components/CampaignContactsChoiceForm";
import { icons } from "../../../src/components/CampaignContactsChoiceForm";

const contacts = [
  {
    first_name: "asdf",
    last_name: "xxxx",
    cell: "+12125550100",
    zip: "10025",
    custom_fields: '{"custom1": "abc"}'
  }
];

const dupeContacts = [
  {
    first_name: "asdf",
    last_name: "xxxx",
    cell: "+12125550100",
    zip: "10025",
    custom_fields: '{"custom1": "abc"}'
  },
  {
    first_name: "fdsa",
    last_name: "yyyy",
    cell: "+12125550100",
    zip: "10025",
    custom_fields: '{"custom1": "xyz"}'
  }
];

describe("ingest-contact-loader method: csv-upload backend", async () => {
  let testAdminUser;
  let testInvite;
  let testOrganization;
  let testCampaign;
  let organizationId;

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
    // csv-upload should always be available and not depend on any args
    expect(await available()).toEqual({ result: true, expiresSeconds: 0 });
  });
  it("csv-upload:getClientChoiceData success/failure", async () => {
    // csv-upload should be uncomplicated and not depend on any args
    expect(await getClientChoiceData()).toEqual({
      data: "",
      expiresSeconds: 0
    });
  });
  it("csv-upload:processContactLoad success", async () => {
    const job = {
      payload: await gzip(JSON.stringify({ contacts })),
      campaign_id: testCampaign.id,
      job_type: "ingest.csv-upload",
      id: 1
    };
    await processContactLoad(job);
    const dbContacts = await r
      .knex("campaign_contact")
      .where("campaign_id", testCampaign.id);
    expect(dbContacts.length).toBe(1);
    expect(dbContacts[0].first_name).toBe("asdf");
    expect(dbContacts[0].last_name).toBe("xxxx");
    expect(dbContacts[0].custom_fields).toBe('{"custom1": "abc"}');
  });
  it("csv-upload:processContactLoad dedupe", async () => {
    const job = {
      payload: await gzip(JSON.stringify({ contacts: dupeContacts })),
      campaign_id: testCampaign.id,
      job_type: "ingest.csv-upload",
      id: 1
    };
    await processContactLoad(job);
    const dbContacts = await r
      .knex("campaign_contact")
      .where("campaign_id", testCampaign.id);
    const adminResult = await r
      .knex("campaign_admin")
      .where("campaign_id", testCampaign.id)
      .first();
    expect(dbContacts.length).toBe(1);
    expect(adminResult.duplicate_contacts_count).toBe(1);
    expect(adminResult.contacts_count).toBe(1);
    expect(dbContacts[0].first_name).toBe("fdsa");
    expect(dbContacts[0].last_name).toBe("yyyy");
    expect(dbContacts[0].custom_fields).toBe('{"custom1": "xyz"}');
  });
});

describe("ingest-contact-loader method: csv-upload frontend", async () => {
  let didSubmit = false;
  let changeData = null;
  const onSubmit = () => {
    didSubmit = true;
  };
  const onChange = data => {
    changeData = data;
  };
  let wrapper;
  let component;

  beforeEach(async () => {
    StyleSheetTestUtils.suppressStyleInjection();
    wrapper = shallow(
      <CampaignContactsForm
        onChange={onChange}
        onSubmit={onSubmit}
        campaignIsStarted={false}
        icons={icons}
        saveDisabled={false}
        saveLabel={"Save"}
        clientChoiceData={""}
        jobResultMessage={null}
      />
    );
    component = wrapper.instance();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("csv-upload:component updates onChange on upload", async () => {
    didSubmit = false;
    changeData = null;
    component.handleUploadSuccess({ stats: 1 }, contacts, ["custom1"]);
    // wait for it to process.....
    await sleep(15);
    const unzippedData = await unzipPayload({ payload: changeData });
    expect(unzippedData.contacts).toEqual(contacts);
  });
  it("csv-upload:component handles custom fields", async () => {
    didSubmit = false;
    changeData = null;
    const csvData =
      "firstName,lastName,cell,zip,custom_foo,custom_xxx" +
      "\nDolores,Huerta,2095550100,95201,bar,yyy";
    component.handleUpload({
      target: { files: [csvData] },
      preventDefault: () => null
    });
    await sleep(5);
    const unzippedData = await unzipPayload({ payload: changeData });
    expect(JSON.parse(unzippedData.contacts[0].custom_fields)).toEqual({
      custom_foo: "bar",
      custom_xxx: "yyy"
    });
  });
  it("csv-upload:component upload error", async () => {
    didSubmit = false;
    changeData = null;
    // no firstName column declared on-purpose for error
    const csvData =
      "lastName,cell,zip,custom_foo,custom_xxx" +
      "\nDolores,Huerta,2095550100,95201,bar,yyy";
    component.handleUpload({
      target: { files: [csvData] },
      preventDefault: () => null
    });
    await sleep(5);
    // verify state is updated
    expect(component.state.contactUploadError).toBe(
      "Missing fields: firstName"
    );
    // verify it's visible in interface
    expect(wrapper.find("#uploadError").prop("primaryText")).toBe(
      "Missing fields: firstName"
    );
  });
  it("csv-upload:component loads into CampaignContactsChoiceForm", async () => {
    const methodChoices = [
      {
        name: "csv-upload",
        displayName: displayName(),
        clientChoiceData: ""
      }
    ];
    didSubmit = false;
    changeData = null;
    const choiceWrapper = shallow(
      <CampaignContactsChoiceForm
        onChange={onChange}
        ensureComplete={true}
        onSubmit={onSubmit}
        saveDisabled={false}
        saveLabel={"Save"}
        jobResultMessage={"Save"}
        ingestMethodChoices={methodChoices}
      />
    );
    const choiceComponent = choiceWrapper.instance();
    expect(choiceComponent.getCurrentMethod().name).toBe("csv-upload");
    const contactsForm = choiceWrapper.find(CampaignContactsForm);
    expect(contactsForm.props().saveLabel).toBe("Save");
  });
  it("csv-upload:component passes headerTransformer to Papa.parse", async () => {
    didSubmit = false;
    changeData = null;
    jest.spyOn(srcLib, "parseCSV");
    const csvData =
      "firstName,lastName,cell,zip,custom_foo,custom_xxx" +
      "\nDolores,Huerta,2095550100,95201,bar,yyy";
    component.handleUpload({
      target: { files: [csvData] },
      preventDefault: () => null
    });
    await sleep(5);
    expect(srcLib.parseCSV.mock.calls[0][2]).toHaveProperty(
      "headerTransformer"
    );
  });
});

describe("ensureCamelCaseRequiredHeaders", () => {
  it("translates snake_case to camelCase for required fields firstName and lastName", () => {
    expect(ensureCamelCaseRequiredHeaders("first_name")).toEqual("firstName");
    expect(ensureCamelCaseRequiredHeaders("last_name")).toEqual("lastName");
  });

  it("does not translate one-word required fields (specifically, zip) at all", () => {
    expect(ensureCamelCaseRequiredHeaders("zip")).toEqual("zip");
  });

  it("does not translate any other column headers", () => {
    expect(ensureCamelCaseRequiredHeaders("van_id")).toEqual("van_id");
    expect(ensureCamelCaseRequiredHeaders("district")).toEqual("district");
  });

  it("translates CamelCaps to camelCase for required fields firstName and lastName", () => {
    expect(ensureCamelCaseRequiredHeaders("FirstName")).toEqual("firstName");
    expect(ensureCamelCaseRequiredHeaders("LastName")).toEqual("lastName");
  });
});
