import each from "jest-each";
import nock from "nock";
import {
  getCellFromRow,
  getZipFromRow,
  makeRowTransformer,
  processContactLoad,
  handleFailedContactLoad,
  getClientChoiceData,
  available
} from "../../../../src/integrations/contact-loaders/ngpvan";

import { CampaignContactsForm } from "../../../../src/integrations/contact-loaders/ngpvan/react-component";

const config = require("../../../../src/server/api/lib/config");
const csvParser = require("../../../../src/workers/parse_csv");
const ngpvan = require("../../../../src/integrations/contact-loaders/ngpvan");
const helpers = require("../../../../src/integrations/contact-loaders/helpers");
const jobs = require("../../../../src/workers/jobs");

// client-testing libs
import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import { icons } from "../../../../src/components/CampaignContactsChoiceForm";

describe("ngpvan", () => {
  let fakeNgpVanBaseApiUrl;
  beforeEach(async () => {
    fakeNgpVanBaseApiUrl = "https://www.relisten.com";
  });

  describe("#available", () => {
    let oldNgpVanWebhookUrl;
    let oldNgpVanAppName;
    let oldNgpVanApiKey;

    beforeEach(async () => {
      oldNgpVanWebhookUrl = process.env.NGP_VAN_WEBHOOK_BASE_URL;
      oldNgpVanAppName = process.env.NGP_VAN_APP_NAME;
      oldNgpVanApiKey = process.env.NGP_VAN_API_KEY;
      process.env.NGP_VAN_WEBHOOK_BASE_URL = "https://www.example.com";
      process.env.NGP_VAN_APP_NAME = "spoke";
      process.env.NGP_VAN_API_KEY = "topsecret";
    });

    afterEach(async () => {
      process.env.NGP_VAN_WEBHOOK_BASE_URL = oldNgpVanWebhookUrl;
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
      delete process.env.NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION;
    });

    it("returns true when all required environment variables are present", async () => {
      expect(await available()).toEqual({
        result: true,
        expiresSeconds: 86400
      });
    });

    describe("when one of the environment variables is missing", () => {
      beforeEach(async () => {
        delete process.env.NGP_VAN_APP_NAME;
      });

      it("returns false", async () => {
        expect(await available()).toEqual({
          result: false,
          expiresSeconds: 86400
        });
      });
    });
  });

  describe("#getClientChoiceData", () => {
    let oldMaximumListSize;
    let oldNgpVanApiKey;
    let oldNgpVanAppName;
    let oldNgpVanCacheTtl;
    let oldNgpVanApiBaseUrl;
    let listItems;

    beforeEach(async () => {
      oldMaximumListSize = process.env.NGP_VAN_MAXIMUM_LIST_SIZE;
      oldNgpVanAppName = process.env.NGP_VAN_APP_NAME;
      oldNgpVanApiKey = process.env.NGP_VAN_API_KEY;
      oldNgpVanCacheTtl = process.env.NGP_VAN_CACHE_TTL;
      oldNgpVanApiBaseUrl = process.env.NGP_VAN_API_BASE_URL;
      process.env.NGP_VAN_MAXIMUM_LIST_SIZE = 20;
      process.env.NGP_VAN_APP_NAME = "spoke";
      process.env.NGP_VAN_API_KEY = "topsecret";
      process.env.NGP_VAN_CACHE_TTL = 30;
      process.env.NGP_VAN_API_BASE_URL = fakeNgpVanBaseApiUrl;
    });

    beforeEach(async () => {
      listItems = [
        {
          savedListId: 682913,
          name: "200-220 W 103",
          description: null,
          listCount: 171,
          doorCount: 127
        },
        {
          savedListId: 682951,
          name: "East Gate Lane",
          description: "Voters on East Gate Lane",
          listCount: 32,
          doorCount: 21
        },
        {
          savedListId: 682993,
          name: "17-year olds",
          description: null,
          listCount: 269,
          doorCount: 266
        },
        {
          savedListId: 683013,
          name: "W103",
          description: null,
          listCount: 63,
          doorCount: 44
        },
        {
          savedListId: 683399,
          name: "17 Year Olds",
          description: null,
          listCount: 266,
          doorCount: 263
        }
      ];
    });

    afterEach(async () => {
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
      process.env.NGP_VAN_MAXIMUM_LIST_SIZE = oldMaximumListSize;
      process.env.NGP_VAN_API_BASE_URL = oldNgpVanApiBaseUrl;
      process.env.NGP_VAN_CACHE_TTL = oldNgpVanCacheTtl;
      jest.restoreAllMocks();
    });

    it("returns what we expect", async () => {
      const getSavedListsNock = nock(`${fakeNgpVanBaseApiUrl}:443`, {
        encodedQueryParams: true,
        reqheaders: {
          authorization: "Basic c3Bva2U6dG9wc2VjcmV0fDA="
        }
      })
        .get(
          `/v4/savedLists?$top=&maxPeopleCount=${process.env.NGP_VAN_MAXIMUM_LIST_SIZE}`
        )
        .reply(200, {
          items: listItems,
          nextPageLink: null,
          count: 5
        });
      const savedListsResponse = await getClientChoiceData();

      expect(JSON.parse(savedListsResponse.data).items).toEqual(listItems);
      expect(savedListsResponse.expiresSeconds).toEqual(30);
      getSavedListsNock.done();
    });

    describe("when there is an error retrieving the list", () => {
      it("returns what we expect", async () => {
        const getSavedListsNock = nock(`${fakeNgpVanBaseApiUrl}:443`, {
          encodedQueryParams: true,
          reqheaders: {
            authorization: "Basic c3Bva2U6dG9wc2VjcmV0fDA="
          }
        })
          .get(
            `/v4/savedLists?$top=&maxPeopleCount=${process.env.NGP_VAN_MAXIMUM_LIST_SIZE}`
          )
          .reply(404);

        const savedListsResponse = await getClientChoiceData();

        expect(JSON.parse(savedListsResponse.data)).toEqual({
          error: expect.stringMatching(
            /Error retrieving saved list metadata from VAN Error: Request id .+ failed; received status 404/
          )
        });
        getSavedListsNock.done();
      });
    });
  });

  describe("@processContactLoad", () => {
    let job;
    let payload;
    let maxContacts;
    let csvReply;
    let oldNgpVanWebhookUrl;
    let oldNgpVanExportJobTypeId;
    let oldNgpVanAppName;
    let oldNgpVanApiKey;
    let makeSuccessfulExportJobPostNock;
    let makeSuccessfulGetCsvNock;
    let webhookUrl;
    let oldNgpVanApiBaseUrl;
    let organization;

    beforeEach(async () => {
      oldNgpVanWebhookUrl = process.env.NGP_VAN_WEBHOOK_BASE_URL;
      oldNgpVanExportJobTypeId = process.env.NGP_VAN_EXPORT_JOB_TYPE_ID;
      oldNgpVanAppName = process.env.NGP_VAN_APP_NAME;
      oldNgpVanApiKey = process.env.NGP_VAN_API_KEY;
      oldNgpVanApiBaseUrl = process.env.NGP_VAN_API_BASE_URL;
      process.env.NGP_VAN_WEBHOOK_BASE_URL = "https://www.example.com";
      process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = 7;
      process.env.NGP_VAN_APP_NAME = "spoke";
      process.env.NGP_VAN_API_KEY = "topsecret";
      process.env.NGP_VAN_API_BASE_URL = fakeNgpVanBaseApiUrl;
    });

    beforeEach(async () => {
      payload = {
        savedListId: 682951,
        savedListName: "democrats on 103rd Street"
      };

      job = {
        id: 7,
        campaign_id: 1,
        payload: JSON.stringify(payload)
      };

      organization = {
        id: 77,
        name: "What good shall I do today?"
      };
    });

    beforeEach(async () => {
      csvReply = `CanvassFileRequestID,VanID,Address,FirstName,LastName,StreetAddress,City,State,ZipOrPostal,County,Employer,Occupation,Email,HomePhone,IsHomePhoneACellExchange,CellPhone,WorkPhone,IsWorkPhoneACellExchange,Phone,OptInPhone,OptInStatus,OptInPhoneType,CongressionalDistrict,StateHouse,StateSenate,Party,PollingLocation,PollingAddress,PollingCity
1286,6144436,"1749 Kori Ter, Ranbelsi, SC 02569",Jean,Leclerc,1749 Kori Ter,Ranbelsi,SC,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,6144439,"169 Unnag St, Fekokmuw, NM 15043",Sophia,Robinson,169 Unnag St,Fekokmuw,NM,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,6409040,"50 Vichad Path, Bapherte, DC 07893",Bobby,Barber,50 Vichad Path,Bapherte,DC,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,6455083,"627 Wizow Way, Lofaje, DE 89435",Larry,Foster,627 Wizow Way,Lofaje,DE,,Suffolk,,,,,,3214028326,,,(384) 984-5966,,,,001,004,002,D,,,
1286,6475967,"902 Jotho Park, Ilibaed, MN 91571",Cordelia,Gagliardi,902 Jotho Park,Ilibaed,MN,,Suffolk,,,,(887) 867-3213,0,(242) 554-4053,,,(473) 324-5133,,,,001,004,002,D,,,
1286,6678759,"1229 Dubud Cir, Gujufbik, MA 67577",Zachary,Chapman,1229 Dubud Cir,Gujufbik,MA,,Suffolk,,,,(530) 591-9876,0,(770) 500-5813,,,(865) 787-7929,,,,001,004,002,O,,,
1286,6687736,"1660 Tiwa Pike, Owucudji, MD 78594",Phoebe,König,1660 Tiwa Pike,Owucudji,MD,,Suffolk,,,,,,(765) 927-7705,,,(232) 872-2395,,,,001,004,002,D,,,
1286,6687737,"1820 Kasi Plz, Uhokuicu, NJ 70521",Andrew,Coli,1820 Kasi Plz,Uhokuicu,NJ,,Suffolk,,,,,,(830) 978-5900,,,(256) 289-2236,,,,001,004,002,R,,,
1286,6740265,"1864 Pohe Path, Lahutci, IA 21134",Francis,Anderson,1864 Pohe Path,Lahutci,IA,,Suffolk,,,,(229) 403-7155,0,,,,(839) 862-7352,,,,001,004,002,R,,,
1286,6848857,"296 Bilez Sq, Efabodgun, NC 26984",Florence,Adkins,296 Bilez Sq,Efabodgun,NC,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,6870533,"701 Zetli Plz, Nuwdope, CA 62375",Leona,Orsini,701 Zetli Plz,Nuwdope,CA,,Suffolk,,,,(968) 346-8020,0,,,,(874) 366-8307,,,,001,004,002,R,,,
1286,15597061,"1591 Zuote Rdg, Pudugpu, MA 56190",Francis,Reyes,1591 Zuote Rdg,Pudugpu,MA,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,19680982,"588 Pinovu Path, Notjuap, WV 59864",Isaac,Stefani,588 Pinovu Path,Notjuap,WV,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,20700354,"241 Ozno Sq, Pomizivi, TN 13358",Marion,Cook,241 Ozno Sq,Pomizivi,TN,,Suffolk,,,,,,(831) 401-6718,,,(670) 427-8081,,,,001,004,002,R,,,
1286,21681436,"902 Hamze Pl, Biuhke, SC 35341",Bill,Fiore,902 Hamze Pl,Biuhke,SC,,Suffolk,,,,,,(802) 897-2566,,,(332) 794-5172,,,,001,004,002,R,,,
1286,21934451,"1956 Occom Gln, Sodtehu, KY 19566",Lou,Houston,1956 Occom Gln,Sodtehu,KY,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,25642789,"1785 Momo Pl, Rivpowu, NM 06235",Glen,Ortega,1785 Momo Pl,Rivpowu,NM,,Suffolk,,,,(259) 861-5321,0,,,,(550) 615-1936,,,,001,004,002,D,,,
1286,26022837,"732 Huwtu Loop, Gujoboba, LA 77281",Sophie,Borghi,732 Huwtu Loop,Gujoboba,LA,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,26508704,"437 Vifnu Path, Luwpuvmon, IN 15340",Cameron,George,437 Vifnu Path,Luwpuvmon,IN,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,26850518,"1214 Lako Ctr, Foduwal, OR 68000",Jerry,Khan,1214 Lako Ctr,Foduwal,OR,,Suffolk,,,,,,,,,,,,,001,004,002,U,,,
`;
    });

    beforeEach(async () => {
      makeSuccessfulGetCsvNock = () =>
        nock("https://ngpvan.blob.core.windows.net:443", {
          encodedQueryParams: true
        })
          .get("/pii.csv")
          .reply(200, csvReply, [
            "Content-Length",
            "5099",
            "Content-Type",
            "application/octet-stream",
            "Content-MD5",
            "PmcLuVB3RZGoGcJ3NLF9wA=="
          ]);
    });

    beforeEach(async () => {
      webhookUrl = `"https://www.example.com/ingest-data/ngpvan/${
        job.id
      }/${maxContacts || 0}/682951"`;
    });

    beforeEach(async () => {
      makeSuccessfulExportJobPostNock = (status, errorCode) =>
        nock(`${fakeNgpVanBaseApiUrl}:443`, {
          encodedQueryParams: true,
          reqheaders: {
            authorization: "Basic c3Bva2U6dG9wc2VjcmV0fDA="
            //   "accept-encoding": ["gzip,deflate"],
            //   "user-agent": [
            //     "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"
            //   ],
            //   connection: ["close"],
            //   accept: ["|)}>#*"]
          }
        })
          .post(
            "/v4/exportJobs",
            `{"savedListId":682951,"type":"7","webhookUrl":${webhookUrl}}`
          )
          .reply(201, {
            surveyQuestions: null,
            activistCodes: null,
            customFields: null,
            districtFields: null,
            canvassFileRequestId: 1286,
            exportJobId: 1286,
            canvassFileRequestGuid: "260ca0f4-7a74-d962-749f-685259ac61b2",
            exportJobGuid: "260ca0f4-7a74-d962-749f-685259ac61b2",
            savedListId: 682951,
            webhookUrl,
            downloadUrl: "https://ngpvan.blob.core.windows.net:443/pii.csv",
            status,
            type: 3,
            dateExpired: "2020-02-27T05:35:51.9364193Z",
            errorCode: errorCode || null
          });
    });

    beforeEach(async () => {
      jest.spyOn(csvParser, "parseCSVAsync");
      jest.spyOn(helpers, "finalizeContactLoad").mockImplementation(() => true);
      jest
        .spyOn(ngpvan, "handleFailedContactLoad")
        .mockImplementation(() => true);
      jest.spyOn(config, "getConfig");
      jest.spyOn(ngpvan, "makeRowTransformer");
    });

    afterEach(async () => {
      process.env.NGP_VAN_WEBHOOK_BASE_URL = oldNgpVanWebhookUrl;
      process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = oldNgpVanExportJobTypeId;
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
      process.env.NGP_VAN_API_BASE_URL = oldNgpVanApiBaseUrl;
      jest.restoreAllMocks();
    });

    it("calls the api and its dependencies", async () => {
      const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
      const getCsvNock = makeSuccessfulGetCsvNock();

      await processContactLoad(job, maxContacts, organization);
      expect(ngpvan.makeRowTransformer.mock.calls).toEqual([[false]]);

      expect(csvParser.parseCSVAsync).toHaveBeenCalledTimes(1);

      expect(csvParser.parseCSVAsync).toBeCalledWith(
        csvReply,
        expect.objectContaining({
          rowTransformer: expect.any(Function),
          headerTransformer: expect.any(Function)
        })
      );

      expect(helpers.finalizeContactLoad).toHaveBeenCalledTimes(1);
      expect(helpers.finalizeContactLoad.mock.calls[0][0]).toEqual(job);
      expect(helpers.finalizeContactLoad.mock.calls[0][1]).toEqual([
        {
          cell: "+13214028326",
          custom_fields:
            '{"CanvassFileRequestID":"1286","VanID":"6455083","Address":"627 Wizow Way, Lofaje, DE 89435","StreetAddress":"627 Wizow Way","City":"Lofaje","State":"DE","ZipOrPostal":"","County":"Suffolk","Employer":"","Occupation":"","Email":"","HomePhone":"","IsHomePhoneACellExchange":"","CellPhone":"3214028326","WorkPhone":"","IsWorkPhoneACellExchange":"","Phone":"(384) 984-5966","OptInPhone":"","OptInStatus":"","OptInPhoneType":"","CongressionalDistrict":"001","StateHouse":"004","StateSenate":"002","Party":"D","PollingLocation":"","PollingAddress":"","PollingCity":""}',
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
      ]);

      expect(config.getConfig.mock.calls).toEqual([
        ["NGP_VAN_WEBHOOK_BASE_URL", organization],
        ["NGP_VAN_API_BASE_URL", organization],
        ["NGP_VAN_APP_NAME", organization],
        ["NGP_VAN_API_KEY", organization],
        ["NGP_VAN_EXPORT_JOB_TYPE_ID", organization],
        ["NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION", organization]
      ]);

      exportJobsNock.done();
      getCsvNock.done();
    });

    describe("when NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION is set to true", () => {
      beforeEach(async () => {
        process.env.NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION = "true";
      });

      it("calls the api and its dependencies", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
        const getCsvNock = makeSuccessfulGetCsvNock();

        await processContactLoad(job, maxContacts, organization);
        expect(ngpvan.makeRowTransformer.mock.calls).toEqual([[true]]);

        exportJobsNock.done();
        getCsvNock.done();
      });
    });

    describe("when NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION is set to anything other than true", () => {
      beforeEach(async () => {
        process.env.NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION = "waffles";
      });

      it("calls the api and its dependencies", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
        const getCsvNock = makeSuccessfulGetCsvNock();

        await processContactLoad(job, maxContacts, organization);
        expect(ngpvan.makeRowTransformer.mock.calls).toEqual([[false]]);

        exportJobsNock.done();
        getCsvNock.done();
      });
    });

    describe("when the POST to exportJobs succeeds but returns status !== Error and status !== Completed", () => {
      beforeEach(async () => {
        csvParser.parseCSVAsync.mockRestore();
        jest.spyOn(csvParser, "parseCSVAsync");

        csvReply = "";
      });

      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Requested");

        await processContactLoad(job, maxContacts, organization);
        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [
            job,
            payload,
            "Unexpected response when requesting VAN export job. VAN returned status Requested"
          ]
        ]);

        expect(csvParser.parseCSVAsync).not.toHaveBeenCalled();

        exportJobsNock.done();
      });
    });

    describe("when the POST to exportJobs succeeds but returns status === Error", () => {
      beforeEach(async () => {
        csvParser.parseCSVAsync.mockRestore();
        jest.spyOn(csvParser, "parseCSVAsync");

        csvReply = "";
      });

      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Error", 777);

        await processContactLoad(job, maxContacts, organization);
        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [
            job,
            payload,
            "Error requesting VAN export job. VAN returned error code 777"
          ]
        ]);

        expect(csvParser.parseCSVAsync).not.toHaveBeenCalled();

        exportJobsNock.done();
      });
    });

    describe("when there are no contacts in the VAN list", () => {
      beforeEach(async () => {
        csvParser.parseCSVAsync.mockRestore();
        jest.spyOn(csvParser, "parseCSVAsync").mockResolvedValue({
          validationStats: {},
          contacts: []
        });

        csvReply =
          "CanvassFileRequestID,VanID,Address,FirstName,LastName,StreetAddress,City,State,ZipOrPostal,County,Employer,Occupation,Email,HomePhone,IsHomePhoneACellExchange,CellPhone,WorkPhone,IsWorkPhoneACellExchange,Phone,OptInPhone,OptInStatus,OptInPhoneType,CongressionalDistrict,StateHouse,StateSenate,Party,PollingLocation,PollingAddress,PollingCity";
      });

      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
        const getCsvNock = makeSuccessfulGetCsvNock();

        await processContactLoad(job, maxContacts, organization);
        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [job, payload, "No contacts ingested. Check the selected list."]
        ]);
        exportJobsNock.done();
        getCsvNock.done();
      });
    });

    describe("when POST to exportJobs fails", () => {
      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = nock(`${fakeNgpVanBaseApiUrl}:443`, {
          encodedQueryParams: true,
          reqheaders: {
            authorization: "Basic c3Bva2U6dG9wc2VjcmV0fDA="
          }
        })
          .post(
            "/v4/exportJobs",
            `{"savedListId":682951,"type":"7","webhookUrl":${webhookUrl}}`
          )
          .reply(500);

        await processContactLoad(job, maxContacts, organization);

        expect(helpers.finalizeContactLoad).not.toHaveBeenCalled();
        expect(csvParser.parseCSVAsync).not.toHaveBeenCalled();

        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [
            job,
            payload,
            expect.stringMatching(
              /Error requesting VAN export job. Error: Request id .+ failed; received status 500/
            )
          ]
        ]);

        exportJobsNock.done();
      });
    });

    describe("when GET from downloadURL fails", () => {
      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");

        const getCsvNock = nock("https://ngpvan.blob.core.windows.net:443", {
          encodedQueryParams: true
        })
          .get("/pii.csv")
          .reply(500);

        await processContactLoad(job, maxContacts, organization);

        expect(helpers.finalizeContactLoad).not.toHaveBeenCalled();
        expect(csvParser.parseCSVAsync).not.toHaveBeenCalled();

        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [
            job,
            payload,
            expect.stringMatching(
              /Error downloading VAN contacts. Error: Request id .+ failed; received status 500/
            )
          ]
        ]);

        exportJobsNock.done();
        getCsvNock.done();
      });
    });

    describe("when parseCSVAsync fails", () => {
      beforeEach(async () => {
        csvParser.parseCSVAsync.mockRestore();
        jest
          .spyOn(csvParser, "parseCSVAsync")
          .mockRejectedValue(new Error("malformed csv"));
      });

      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
        const getCsvNock = makeSuccessfulGetCsvNock();

        await processContactLoad(job, maxContacts, organization);

        expect(helpers.finalizeContactLoad).not.toHaveBeenCalled();
        expect(csvParser.parseCSVAsync).toHaveBeenCalledTimes(1);

        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [job, payload, "Error parsing VAN response. Error: malformed csv"]
        ]);

        getCsvNock.done();
        exportJobsNock.done();
      });
    });

    describe("when finalizeContactLoad fails", () => {
      beforeEach(async () => {
        csvParser.parseCSVAsync.mockRestore();
        jest.spyOn(csvParser, "parseCSVAsync").mockResolvedValue({
          validationStats: {},
          contacts: [{}, {}]
        });

        helpers.finalizeContactLoad.mockRestore();
        jest
          .spyOn(helpers, "finalizeContactLoad")
          .mockRejectedValue(new Error("oh no!"));
      });

      it("calls handleFailedContactLoad", async () => {
        const exportJobsNock = makeSuccessfulExportJobPostNock("Completed");
        const getCsvNock = makeSuccessfulGetCsvNock();

        await processContactLoad(job, maxContacts, organization);

        expect(helpers.finalizeContactLoad).toHaveBeenCalledTimes(1);
        expect(csvParser.parseCSVAsync).toHaveBeenCalledTimes(1);

        expect(ngpvan.handleFailedContactLoad.mock.calls).toEqual([
          [
            job,
            payload,
            "Error loading VAN contacts to the database. Error: oh no!"
          ]
        ]);

        getCsvNock.done();
        exportJobsNock.done();
      });
    });
  });

  describe("handleFailedContactLoad", () => {
    let job;
    let payload;
    beforeEach(async () => {
      payload = {
        data: "fake"
      };

      job = {
        payload: JSON.stringify(payload)
      };

      jest.spyOn(jobs, "failedContactLoad").mockRejectedValue(true);
    });

    it("calls failedContactLoad", async () => {
      handleFailedContactLoad(job, payload, "fake_message");

      expect(jobs.failedContactLoad.mock.calls).toEqual([
        [
          job,
          null,
          job.payload,
          {
            errors: ["fake_message"],
            ...payload
          }
        ]
      ]);
    });
  });

  describe("rowTransformer", () => {
    let getCellFromRowSpy;
    let getZipFromRowSpy;
    let inputFields;
    let expectedFields;
    let inputRow;

    beforeEach(() => {
      getCellFromRowSpy = jest
        .spyOn(ngpvan, "getCellFromRow")
        .mockReturnValue("12024561414");
      getZipFromRowSpy = jest
        .spyOn(ngpvan, "getZipFromRow")
        .mockReturnValue("07052");

      inputFields = ["VanID"];
      expectedFields = ["cell", "zip", "external_id"];
      inputRow = {
        VanID: "abc",
        firstName: "Jerry",
        lastName: "Garcia"
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("delegates to its dependencies", () => {
      const rowTransformer = makeRowTransformer();
      const transformedRow = rowTransformer(inputFields, inputRow);

      expect(getCellFromRowSpy.mock.calls).toEqual([[inputRow, true]]);
      expect(getZipFromRowSpy.mock.calls).toEqual([[inputRow]]);
      expect(transformedRow.row).toEqual({
        VanID: "abc",
        external_id: "abc",
        cell: "12024561414",
        zip: "07052",
        firstName: "Jerry",
        lastName: "Garcia"
      });
      expect(transformedRow.addedFields.length).toEqual(expectedFields.length);
      expect(transformedRow.addedFields).toEqual(
        expect.arrayContaining(expectedFields)
      );
    });

    describe("when we throw caution to the wind", () => {
      it("passes false to getCellFromRow", async () => {
        const rowTransformer = makeRowTransformer(false);
        rowTransformer(inputFields, inputRow);
        expect(getCellFromRowSpy.mock.calls).toEqual([[inputRow, false]]);
      });
    });
  });

  describe("getCellFromRow", () => {
    each([
      [{ CellPhone: "2024561111", CellPhoneDialingPrefix: "1" }, "12024561111"],
      [
        {
          CellPhone: "2024561111",
          CellPhoneDialingPrefix: "1",
          CellPhoneCountryCode: "US"
        },
        "12024561111"
      ],
      [
        {
          CellPhone: "2024561111",
          CellPhoneDialingPrefix: "1",
          CellPhoneCountryCode: "AU"
        },
        undefined
      ],
      [
        { OptInPhone: "2024561111", OptInPhoneDialingPrefix: "1" },
        "12024561111"
      ],
      [
        {
          OptInPhone: "2024561111",
          OptInPhoneDialingPrefix: "1",
          IsOptInPhoneACellExchange: "1"
        },
        "12024561111"
      ],
      [
        {
          OptInPhone: "2024561111",
          OptInPhoneDialingPrefix: "1",
          IsOptInPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          OptInPhone: "2024561111",
          OptInPhoneDialingPrefix: "1",
          IsOptInPhoneACellExchange: "a"
        },
        "12024561111"
      ],
      [{ Phone: "2024561111", PhoneDialingPrefix: "1" }, "12024561111"],
      [
        {
          Phone: "2024561111",
          PhoneDialingPrefix: "1",
          IsPhoneACellExchange: "1"
        },
        "12024561111"
      ],
      [
        {
          Phone: "2024561111",
          PhoneDialingPrefix: "1",
          IsPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          Phone: "2024561111",
          PhoneDialingPrefix: "1",
          IsPhoneACellExchange: "a"
        },
        "12024561111"
      ],
      [{ HomePhone: "2024561111", HomePhoneDialingPrefix: "1" }, "12024561111"],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "1"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "a"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "1",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "a",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        "12024561111"
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "1"
        },
        "12024561414"
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "0"
        },
        "12024561414"
      ],
      [
        {
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "a"
        },
        "12024561414"
      ],
      [{ WorkPhone: "2024561414", WorkPhoneDialingPrefix: "1" }, "12024561414"],
      [
        {
          HomePhone: "2024561111",
          HomePhoneDialingPrefix: "1",
          IsHomePhoneACellExchange: "0",
          WorkPhone: "2024561414",
          WorkPhoneDialingPrefix: "1",
          IsWorkPhoneACellExchange: "1"
        },
        "12024561111"
      ]
    ]).test("getZipFromRow( %j ) returns %s", (row, allegedPhone) => {
      expect(getCellFromRow(row, false)).toEqual(allegedPhone);
    });
    describe("when cautious is true", () => {
      each([
        [
          { CellPhone: "2024561111", CellPhoneDialingPrefix: "1" },
          "12024561111"
        ],
        [
          {
            CellPhone: "2024561111",
            CellPhoneDialingPrefix: "1",
            CellPhoneCountryCode: "US"
          },
          "12024561111"
        ],
        [
          {
            CellPhone: "2024561111",
            CellPhoneDialingPrefix: "1",
            CellPhoneCountryCode: "AU"
          },
          undefined
        ],
        [{ OptInPhone: "2024561111", OptInPhoneDialingPrefix: "1" }, undefined],
        [
          {
            OptInPhone: "2024561111",
            OptInPhoneDialingPrefix: "1",
            IsOptInPhoneACellExchange: "1"
          },
          "12024561111"
        ],
        [
          {
            OptInPhone: "2024561111",
            OptInPhoneDialingPrefix: "1",
            IsOptInPhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            OptInPhone: "2024561111",
            OptInPhoneDialingPrefix: "1",
            IsOptInPhoneACellExchange: "a"
          },
          undefined
        ],
        [{ Phone: "2024561111", PhoneDialingPrefix: "1" }, undefined],
        [
          {
            Phone: "2024561111",
            PhoneDialingPrefix: "1",
            IsPhoneACellExchange: "1"
          },
          "12024561111"
        ],
        [
          {
            Phone: "2024561111",
            PhoneDialingPrefix: "1",
            IsPhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            Phone: "2024561111",
            PhoneDialingPrefix: "1",
            IsPhoneACellExchange: "a"
          },
          undefined
        ],
        [{ HomePhone: "2024561111", HomePhoneDialingPrefix: "1" }, undefined],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "1"
          },
          "12024561111"
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "a"
          },
          undefined
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1"
          },
          undefined
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "1",
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "0"
          },
          "12024561111"
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "0",
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "a",
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "1"
          },
          "12024561414"
        ],
        [
          {
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "0"
          },
          undefined
        ],
        [
          {
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "a"
          },
          undefined
        ],
        [{ WorkPhone: "2024561414", WorkPhoneDialingPrefix: "1" }, undefined],
        [
          {
            HomePhone: "2024561111",
            HomePhoneDialingPrefix: "1",
            IsHomePhoneACellExchange: "0",
            WorkPhone: "2024561414",
            WorkPhoneDialingPrefix: "1",
            IsWorkPhoneACellExchange: "1"
          },
          "12024561414"
        ]
      ]).test("getZipFromRow( %j ) returns %s", (row, allegedPhone) => {
        expect(getCellFromRow(row, true)).toEqual(allegedPhone);
      });
    });
  });

  describe("getZipFromRow", () => {
    each([
      [{ Address: "350 Fifth Avenue, New York, NY 10118" }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY 10118-1234" }, "10118-1234"],
      [{ Address: "350 Fifth Avenue, New York, NY" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118  " }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY      10118  " }, "10118"],
      [{ Address: "350 Fifth Avenue, New York, NY10118  " }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1011" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1011-1234" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118-123" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 1AAAA" }, undefined],
      [{ Address: "350 Fifth Avenue, New York, NY 10118=1AAA" }, undefined]
    ]).test("getZipFromRow( %j ) returns %s", (allegedAddress, allegedZip) => {
      expect(getZipFromRow(allegedAddress)).toEqual(allegedZip);
    });
  });

  describe("react-component.campaignContactsForm", () => {
    let onSubmit;
    let onChange;
    let wrapper;
    let component;
    let commonProps;
    let dataSourceExpectation;

    beforeEach(async () => {
      onSubmit = () => {};
      onChange = () => {};

      dataSourceExpectation = [
        {
          rawValue: 682913,
          text: "200-220 W 103",
          value: expect.objectContaining({
            props: expect.objectContaining({ primaryText: "200-220 W 103" })
          })
        }
      ];

      commonProps = {
        onChange,
        onSubmit,
        campaignIsStarted: false,
        icons,
        saveDisabled: false,
        saveLabel: "Save",
        clientChoiceData: JSON.stringify({
          items: [
            {
              savedListId: 682913,
              name: "200-220 W 103",
              description: null,
              listCount: 171,
              doorCount: 127
            }
          ]
        }),
        jobResultMessage: null
      };

      StyleSheetTestUtils.suppressStyleInjection();
    });

    afterEach(async () => {
      jest.restoreAllMocks();
    });

    it("populates its data correctly", async () => {
      wrapper = shallow(<CampaignContactsForm {...commonProps} />);
      component = wrapper.instance();
      const autocomplete = wrapper.find("AutoComplete");
      expect(autocomplete.props().dataSource).toEqual(dataSourceExpectation);
      expect(autocomplete.props().searchText).toBe(undefined);
      expect(autocomplete.props().hintText).toEqual("Select a list to import");
    });

    describe("when lastResult indicates a success", () => {
      beforeEach(async () => {
        StyleSheetTestUtils.suppressStyleInjection();
        wrapper = shallow(
          <CampaignContactsForm
            {...commonProps}
            lastResult={{
              name: "ngpvan",
              success: true,
              result:
                '{"dupeCount":0,"invalidCellCount":0,"missingCellCount":260,"zipCount":9}',
              reference:
                '{"savedListId":682913,"savedListName":"200-220 W 103"}',
              contactsCount: 9,
              deletedOptouts: 0,
              deletedDupes: 0,
              updatedAt: "2020-03-25T02:53:37.514Z"
            }}
          />
        );
        component = wrapper.instance();
      });

      it("populates the selected list name in the autocomplete and displays the results", async () => {
        const autocomplete = wrapper.find("AutoComplete");
        expect(autocomplete.props().dataSource).toEqual(dataSourceExpectation);
        expect(component.props.lastResult).toEqual({
          contactsCount: 9,
          deletedDupes: 0,
          deletedOptouts: 0,
          name: "ngpvan",
          reference: '{"savedListId":682913,"savedListName":"200-220 W 103"}',
          result:
            '{"dupeCount":0,"invalidCellCount":0,"missingCellCount":260,"zipCount":9}',
          success: true,
          updatedAt: "2020-03-25T02:53:37.514Z"
        });
        expect(autocomplete.props().searchText).toEqual("200-220 W 103");
        expect(autocomplete.props().hintText).toEqual(
          "Select a list to import"
        );
        const subheader = wrapper.find("Subheader");
        expect(subheader.props().children).toEqual("Last Import");

        const listItems = wrapper.find("ListItem");
        expect(listItems.at(0).props().primaryText).toEqual(
          "List name: 200-220 W 103"
        );
        expect(listItems.at(1).props().primaryText).toEqual(
          "260 contacts with no cell phone removed"
        );
        expect(listItems.at(2).props().primaryText).toEqual(
          "0 contacts with no ZIP code imported"
        );
        expect(listItems.at(3).exists()).toEqual(false);
      });
    });

    describe("when lastResult indicates a failure", () => {
      beforeEach(async () => {
        StyleSheetTestUtils.suppressStyleInjection();
        wrapper = shallow(
          <CampaignContactsForm
            {...commonProps}
            lastResult={{
              name: "ngpvan",
              success: false,
              result:
                '{"errors":["Error requesting VAN export job. Error: Request failed with status code 404"],"savedListId":682913,"savedListName":"200-220 W 103"}',
              reference:
                '{"savedListId":682913,"savedListName":"200-220 W 103"}',
              contactsCount: 9,
              deletedOptouts: null,
              deletedDupes: null,
              updatedAt: "2020-03-25T02:53:37.514Z"
            }}
          />
        );
        component = wrapper.instance();
      });

      it("populates the selected list name in the autocomplete and displays the results", async () => {
        const autocomplete = wrapper.find("AutoComplete");
        expect(autocomplete.props().dataSource).toEqual(dataSourceExpectation);
        expect(component.props.lastResult).toEqual({
          contactsCount: 9,
          deletedDupes: null,
          deletedOptouts: null,
          name: "ngpvan",
          reference: '{"savedListId":682913,"savedListName":"200-220 W 103"}',
          result:
            '{"errors":["Error requesting VAN export job. Error: Request failed with status code 404"],"savedListId":682913,"savedListName":"200-220 W 103"}',
          success: false,
          updatedAt: "2020-03-25T02:53:37.514Z"
        });
        expect(autocomplete.props().searchText).toEqual("200-220 W 103");
        expect(autocomplete.props().hintText).toEqual(
          "Select a list to import"
        );
        const subheader = wrapper.find("Subheader");
        expect(subheader.props().children).toEqual("Last Import");

        const listItems = wrapper.find("ListItem");
        expect(listItems.at(0).props().primaryText).toEqual(
          "List name: 200-220 W 103"
        );
        expect(listItems.at(1).props().primaryText).toEqual(
          "Error requesting VAN export job. Error: Request failed with status code 404"
        );
        expect(listItems.at(2).exists()).toEqual(false);
      });
    });

    describe("when there is no last result", () => {
      beforeEach(async () => {
        StyleSheetTestUtils.suppressStyleInjection();
        wrapper = shallow(
          <CampaignContactsForm {...commonProps} lastResult={null} />
        );
        component = wrapper.instance();
      });

      it("does not display any results or previously selected list", async () => {
        const autocomplete = wrapper.find("AutoComplete");
        expect(autocomplete.props().dataSource).toEqual([
          {
            rawValue: 682913,
            text: "200-220 W 103",
            value: expect.objectContaining({
              props: expect.objectContaining({ primaryText: "200-220 W 103" })
            })
          }
        ]);
        expect(component.props.lastResult).toEqual(null);
        expect(autocomplete.props().searchText).toEqual(undefined);
        expect(autocomplete.props().hintText).toEqual(
          "Select a list to import"
        );
        const subheader = wrapper.find("Subheader");
        expect(subheader.exists()).toEqual(false);

        const listItems = wrapper.find("ListItem");
        expect(listItems.exists()).toEqual(false);
      });
    });
  });
});
