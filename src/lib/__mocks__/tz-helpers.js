const tzHelpers = jest.genMockFromModule('../tz-helpers')


tzHelpers.getProcessEnvDstReferenceTimezone = () => 'America/New_York'

module.exports = tzHelpers
