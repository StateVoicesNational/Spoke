/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { UserMenu } from "../../src/containers/UserMenu";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

describe("UserMenu", () => {
  it("renders the correct user Avatar icon", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = {
      currentUser: {
        id: 1,
        displayName: "TestName",
        email: "test@test.com",
        superVolOrganizations: [
          {
            id: 2,
            name: "testOrg"
          }
        ],
        texterOrganizations: [
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
        superVolOrganizations: [],
        texterOrganizations: [
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

    // Make sure the menu loads
    const menuPopover = wrapper.find("Popover");
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuContentArray = menuPopover.props().children.props.children;
    const menuItems = menuContentArray.filter(
      item => item.type && item.type.muiName === "MenuItem"
    );

    // Check for each thing we always expect to see in the menu
    expect(menuItems[0].props["data-test"]).toBe("userMenuDisplayName");
    expect(menuItems[1].props["data-test"]).toBe("home");
    expect(menuItems[2].props["data-test"]).toBe("FAQs");
    expect(menuItems[3].props["data-test"]).toBe("userMenuLogOut");
  });
});
