const twilio = jest.genMockFromModule("twilio");

async function createMessagingService(friendlyName) {
  return {
    sid: "testTWILIOsid"
  };
}

twilio.createMessagingService = createMessagingService;

module.exports = twilio;
