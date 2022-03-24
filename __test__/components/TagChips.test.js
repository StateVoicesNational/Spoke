/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import TagChips from "../../src/components/TagChips";
import { StyleSheetTestUtils } from "aphrodite";
import ThemeContext from "../../src/containers/context/ThemeContext";
import { muiTheme } from "../test_helpers";

describe("TagChips component", () => {
  // given

  const tags = [
    {
      id: 1,
      name: "Tag1"
    },
    {
      id: 2,
      name: "Tag2"
    }
  ];

  const tagIds = [1, 2, 3];

  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = mount(
    <ThemeContext.Provider value={{ muiTheme }}>
      <TagChips tags={tags} tagIds={tagIds} />
    </ThemeContext.Provider>
  );

  // when

  test("Renders TagChip components with correct text if a tagId is present", () => {
    expect(
      wrapper
        .find("TagChip")
        .at(0)
        .prop("text")
    ).toBe("Tag1");
    expect(
      wrapper
        .find("TagChip")
        .at(1)
        .prop("text")
    ).toBe("Tag2");
    expect(
      wrapper
        .find("TagChip")
        .at(2)
        .exists()
    ).toBeFalsy();
  });
});
