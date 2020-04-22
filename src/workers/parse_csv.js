import util from "util";
import { parseCSV } from "../lib/parse_csv";

parseCSV[util.promisify.custom] = (file, options) => {
  return new Promise((resolve, reject) => {
    parseCSV(
      file,
      result => {
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result);
        }
      },
      options
    );
  });
};

export const parseCSVAsync = util.promisify(parseCSV);
export default parseCSVAsync;
