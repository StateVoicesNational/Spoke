import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { flushRedis } from "./test_helpers";

configure({ adapter: new Adapter() });

// server/api/campaign.test.js has some long tests so we increase from 5sec default
jest.setTimeout(15000);

beforeEach(async () => {
  await flushRedis();
});
