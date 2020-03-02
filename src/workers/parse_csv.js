import util from "util";
import { parseCSV } from "../lib/parse_csv";

parseCSV[util.promisify.custom] = (file, rowTransformer) => {
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
      rowTransformer
    );
  });
};

export const parseCSVAsync = util.promisify(parseCSV);
export default parseCSVAsync;
