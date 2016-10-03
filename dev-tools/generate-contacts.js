import faker from 'faker'
import json2csv from 'json2csv'

const fields = ['firstName', 'lastName', 'cell', 'companyName', 'city']
const numContacts = 10000

const data = []
for (let index = 0; index < numContacts; index++) {
  data.push({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    cell: `1-${faker.phone.phoneNumberFormat()}`,
    companyName: faker.company.companyName(),
    city: faker.address.city()
  })
}

const csvFile = json2csv({ data, fields })
console.log(csvFile)
