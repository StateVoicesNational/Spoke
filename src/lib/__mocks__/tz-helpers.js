const tzHelpers = jest.genMockFromModule("../tz-helpers");

tzHelpers.getProcessEnvDstReferenceTimezone = () => "US/Eastern";

module.exports = tzHelpers;
