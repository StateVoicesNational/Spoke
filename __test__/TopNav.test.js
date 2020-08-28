import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import TopNav from "../src/components/TopNav";

describe("TopNav", () => {
  it("can render only title", () => {
    const nav = shallow(<TopNav title="Welcome to my website" />);
    expect(nav.text()).toEqual(
      "Welcome to my website<Apollo(withRouter(UserMenu)) />"
    );
    expect(nav.find("Link").length).toBe(0);
  });

  it("can render Link to go back", () => {
    const link = shallow(
      <TopNav title="Welcome" backToURL="/admin/1/campaigns" />
    ).find("Link");
    expect(link.length).toBe(1);
    expect(link.prop("to")).toBe("/admin/1/campaigns");
    expect(link.find("IconButton").length).toBe(1);
  });

  it("renders UserMenu", () => {
    const nav = shallow(<TopNav title="Welcome to my website" />);
    expect(nav.find("Apollo(withRouter(UserMenu))").length).toBe(1);
  });
});

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});
afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});
