/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { Tags } from "../../src/containers/Tags";
import { StyleSheetTestUtils } from "aphrodite";

describe("Tags list with several tags", () => {
  // given

  const data = {
    organization: {
      tags: [
        {
          id: "1",
          name: "Tag1",
          description: "Tag1desc",
          isDeleted: false,
          organizationId: "1",
          group: null
        },
        {
          id: "2",
          name: "Tag2",
          description: "Tag2desc",
          isDeleted: false,
          organizationId: "1",
          group: null
        }
      ]
    }
  };

  // when
  test("Renders cards with tag name and description", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <MuiThemeProvider>
        <Tags data={data} />
      </MuiThemeProvider>
    );
    const card1 = wrapper.find({ id: "1" }).find("Card");
    expect(card1.text().includes("Tag1")).toBeTruthy();
    expect(card1.text().includes("Tag1desc")).toBeTruthy();
    const card2 = wrapper.find({ id: "2" }).find("Card");
    expect(card2.text().includes("Tag2")).toBeTruthy();
    expect(card2.text().includes("Tag2desc")).toBeTruthy();
  });
});
