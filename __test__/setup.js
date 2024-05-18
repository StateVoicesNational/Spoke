import { configure } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

configure({ adapter: new Adapter() });

// server/api/campaign.test.js has some long tests so we increase from 5sec default
jest.setTimeout(15000);
