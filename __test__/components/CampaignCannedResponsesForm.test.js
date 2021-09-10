/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { CampaignCannedResponsesForm } from "../../src/components/CampaignCannedResponsesForm";
import { StyleSheetTestUtils } from "aphrodite";
import IconButton from "@material-ui/core/IconButton";
import ListItemText from "@material-ui/core/ListItemText";

describe("CampaignCannedResponsesForm component", () => {
  // given
  const formValues = {
    cannedResponses: [
      {
        id: 1,
        title: "Response1",
        text: "Response1 desc",
        tagIds: [1, 2]
      }
    ]
  };

  const data = {
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
  };

  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = mount(
    <CampaignCannedResponsesForm formValues={formValues} data={data} />
  );

  // when

  test("Renders canned responses with correct text", () => {
    expect(wrapper.find(ListItemText).text()).toContain("Response1");
    expect(wrapper.find(ListItemText).text()).toContain("Response1 desc");
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
      .find(IconButton)
      .first()
      .simulate("click");

    const cannedResponseForm = wrapper.find("CannedResponseForm");

    expect(cannedResponseForm).toHaveLength(1);
    expect(cannedResponseForm.prop("defaultValue")).toEqual({
      id: 1,
      title: "Response1",
      text: "Response1 desc",
      tagIds: [1, 2]
    });
    expect(cannedResponseForm.prop("formButtonText")).toBe("Edit Response");
  });
});
