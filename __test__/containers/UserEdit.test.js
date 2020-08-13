/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { UserEdit } from "../../src/containers/UserEdit";
import { StyleSheetTestUtils } from "aphrodite";

describe("User edit page", () => {
  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = mount(
    <MuiThemeProvider>
      <UserEdit />
    </MuiThemeProvider>
  );

  test("Render edit page with standard fields", () => {
    expect(wrapper.exists({name: "email"})).toBeTruthy();
    expect(wrapper.exists({name: "firstName"})).toBeTruthy();
    expect(wrapper.exists({name: "extra.foo"})).toBeFalsy();
  });

  test("Render edit page with extra profile fields", () => {
    const org = {
      organization: {
        profileFields: [{
          name: 'foo',
          label: 'Foo'
        }]
      }
    };
    wrapper.find(UserEdit).setState({currentOrg: org});

    expect(wrapper.exists({name: "email"})).toBeTruthy();
    expect(wrapper.exists({name: "firstName"})).toBeTruthy();
    expect(wrapper.exists({name: "extra.foo"})).toBeTruthy();
  });

});
