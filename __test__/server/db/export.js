import { r } from "../../../src/server/models";
import { tables, indexQuery } from "./utils";
import fs from "fs";

function getSchema(s) {
  return r
    .k(s)
    .columnInfo()
    .then(schema => {
      console.log("exported schema for", s);
      fs.writeFileSync(
        `init_schemas/${s}.json`,
        JSON.stringify(schema, null, 2)
      );
    });
}
function getIndexes() {
  return r.k.raw(indexQuery).then(indexes => {
    fs.writeFileSync(
      "init_schemas/indexes.json",
      JSON.stringify(indexes, null, 2)
    );
    console.log("exported indices");
  });
}

const tablePromises = tables.map(getSchema);
const indexesPromises = getIndexes();

Promise.all(tablePromises.concat([indexesPromises]))
  .then(() => {
    console.log("completed");
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// Run this file _from this directory_ (e.g. with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
