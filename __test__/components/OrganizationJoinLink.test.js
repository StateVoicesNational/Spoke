import React from "react";

import { shallow } from "enzyme";
import OrganizationJoinLink from "../../src/components/OrganizationJoinLink";
//Tests A and B check to see if the invite text
//statement changes depending on wether a campaignID prop is passed
describe("OrganizationJoinLink tests A", () => {
  test("finds proper text for invite when campaignId is present", () => {
    const wrapper = shallow(
      <OrganizationJoinLink organizationUuid={"xyztest"} campaignId={"test"} />
    );
    const inviteText = wrapper.find("DisplayLink");
    // then
    expect(inviteText.prop("textContent")).toBe(
      "Send your texting volunteers this link! Once they sign up, they'll be automatically assigned to this campaign."
    );
  });
});

describe("OrganizationJoinLink tests B", () => {
  test("finds proper text for invite when capaignId is null", () => {
    const wrapper = shallow(
      <OrganizationJoinLink organizationUuid={"xyztest"} campaignId={null} />
    );
    const inviteText = wrapper.find("DisplayLink");
    // then
    expect(inviteText.prop("textContent")).toBe(
      "Send your texting volunteers this link! Once they sign up, they'll be automatically assigned to this organization."
    );
  });
});
