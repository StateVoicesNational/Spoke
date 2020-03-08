import { r } from "../../../src/server/models";
import {
  setupTest,
  cleanupTest,
  createStartedCampaign
} from "../../test_helpers";
import { finalizeContactLoad } from "../../../src/integrations/contact-loaders/helpers";

const workersJobs = require("../../../src/workers/jobs");

describe("contact-loaders/helpers", () => {
  beforeAll(
    async () => await setupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );
  afterAll(
    async () => await cleanupTest(),
    global.DATABASE_SETUP_TEARDOWN_TIMEOUT
  );

  describe("#finalizeContactLoad", () => {
    let job;
    let contacts;
    let contactCells;
    let campaign;

    beforeEach(async () => {
      const { testCampaign } = await createStartedCampaign();
      campaign = testCampaign;
    });

    beforeEach(async () => {
      job = {
        campaign_id: campaign.id,
        payload: 682951
      };
    });

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    beforeEach(async () => {
      contacts = [
        {
          cell: "+13214028326",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6455083","Address":"627 Wizow Way, Lofaje, DE 89435","StreetAddress":"627 Wizow Way","City":"Lofaje","State":"DE","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(321) 402-8326","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(384) 984-5966","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"D","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "6455083",
          first_name: "Larry",
          last_name: "Foster",
          zip: "89435"
        },
        {
          cell: "+12425544053",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6475967","Address":"902 Jotho Park, Ilibaed, MN 91571","StreetAddress":"902 Jotho Park","City":"Ilibaed","State":"MN","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"(887) 867-3213","IsHomePhoneACellExchange":"0","CellPhone":"(242) 554-4053","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(473) 324-5133","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"D","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "6475967",
          first_name: "Cordelia",
          last_name: "Gagliardi",
          zip: "91571"
        },
        {
          cell: "+17705005813",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6678759","Address":"1229 Dubud Cir, Gujufbik, MA 67577","StreetAddress":"1229 Dubud Cir","City":"Gujufbik","State":"MA","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"(530) 591-9876","IsHomePhoneACellExchange":"0","CellPhone":"(770) 500-5813","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(865) 787-7929","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"O","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "6678759",
          first_name: "Zachary",
          last_name: "Chapman",
          zip: "67577"
        },
        {
          cell: "+17659277705",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6687736","Address":"1660 Tiwa Pike, Owucudji, MD 78594","StreetAddress":"1660 Tiwa Pike","City":"Owucudji","State":"MD","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(765) 927-7705","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(232) 872-2395","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"D","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "6687736",
          first_name: "Phoebe",
          last_name: "König",
          zip: "78594"
        },
        {
          cell: "+18309785900",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6687737","Address":"1820 Kasi Plz, Uhokuicu, NJ 70521","StreetAddress":"1820 Kasi Plz","City":"Uhokuicu","State":"NJ","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(830) 978-5900","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(256) 289-2236","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"R","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "6687737",
          first_name: "Andrew",
          last_name: "Coli",
          zip: "70521"
        },
        {
          cell: "+18314016718",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"20700354","Address":"241 Ozno Sq, Pomizivi, TN 13358","StreetAddress":"241 Ozno Sq","City":"Pomizivi","State":"TN","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(831) 401-6718","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(670) 427-8081","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"R","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "20700354",
          first_name: "Marion",
          last_name: "Cook",
          zip: "13358"
        },
        {
          cell: "+18028972566",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"21681436","Address":"902 Hamze Pl, Biuhke, SC 35341","StreetAddress":"902 Hamze Pl","City":"Biuhke","State":"SC","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(802) 897-2566","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(332) 794-5172","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"R","PollingLocation":"","PollingAddress":"","PollingCity":""}',
          external_id: "21681436",
          first_name: "Bill",
          last_name: "Fiore",
          zip: "35341"
        }
      ];

      contactCells = contacts.map(contact => contact.cell);
    });

    beforeEach(async () => {
      jest
        .spyOn(workersJobs, "completeContactLoad")
        .mockImplementation(() => true);
      jest.spyOn(workersJobs, "getTimezoneByZip");
    });

    it("saves the contacts to the database and calls functions", async () => {
      await finalizeContactLoad(job, contacts);
      expect(workersJobs.completeContactLoad).toHaveBeenCalledTimes(1);
      expect(workersJobs.completeContactLoad.mock.calls[0][0]).toEqual(job);
      expect(workersJobs.completeContactLoad.mock.calls[0][1]).toEqual([]);
      expect(workersJobs.getTimezoneByZip).toHaveBeenCalledTimes(7);

      const cellsToValidate = contacts.map(contact => contact.zip);
      const cellsPassedToGetTimezoneByZip = workersJobs.getTimezoneByZip.mock.calls.map(
        call => call[0]
      );

      expect(cellsPassedToGetTimezoneByZip).toEqual(cellsToValidate);

      const dbContacts = await r
        .knex("campaign_contact")
        .where({
          campaign_id: campaign.id
        })
        .whereIn("cell", contactCells)
        .select();

      expect(dbContacts).toHaveLength(contacts.length);
      expect(dbContacts.map(contact => contact.cell)).toEqual(
        expect.arrayContaining(contactCells)
      );
      dbContacts.forEach(contact => {
        expect(contact.campaign_id).toEqual(Number(job.campaign_id));
        expect(contact.message_status).toEqual("needsMessage");
        expect(contact.timezone_offset).toEqual(expect.stringMatching(/-\d_1/));
      });
    });

    describe("when the campaign has existing contacts", () => {
      it("deletes existing contacts", async () => {
        await finalizeContactLoad(job, contacts);

        const oldDbContacts = await r
          .knex("campaign_contact")
          .where({
            campaign_id: campaign.id
          })
          .whereIn("cell", contactCells)
          .select();

        expect(oldDbContacts).toHaveLength(contacts.length);
        const oldDbContactsIds = oldDbContacts.map(contact => contact.id);
        const maxOldId = Math.max(...oldDbContactsIds);

        await finalizeContactLoad(job, contacts);

        const newDbContacts = await r
          .knex("campaign_contact")
          .where({
            campaign_id: campaign.id
          })
          .whereIn("cell", contactCells)
          .select();

        expect(newDbContacts).toHaveLength(contacts.length);
        const minNewId = Math.min(...newDbContacts.map(contact => contact.id));

        expect(minNewId).toBeGreaterThan(maxOldId);

        const oldContactsCount = await r.getCount(
          r.knex("campaign_contact").whereIn("id", oldDbContactsIds)
        );

        expect(oldContactsCount).toBe(0);
      });
    });

    describe("when maxContacts is specified", () => {
      it("saves no more than the number specified by maxContacts", async () => {
        await finalizeContactLoad(job, contacts, 3);

        const dbContacts = await r
          .knex("campaign_contact")
          .where({
            campaign_id: campaign.id
          })
          .whereIn("cell", contactCells)
          .select();

        expect(dbContacts).toHaveLength(3);
        expect(dbContacts.map(contact => contact.cell)).toEqual(
          expect.arrayContaining(contactCells.slice(0, 3))
        );
      });
    });

    describe("when a contact has no zip", () => {
      beforeEach(async () => {
        contacts = [
          {
            cell: "+13214028326",
            custom_fields:
              '{"CanvassFileRequestID":"1286","VanID":"6455083","Address":"627 Wizow Way, Lofaje, DE 89435","StreetAddress":"627 Wizow Way","City":"Lofaje","State":"DE","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"(321) 402-8326","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(384) 984-5966","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"D","PollingLocation":"","PollingAddress":"","PollingCity":""}',
            external_id: "6455083",
            first_name: "Larry",
            last_name: "Foster"
          }
        ];
      });

      it("skips getTimezoneByZip when there is no zip", async () => {
        await finalizeContactLoad(job, contacts);
        expect(workersJobs.completeContactLoad).toHaveBeenCalledTimes(1);
        expect(workersJobs.completeContactLoad.mock.calls[0][0]).toEqual(job);
        expect(workersJobs.completeContactLoad.mock.calls[0][1]).toEqual([]);
        expect(workersJobs.getTimezoneByZip).not.toHaveBeenCalled();

        const dbContacts = await r
          .knex("campaign_contact")
          .where({
            campaign_id: campaign.id
          })
          .whereIn("cell", contactCells)
          .select();

        expect(dbContacts).toHaveLength(1);
        expect(dbContacts[0].zip).toEqual("");
      });
    });
  });
});
