/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import AutoComplete from "@material-ui/lab/Autocomplete";
import CampaignCannedResponseForm from "../../src/components/CampaignCannedResponseForm";
import { StyleSheetTestUtils } from "aphrodite";
import ThemeContext from "../../src/containers/context/ThemeContext";
import { muiTheme } from "../test_helpers";

describe("CampaignCannedResponseForm component", () => {
  // given
  const props1 = {
    formButtonText: "Edit Response",
    defaultValue: {
      id: 1,
      title: "Response1",
      text: "Response1 desc",
      tagIds: [1, 2]
    },
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
  };

  const props2 = {
    formButtonText: "Add Response",
    defaultValue: {},
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
  };

  // when
  test("Renders form with correct fields and label for editing", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <ThemeContext.Provider value={{ muiTheme }}>
        <CampaignCannedResponseForm {...props1} />
      </ThemeContext.Provider>
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
    expect(wrapper.find(AutoComplete).prop("value")).toEqual([
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

  test("Renders form with correct fields and label for adding", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <ThemeContext.Provider value={{ muiTheme }}>
        <CampaignCannedResponseForm {...props2} />
      </ThemeContext.Provider>
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
