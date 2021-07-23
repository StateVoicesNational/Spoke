import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import TopNav from "../../src/components/TopNav";
import UserMenu from "../../src/containers/UserMenu";

describe("TopNav component", () => {
  StyleSheetTestUtils.suppressStyleInjection();

  const orgId = "1";
  const title = "foo";
  const wrapper = shallow(<TopNav orgId={orgId} title={title} />);

  test("Renders UserMenu with orgId", () => {
    const menu = wrapper.find(UserMenu);

    // then
    expect(menu.prop("orgId")).toBe("1");
  });
});
