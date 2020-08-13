/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import CampaignCannedResponsesForm from "../../src/components/CampaignCannedResponsesForm";
import { StyleSheetTestUtils } from "aphrodite";

describe("CampaignCannedResponsesForm component", () => {
  // given
  const formValues = {
    cannedResponses: [
      {
        id: 1,
        title: "Response1",
        text: "Response1 desc"
      }
    ]
  };

  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = mount(
    <MuiThemeProvider>
      <CampaignCannedResponsesForm formValues={formValues} />
    </MuiThemeProvider>
  );

  // when

  test("Renders canned responses with correct text", () => {
    expect(wrapper.find("ListItem").prop("primaryText")).toBe("Response1");

    expect(wrapper.find("ListItem").prop("secondaryText")).toBe(
      "Response1 desc"
    );
  });

  test("Renders CampaignCannedResponseForm component for editing when edit icon clicked", () => {
    wrapper
      .find("IconButton")
      .first()
      .simulate("click");

    const cannedResponseForm = wrapper.find("CannedResponseForm");

    expect(cannedResponseForm).toHaveLength(1);
    expect(cannedResponseForm.prop("defaultValue")).toEqual({
      id: 1,
      title: "Response1",
      text: "Response1 desc"
    });
    expect(cannedResponseForm.prop("formButtonText")).toBe("Edit Response");
  });
});
