import {parseCSV} from '../../src/lib'

describe('parseCSV', () => {
  describe('with PHONE_NUMBER_COUNTRY set', () => {
    beforeEach(() => process.env.PHONE_NUMBER_COUNTRY = 'AU')
    afterEach(() => delete process.env.PHONE_NUMBER_COUNTRY)

    it('should consider phone numbers from that country as valid', () => {
      const csv = "firstName,lastName,cell\ntest,test,61468511000"
      parseCSV(csv, [], ({ contacts, customFields, validationStats, error }) => {
        expect(error).toBeFalsy()
        expect(contacts.length).toEqual(1)
      })
    })
  })
})
