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
          custom_fields: '{"County":"Suffolk"}',
          external_id: "6455083",
          first_name: "Larry",
          last_name: "Foster",
          zip: "89435"
        },
        {
          cell: "+12425544053",
          custom_fields: '{"County":"Nassau"}',
          external_id: "6475967",
          first_name: "Cordelia",
          last_name: "Gagliardi",
          zip: "91571"
        },
        {
          cell: "+17705005813",
          custom_fields: '{"County":"Oneida"}',
          external_id: "6678759",
          first_name: "Zachary",
          last_name: "Chapman",
          zip: "67577"
        },
        {
          cell: "+17659277705",
          custom_fields: '{"County":"Rockland"}',
          external_id: "6687736",
          first_name: "Phoebe",
          last_name: "König",
          zip: "78594"
        },
        {
          cell: "+18309785900",
          custom_fields: '{"County":"Westchester"}',
          external_id: "6687737",
          first_name: "Andrew",
          last_name: "Coli",
          zip: "70521"
        },
        {
          cell: "+18314016718",
          custom_fields: '{"County":"Kings"}',
          external_id: "20700354",
          first_name: "Marion",
          last_name: "Cook",
          zip: "13358"
        },
        {
          cell: "+18028972566",
          custom_fields: '{"County":"Queens"}',
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
            custom_fields: '{"County":"Suffolk"}',
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
