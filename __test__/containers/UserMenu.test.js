/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { UserMenu } from "../../src/containers/UserMenu";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import Menu from "material-ui/Menu";

describe("UserMenu", () => {
  it("renders the correct user Avatar icon", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = {
      currentUser: {
        id: 1,
        displayName: "TestName",
        email: "test@test.com",
        organizations: [
          {
            id: 2,
            name: "testOrg"
          }
        ]
      }
    };

    const wrapper = mount(
      <MuiThemeProvider>
        <UserMenu data={data} />
      </MuiThemeProvider>
    ).find(UserMenu);

    const avatar = wrapper.find("Avatar");
    expect(avatar.props().children).toBe(
      data.currentUser.displayName.charAt(0)
    );
  });

  it("renders the full popover menu", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = {
      currentUser: {
        id: 1,
        displayName: "TestName",
        email: "test@test.com",
        organizations: [
          {
            id: 2,
            name: "testOrg"
          }
        ]
      }
    };

    const wrapper = mount(
      <MuiThemeProvider>
        <UserMenu data={data} />
      </MuiThemeProvider>
    ).find(UserMenu);

    // const nameMenuItem = wrapper.find("MenuItem");
    // The popover loads as an object
    const menuPopover = wrapper.find("Popover");
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuItemArray = menuPopover.props().children.props.children;

    // First MenuItem should always be the user's display name
    expect(menuItemArray[0].props["data-test"]).toBe("userMenuDisplayName");

    // Second MenuItem will be a divider
    console.log("MENU ITEM ", menuItemArray[1]);
  });
});
