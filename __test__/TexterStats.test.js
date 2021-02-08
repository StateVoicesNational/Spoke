import React from "react";
import { shallow } from "enzyme";
import TexterStats from "../src/components/TexterStats";

const campaign = {
  useDynamicAssignment: false,
  assignments: [
    {
      id: "1",
      texter: {
        id: "1",
        firstName: "Test",
        lastName: "Tester",
        roles: ["SUSPENDED", "TEXTER"]
      },
      unmessagedCount: 193,
      contactsCount: 238
    },
    {
      id: "1",
      texter: {
        id: "1",
        firstName: "Someone",
        lastName: "Else",
        roles: ["SUSPENDED"]
      },
      unmessagedCount: 4,
      contactsCount: 545
    }
  ]
};

const campaignDynamic = {
  useDynamicAssignment: true,
  assignments: [
    {
      id: "1",
      texter: {
        id: "1",
        firstName: "Test",
        lastName: "Tester",
        roles: ["SUSPENDED", "TEXTER"]
      },
      unmessagedCount: 193,
      contactsCount: 238
    },
    {
      id: "1",
      texter: {
        id: "1",
        firstName: "Someone",
        lastName: "Else",
        roles: ["SUSPENDED"]
      },
      unmessagedCount: 4,
      contactsCount: 545
    }
  ]
};

describe("TexterStats (Non-dynamic campaign)", () => {
  it("contains the right text", () => {
    const stats = shallow(
      <TexterStats campaign={campaign} organizationId="1" />
    );
    expect(stats.text()).toEqual(
      "Test Tester <Link />19%<LinearProgress /><Link />  |  <Link />  |  <Link />Someone Else (Suspended) <Link />99%<LinearProgress /><Link />  |  <Link />  |  <Link />"
    );
  });

  it("creates linear progress correctly", () => {
    const linearProgress = shallow(<TexterStats campaign={campaign} />).find(
      "LinearProgress"
    );
    expect(linearProgress.length).toBe(2);
    expect(linearProgress.first().props()).toEqual({
      max: 100,
      min: 0,
      mode: "determinate",
      value: 19
    });
  });
});

describe("TexterStats (Dynamic campaign)", () => {
  it("contains the right text", () => {
    const stats = shallow(<TexterStats campaign={campaignDynamic} />);
    expect(stats.text()).toEqual(
      "Test Tester <Link />45 initial messages sent. <Link />  |  <Link />  |  <Link />Someone Else (Suspended) <Link />541 initial messages sent. <Link />  |  <Link />  |  <Link />"
    );
  });
});
