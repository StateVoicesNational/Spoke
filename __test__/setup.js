import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { r } from "../src/server/models";

configure({ adapter: new Adapter() });

// server/api/campaign.test.js has some long tests so we increase from 5sec default
jest.setTimeout(15000);

afterAll(async () => {
  if (!r.redis) {
    return;
  }

  // eslint-disable-next-line no-unused-vars
  await r.redis.quit();
});
