import nexmo from "./nexmo";
import * as twilio from "./twilio";
import fakeservice from "./fakeservice";

const serviceMap = {
  nexmo,
  twilio,
  fakeservice
};

export default serviceMap;
