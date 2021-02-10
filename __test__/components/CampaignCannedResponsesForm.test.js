/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CampaignCannedResponsesForm } from "../../src/components/CampaignCannedResponsesForm";
import { StyleSheetTestUtils } from "aphrodite";

describe("CampaignCannedResponsesForm component", () => {
  // given
  const props = {
    formValues: {
      cannedResponses: [
        {
          id: 1,
          title: "Response1",
          text: "Response1 desc",
          tagIds: [1, 2],
          answerActions: "fake-action",
          answerActionsData: JSON.stringify({ label: "Test Property" })
        }
      ]
    },
    data: {
      organization: {
        tags: [
          {
            id: 1,
            name: "Tag1",
            description: "Tag1Desc"
          },
          {
            id: 2,
            name: "Tag2",
            description: "Tag2Desc"
          }
        ]
      }
    },
    availableActions: [
      {
        name: "fake-action",
        displayName: "Fake Action"
      }
    ]
  };

  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = mount(
    <MuiThemeProvider>
      <CampaignCannedResponsesForm {...props} />
    </MuiThemeProvider>
  );

  // when

  test("Renders canned responses with correct text", () => {
    expect(wrapper.find("ListItem").text()).toContain("Response1");
    expect(wrapper.find("ListItem").text()).toContain("Response1 desc");
    expect(wrapper.find("ListItem").text()).toContain("Fake Action");
    expect(wrapper.find("ListItem").text()).toContain("Test Property");
    expect(wrapper.find("TagChips").prop("tagIds")).toEqual([1, 2]);
    expect(wrapper.find("TagChips").prop("tags")).toEqual([
      {
        id: 1,
        name: "Tag1",
        description: "Tag1Desc"
      },
      {
        id: 2,
        name: "Tag2",
        description: "Tag2Desc"
      }
    ]);
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
      text: "Response1 desc",
      tagIds: [1, 2],
      answerActions: "fake-action",
      answerActionsData: JSON.stringify({ label: "Test Property" })
    });
    expect(cannedResponseForm.prop("formButtonText")).toBe("Edit Response");
  });
});
