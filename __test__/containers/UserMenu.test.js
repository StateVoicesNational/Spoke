/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import Avatar from "@material-ui/core/Avatar";
import Popover from "@material-ui/core/Popover";

import { UserMenuBase } from "../../src/containers/UserMenu";
import { muiTheme } from "../test_helpers";

function getData(isSuperAdmin = false) {
  return {
    currentUser: {
      id: 1,
      displayName: "TestName",
      email: "test@test.com",
      is_superadmin: isSuperAdmin,
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
}

function getWrapper(data) {
  return mount(<UserMenuBase muiTheme={muiTheme} currentUser={data} />).find(
    UserMenuBase
  );
}

describe("UserMenu", () => {
  it("renders the correct user Avatar icon", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = getData();
    const wrapper = getWrapper(data);

    const avatar = wrapper.find(Avatar);
    expect(avatar.props().children).toBe(
      data.currentUser.displayName.charAt(0)
    );
  });

  it("renders the full popover menu", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = getData();
    const wrapper = getWrapper(data);

    // Make sure the menu loads
    const menuPopover = wrapper.find(Popover);
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuContentArray = menuPopover.props().children.props.children;
    const menuItems = menuContentArray.filter(
      item =>
        item.type &&
        item.type.options &&
        item.type.options.name === "MuiMenuItem"
    );

    // Check for each thing we always expect to see in the menu
    expect(menuItems[0].props["data-test"]).toBe("userMenuDisplayName");
    expect(menuItems[1].props["data-test"]).toBe("home");
    expect(menuItems[2].props["data-test"]).toBe("FAQs");
    expect(menuItems[3].props["data-test"]).toBe("userMenuLogOut");
  });

  it("renders admin tools if user is superadmin and MULTI_TENTANT", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = getData("true");
    const wrapper = getWrapper(data);
    window.MULTI_TENTANT = true;

    // Make sure the menu loads
    const menuPopover = wrapper.find(Popover);
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuContentArray = menuPopover.props().children.props.children;
    const menuItems = menuContentArray.filter(
      item =>
        item.type &&
        ((item.type &&
          item.type.options &&
          item.type.options.name === "MuiMenuItem") ||
          item.type === "div")
    );

    // Check for each thing we always expect to see in the menu
    expect(menuItems[0].props["data-test"]).toBe("userMenuDisplayName");
    expect(menuItems[1].key).toBe(null); // div containing rendered AdminTools
    expect(menuItems[2].props["data-test"]).toBe("home");
    expect(menuItems[3].props["data-test"]).toBe("FAQs");
    expect(menuItems[4].props["data-test"]).toBe("userMenuLogOut");
  });

  it("DOESN'T render admin tools if user is NOT superadmin and MULTI_TENTANT", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = getData();
    const wrapper = getWrapper(data);
    window.MULTI_TENTANT = true;

    // Make sure the menu loads
    const menuPopover = wrapper.find(Popover);
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuContentArray = menuPopover.props().children.props.children;
    const menuItems = menuContentArray.filter(
      item =>
        item.type &&
        ((item.type &&
          item.type.options &&
          item.type.options.name === "MuiMenuItem") ||
          item.type === "div")
    );

    // Check for each thing we always expect to see in the menu
    expect(menuItems[0].props["data-test"]).toBe("userMenuDisplayName");
    expect(menuItems[2].props["data-test"]).toBe("home");
    expect(menuItems[3].props["data-test"]).toBe("FAQs");
    expect(menuItems[4].props["data-test"]).toBe("userMenuLogOut");
  });

  it("DOESN'T render admin tools if user is NOT superadmin and NOT MULTI_TENTANT", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = getData();
    const wrapper = getWrapper(data);
    window.MULTI_TENTANT = false;

    // Make sure the menu loads
    const menuPopover = wrapper.find(Popover);
    expect(menuPopover.length).toBeGreaterThan(0);

    const menuContentArray = menuPopover.props().children.props.children;
    const menuItems = menuContentArray.filter(
      item =>
        item.type &&
        ((item.type &&
          item.type.options &&
          item.type.options.name === "MuiMenuItem") ||
          item.type === "div")
    );

    // Check for each thing we always expect to see in the menu
    expect(menuItems[0].props["data-test"]).toBe("userMenuDisplayName");
    expect(menuItems[2].props["data-test"]).toBe("home");
    expect(menuItems[3].props["data-test"]).toBe("FAQs");
    expect(menuItems[4].props["data-test"]).toBe("userMenuLogOut");
  });
});
