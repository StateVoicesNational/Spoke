import { loadMessages } from "./jobs";
import fs from "fs";

const csvFilename = process.argv.filter(f => /\.csv/.test(f))[0];

new Promise((resolve, reject) => {
  fs.readFile(csvFilename, "utf8", function(err, contents) {
    loadMessages(contents)
      .then(msgs => {
        resolve(msgs);
        process.exit();
      })
      .catch(err => {
        console.log(err);
        reject(err);
        console.log("Error", err);
        process.exit();
      });
  });
});
