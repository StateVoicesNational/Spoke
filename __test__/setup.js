import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

// server/api/campaign.test.js has some long tests so we increase from 5sec default
jest.setTimeout(25000);
