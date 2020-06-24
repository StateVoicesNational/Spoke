/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import CampaignCannedResponseForm from "../../src/components/CampaignCannedResponseForm";
import { StyleSheetTestUtils } from "aphrodite";

describe("CampaignCannedResponseForm component", () => {
  // given
  const props1 = {
    formButtonText: "Edit Response",
    defaultValue: {
      id: 1,
      title: "Response1",
      text: "Response1 desc"
    }
  };

  const props2 = {
    formButtonText: "Add Response",
    defaultValue: {}
  };

  // when
  test("Renders form with correct fields and label for editing", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignCannedResponseForm {...props1} />
      </MuiThemeProvider>
    );
    expect(
      wrapper
        .find({ label: "Title" })
        .find("input")
        .prop("value")
    ).toBe("Response1");
    expect(
      wrapper
        .find({ "data-test": "addResponse" })
        .find("button")
        .text()
    ).toBe("Edit Response");
  });

  test("Renders form with correct fields and label for adding", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignCannedResponseForm {...props2} />
      </MuiThemeProvider>
    );
    expect(
      wrapper
        .find({ label: "Title" })
        .find("input")
        .prop("value")
    ).toBe("");
    expect(
      wrapper
        .find({ "data-test": "addResponse" })
        .find("button")
        .text()
    ).toBe("Add Response");
  });
});
