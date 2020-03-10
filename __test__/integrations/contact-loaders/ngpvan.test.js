import each from "jest-each";
import nock from "nock";
import {
  getCellFromRow,
  getZipFromRow,
  rowTransformer,
  processContactLoad
} from "../../../src/integrations/contact-loaders/ngpvan";
const csvParser = require("../../../src/workers/parse_csv");
const ngpvan = require("../../../src/integrations/contact-loaders/ngpvan");
const helpers = require("../../../src/integrations/contact-loaders/helpers");

describe("ngpvan", () => {
  describe("@processContactLoad", () => {
    let job;
    let maxContacts;
    let csvReply;
    let oldNgpVanWebhookUrl;
    let oldNgpVanExportJobTypeId;
    let oldNgpVanAppName;
    let oldNgpVanApiKey;

    beforeEach(async () => {
      oldNgpVanWebhookUrl = process.env.NGP_VAN_WEBHOOK_URL;
      oldNgpVanExportJobTypeId = process.env.NGP_VAN_EXPORT_JOB_TYPE_ID;
      oldNgpVanAppName = process.env.NGP_VAN_APP_NAME;
      oldNgpVanApiKey = process.env.NGP_VAN_API_KEY;
      process.env.NGP_VAN_WEBHOOK_URL = "https://www.example.com";
      process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = 7;
      process.env.NGP_VAN_APP_NAME = "spoke";
      process.env.NGP_VAN_API_KEY = "topsecret";
    });

    beforeEach(async () => {
      job = {
        campaign_id: 1,
        payload: 682951
      };
    });

    beforeEach(async () => {
      csvReply = `CanvassFileRequestID,VanID,Address,FirstName,LastName,StreetAddress,City,State,ZipOrPostal,County,Employer,Occupation,Email,HomePhone,IsHomePhoneACellExchange,CellPhone,WorkPhone,IsWorkPhoneACellExchange,Phone,OptInPhone,OptInStatus,OptInPhoneType,CongressionalDistrict,StateHouse,StateSenate,Party,PollingLocation,PollingAddress,PollingCity
1286,6144436,"1749 Kori Ter, Ranbelsi, SC 02569",Jean,Leclerc,1749 Kori Ter,Ranbelsi,SC,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,6144439,"169 Unnag St, Fekokmuw, NM 15043",Sophia,Robinson,169 Unnag St,Fekokmuw,NM,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,6348005,"415 Domru Park, Igguhe, AK 41215",Samuel,Jimenez,415 Domru Park,Igguhe,AK,,Suffolk,,,,(216) 274-1428,0,,,,(973) 687-4476,,,,001,004,002,O,,,
1286,6409040,"50 Vichad Path, Bapherte, DC 07893",Bobby,Barber,50 Vichad Path,Bapherte,DC,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,6455083,"627 Wizow Way, Lofaje, DE 89435",Larry,Foster,627 Wizow Way,Lofaje,DE,,Suffolk,,,,,,(321) 402-8326,,,(384) 984-5966,,,,001,004,002,D,,,
1286,6475967,"902 Jotho Park, Ilibaed, MN 91571",Cordelia,Gagliardi,902 Jotho Park,Ilibaed,MN,,Suffolk,,,,(887) 867-3213,0,(242) 554-4053,,,(473) 324-5133,,,,001,004,002,D,,,
1286,6678759,"1229 Dubud Cir, Gujufbik, MA 67577",Zachary,Chapman,1229 Dubud Cir,Gujufbik,MA,,Suffolk,,,,(530) 591-9876,0,(770) 500-5813,,,(865) 787-7929,,,,001,004,002,O,,,
1286,6687736,"1660 Tiwa Pike, Owucudji, MD 78594",Phoebe,König,1660 Tiwa Pike,Owucudji,MD,,Suffolk,,,,,,(765) 927-7705,,,(232) 872-2395,,,,001,004,002,D,,,
1286,6687737,"1820 Kasi Plz, Uhokuicu, NJ 70521",Andrew,Coli,1820 Kasi Plz,Uhokuicu,NJ,,Suffolk,,,,,,(830) 978-5900,,,(256) 289-2236,,,,001,004,002,R,,,
1286,6740265,"1864 Pohe Path, Lahutci, IA 21134",Francis,Anderson,1864 Pohe Path,Lahutci,IA,,Suffolk,,,,(229) 403-7155,0,,,,(839) 862-7352,,,,001,004,002,R,,,
1286,6740266,"28 Lian Cir, Ruutunu, NM 59815",Sallie,Naylor,28 Lian Cir,Ruutunu,NM,,Suffolk,,,,(216) 509-8792,0,,,,(972) 896-8504,,,,001,004,002,R,,,
1286,6848857,"296 Bilez Sq, Efabodgun, NC 26984",Florence,Adkins,296 Bilez Sq,Efabodgun,NC,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,6870533,"701 Zetli Plz, Nuwdope, CA 62375",Leona,Orsini,701 Zetli Plz,Nuwdope,CA,,Suffolk,,,,(968) 346-8020,0,,,,(874) 366-8307,,,,001,004,002,R,,,
1286,8277239,"299 Evto Cir, Nembecivo, MN 03381",Howard,Ashton,299 Evto Cir,Nembecivo,MN,,Suffolk,,,,(472) 767-4456,0,,,,(401) 854-6069,,,,001,004,002,D,,,
1286,15597061,"1591 Zuote Rdg, Pudugpu, MA 56190",Francis,Reyes,1591 Zuote Rdg,Pudugpu,MA,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,17293476,"65 Niboko Pkwy, Tawurel, LA 39583",Jerry,Tucci,65 Niboko Pkwy,Tawurel,LA,,Suffolk,,,,(973) 507-1207,0,,,,(760) 455-8006,,,,001,004,002,D,,,
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
      jest.spyOn(csvParser, "parseCSVAsync");
      jest.spyOn(helpers, "finalizeContactLoad").mockImplementation(() => true);
    });

    afterEach(async () => {
      process.env.NGP_VAN_WEBHOOK_URL = oldNgpVanWebhookUrl;
      process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = oldNgpVanExportJobTypeId;
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
    });

    it("calls the api and its dependencies", async () => {
      const exportJobsNock = nock("https://api.securevan.com:443", {
        encodedQueryParams: true,
        reqheaders: {
          authorization: "Basic c3Bva2U6dG9wc2VjcmV0fDA="
        }
      })
        .post(
          "/v4/exportJobs",
          '{"savedListId":682951,"type":"7","webhookUrl":"https://www.example.com"}'
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
          webhookUrl: "https://231c9292.ngrok.io/hello_van",
          downloadUrl: "https://ngpvan.blob.core.windows.net:443/pii.csv",
          status: "Completed",
          type: 3,
          dateExpired: "2020-02-27T05:35:51.9364193Z",
          errorCode: null
        });

      const getCsvNock = nock("https://ngpvan.blob.core.windows.net:443", {
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

      await processContactLoad(job, maxContacts);

      expect(csvParser.parseCSVAsync).toHaveBeenCalledTimes(1);
      expect(csvParser.parseCSVAsync.mock.calls[0][0]).toEqual(csvReply);
      expect(csvParser.parseCSVAsync.mock.calls[0][1]).toBeInstanceOf(Function);

      expect(helpers.finalizeContactLoad).toHaveBeenCalledTimes(1);
      expect(helpers.finalizeContactLoad.mock.calls[0][0]).toEqual(job);
      expect(helpers.finalizeContactLoad.mock.calls[0][1]).toEqual([
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
      ]);

      exportJobsNock.done();
      getCsvNock.done();
    });
  });

  describe("rowTransformer", () => {
    let getCellFromRowSpy;
    let getZipFromRowSpy;
    beforeEach(() => {
      getCellFromRowSpy = jest
        .spyOn(ngpvan, "getCellFromRow")
        .mockReturnValue("12024561414");
      getZipFromRowSpy = jest
        .spyOn(ngpvan, "getZipFromRow")
        .mockReturnValue("07052");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("delegates to its dependencies", () => {
      const inputFields = ["VanID"];
      const expectedFields = [
        "firstName",
        "lastName",
        "cell",
        "zip",
        "external_id"
      ];
      const inputRow = {
        VanID: "abc",
        firstName: "Jerry",
        lastName: "Garcia"
      };
      const transformedRow = rowTransformer(inputFields, inputRow);
      expect(getCellFromRowSpy.mock.calls).toEqual([[inputRow]]);
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
      expect(getCellFromRow(row)).toEqual(allegedPhone);
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
});
