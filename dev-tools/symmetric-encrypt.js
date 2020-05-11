// Run this script from the top level directory to encrypt a value:
//
//    node ./dev-tools/symmetric-encrypt.js ValueToBeEncrypted

require("dotenv").config();
const { symmetricEncrypt } = require("../src/server/api/lib/crypto");

const result = symmetricEncrypt(process.argv[2]);
console.log(result);
process.exit(0);
