import { ZipCode, r } from "../models";
import Papa from "papaparse";
import { log, zipToTimeZone } from "../../lib";
import fs from "fs";

export async function seedZipCodesIfNecessary() {
  log.info("Checking if zip code is needed");
  const hasZip = await r.getCount(r.knex("zip_code").limit(1));

  if (!hasZip) {
    log.info("Starting to seed zip codes");
    const absolutePath = `${__dirname}/data/zip-codes.csv`;
    const content = fs.readFileSync(absolutePath, { encoding: "binary" });
    const { data, error } = Papa.parse(content, { header: true });
    if (error) {
      throw new Error("Failed to seed zip codes");
    } else {
      log.info("Parsed a CSV with ", data.length, " zip codes");
      let zipCodes = data
        .filter(row => !zipToTimeZone(row.zip))
        .map(row => ({
          zip: row.zip,
          city: row.city,
          state: row.state,
          timezone_offset: Number(row.timezone_offset),
          has_dst: Boolean(row.has_dst),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude)
        }));
      if (process.env.HEROKU_PR_NUMBER) {
        // FUTURE: Maybe there's a way to test for hobby-dev database?
        // Hobby-dev databases only allow 10K rows, so don't fill it up with zips
        zipCodes = zipCodes.slice(0, 10);
      }
      log.info(zipCodes.length, "ZIP CODES");
      try {
        await r.knex.batchInsert("zip_code", zipCodes);
      } catch (err) {
        log.error("error", err);
      }
    }
  }
}
