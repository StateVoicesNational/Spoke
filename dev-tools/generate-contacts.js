import { faker } from "@faker-js/faker";
import json2csv from "json2csv";
import { getFormattedPhoneNumber } from '../src/lib/phone-format'

const numContacts = 100000;


const validPhone = () => {
  let valid = false
  let testPhone = ""
  let attempts = 0
  while (valid === false && attempts < 1000) {
    testPhone = faker.phone.number("+1-###-###-####")
    valid = getFormattedPhoneNumber(testPhone) !== ""
    attempts += 1
  }
  return testPhone
}

const data = [];
for (let index = 0; index < numContacts; index++) {
  data.push({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    cell: validPhone(),
    zip: faker.location.zipCode({ format: "#####" }),
    sosId: faker.string.uuid()
  });
}

const fields = Object.keys(data[0])

const csvFile = json2csv({ data, fields, quotes: '' });
console.log(csvFile);
