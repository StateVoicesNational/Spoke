/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { ApolloProvider } from "react-apollo";
import { UserMenu } from "../../src/containers/UserMenu";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

import Avatar from "material-ui/Avatar";

describe("UserMenu", () => {
  it("becomes active when the user icon is clicked", async () => {
    StyleSheetTestUtils.suppressStyleInjection();

    const data = {
      currentUser: {
        id: 1,
        displayName: "Ilona",
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
    const component = wrapper.instance();
    const avatar = wrapper.find("Avatar");
    console.log(
      "AVATAR ",
      avatar,
      component,
      "XXX ",
      avatar.props().children,
      " XXX"
    );
    const nameMenuItem = wrapper.find("MenuItem");
    console.log("MENU ITEM ", nameMenuItem);
  });
});
