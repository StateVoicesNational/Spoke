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
1286,6477074,"675 Beaka Pt, Kapirap, IN 00113",Lora,Ermini,675 Beaka Pt,Kapirap,IN,,Suffolk,,,,,,(648) 235-2103,,,(344) 774-3762,,,,001,004,002,U,,,
1286,6500006,"1604 Cujak Ext, Netullih, CA 17931",Nina,Perini,1604 Cujak Ext,Netullih,CA,,Suffolk,,,,,,(783) 833-4188,,,(729) 824-9458,,,,001,004,002,D,,,
1286,6545748,"649 Rajub Pl, Afegiwoz, VA 58800",Glen,Kurt,649 Rajub Pl,Afegiwoz,VA,,Suffolk,,,,,,(489) 213-6173,,,(200) 763-3338,,,,001,004,002,O,,,
1286,6678759,"1229 Dubud Cir, Gujufbik, MA 67577",Zachary,Chapman,1229 Dubud Cir,Gujufbik,MA,,Suffolk,,,,(530) 591-9876,0,(770) 500-5813,,,(865) 787-7929,,,,001,004,002,O,,,
1286,6687736,"1660 Tiwa Pike, Owucudji, MD 78594",Phoebe,König,1660 Tiwa Pike,Owucudji,MD,,Suffolk,,,,,,(765) 927-7705,,,(232) 872-2395,,,,001,004,002,D,,,
1286,6687737,"1820 Kasi Plz, Uhokuicu, NJ 70521",Andrew,Coli,1820 Kasi Plz,Uhokuicu,NJ,,Suffolk,,,,,,(830) 978-5900,,,(256) 289-2236,,,,001,004,002,R,,,
1286,6740265,"1864 Pohe Path, Lahutci, IA 21134",Francis,Anderson,1864 Pohe Path,Lahutci,IA,,Suffolk,,,,(229) 403-7155,0,,,,(839) 862-7352,,,,001,004,002,R,,,
1286,6740266,"28 Lian Cir, Ruutunu, NM 59815",Sallie,Naylor,28 Lian Cir,Ruutunu,NM,,Suffolk,,,,(216) 509-8792,0,,,,(972) 896-8504,,,,001,004,002,R,,,
1286,6756669,"48 Edhol Ext, Behzije, OR 32634",Mike,Ruiz,48 Edhol Ext,Behzije,OR,,Suffolk,,,,(473) 291-8514,0,(265) 334-5017,,,(282) 459-4420,,,,001,004,002,D,,,
1286,6848857,"296 Bilez Sq, Efabodgun, NC 26984",Florence,Adkins,296 Bilez Sq,Efabodgun,NC,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,6870533,"701 Zetli Plz, Nuwdope, CA 62375",Leona,Orsini,701 Zetli Plz,Nuwdope,CA,,Suffolk,,,,(968) 346-8020,0,,,,(874) 366-8307,,,,001,004,002,R,,,
1286,8277239,"299 Evto Cir, Nembecivo, MN 03381",Howard,Ashton,299 Evto Cir,Nembecivo,MN,,Suffolk,,,,(472) 767-4456,0,,,,(401) 854-6069,,,,001,004,002,D,,,
1286,15597061,"1591 Zuote Rdg, Pudugpu, MA 56190",Francis,Reyes,1591 Zuote Rdg,Pudugpu,MA,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,17293476,"65 Niboko Pkwy, Tawurel, LA 39583",Jerry,Tucci,65 Niboko Pkwy,Tawurel,LA,,Suffolk,,,,(973) 507-1207,0,,,,(760) 455-8006,,,,001,004,002,D,,,
1286,19680979,"671 Kioko Pass, Novavahe, HI 62568",Katharine,Giovannelli,671 Kioko Pass,Novavahe,HI,,Suffolk,,,,,,(821) 734-5990,,,(712) 847-3291,,,,001,004,002,D,,,
1286,19680982,"588 Pinovu Path, Notjuap, WV 59864",Isaac,Stefani,588 Pinovu Path,Notjuap,WV,,Suffolk,,,,,,,,,,,,,001,004,002,D,,,
1286,20700354,"241 Ozno Sq, Pomizivi, TN 13358",Marion,Cook,241 Ozno Sq,Pomizivi,TN,,Suffolk,,,,,,(831) 401-6718,,,(670) 427-8081,,,,001,004,002,R,,,
1286,21681436,"902 Hamze Pl, Biuhke, SC 35341",Bill,Fiore,902 Hamze Pl,Biuhke,SC,,Suffolk,,,,,,(802) 897-2566,,,(332) 794-5172,,,,001,004,002,R,,,
1286,21681437,"692 Wuhu Path, Hadpidkil, ND 26955",Lester,Chiba,692 Wuhu Path,Hadpidkil,ND,,Suffolk,,,,,,(344) 880-4989,,,(410) 674-9299,,,,001,004,002,R,,,
1286,21934451,"1956 Occom Gln, Sodtehu, KY 19566",Lou,Houston,1956 Occom Gln,Sodtehu,KY,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,22409724,"1371 Lidji Rdg, Racodec, LA 35029",Laura,Kwakman,1371 Lidji Rdg,Racodec,LA,,Suffolk,,,,,,(835) 886-9883,,,(820) 468-6855,,,,001,004,002,R,,,
1286,23035246,"1598 Heto Mill, Jucjetwo, SC 46863",Carolyn,Bertelli,1598 Heto Mill,Jucjetwo,SC,,Suffolk,,,,(985) 572-9286,0,(326) 689-7955,,,(920) 361-7268,,,,001,004,002,U,,,
1286,25642789,"1785 Momo Pl, Rivpowu, NM 06235",Glen,Ortega,1785 Momo Pl,Rivpowu,NM,,Suffolk,,,,(259) 861-5321,0,,,,(550) 615-1936,,,,001,004,002,D,,,
1286,26022837,"732 Huwtu Loop, Gujoboba, LA 77281",Sophie,Borghi,732 Huwtu Loop,Gujoboba,LA,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,26508704,"437 Vifnu Path, Luwpuvmon, IN 15340",Cameron,George,437 Vifnu Path,Luwpuvmon,IN,,Suffolk,,,,,,,,,,,,,001,004,002,R,,,
1286,26850518,"1214 Lako Ctr, Foduwal, OR 68000",Jerry,Khan,1214 Lako Ctr,Foduwal,OR,,Suffolk,,,,,,,,,,,,,001,004,002,U,,,
`;
    });

    beforeEach(async () => {
      jest.spyOn(csvParser, "parseCSVAsync");
    });

    afterEach(async () => {
      process.env.NGP_VAN_WEBHOOK_URL = oldNgpVanWebhookUrl;
      process.env.NGP_VAN_EXPORT_JOB_TYPE_ID = oldNgpVanExportJobTypeId;
      process.env.NGP_VAN_APP_NAME = oldNgpVanAppName;
      process.env.NGP_VAN_API_KEY = oldNgpVanApiKey;
    });

    it("calls the api", async () => {
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
      const expectedFields = ["cell", "zip", "external_id"];
      const inputRow = {
        VanID: "abc"
      };
      const transformedRow = rowTransformer(inputFields, inputRow);
      expect(getCellFromRowSpy.mock.calls).toEqual([[inputRow]]);
      expect(getZipFromRowSpy.mock.calls).toEqual([[inputRow]]);
      expect(transformedRow.row).toEqual({
        VanID: "abc",
        external_id: "abc",
        cell: "12024561414",
        zip: "07052"
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
