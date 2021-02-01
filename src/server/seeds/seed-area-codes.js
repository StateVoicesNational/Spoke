import { AreaCode, r } from "../models";
import Papa from "papaparse";
import { log } from "../../lib";
import fs from "fs";

export async function seedAreaCodes() {
  log.info("Checking if area code is needed");
  const hasAreaCodes =
    (await r
      .table("area_code")
      .limit(1)
      .count()) > 0;

  if (!hasAreaCodes) {
    log.info("Starting to seed area codes");
    const absolutePath = `${__dirname}/data/area-codes.csv`;
    const content = fs.readFileSync(absolutePath, { encoding: "binary" });
    const { data, error } = Papa.parse(content, { header: true });
    if (error) {
      throw new Error("Failed to seed area codes");
    } else {
      log.info("Parsed a CSV with ", data.length, " area codes");
      AreaCode.save(data)
        .then(() => log.info("Finished seeding"))
        .error(err => log.error("error", err));
    }
  }
}
