/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CampaignList } from "../../src/containers/CampaignList";

describe("Campaign list for campaign with null creator", () => {
  // given
  const campaignWithoutCreator = {
    id: 1,
    title: "Yes on A",
    creator: null,
    isStarted: true,
    completionStats: {
      contactsCount: 1300,
      messagedCount: 98,
      assignedCount: 199
    }
  };

  const data = {
    organization: {
      id: 1,
      cacheable: 2,
      campaigns: {
        campaigns: [campaignWithoutCreator]
      }
    }
  };

  // when
  test("Renders for campaign with null creator, doesn't include created by", () => {
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} adminPerms={true} />
      </MuiThemeProvider>
    );
    expect(wrapper.text().includes("Created by")).toBeFalsy();
    expect(wrapper.text()).toMatch(/Archive/);
    expect(wrapper.text()).toMatch(/1202/);
    expect(wrapper.text()).toMatch(/1101/);
  });
});

describe("Campaign list for campaign with creator", () => {
  // given
  const campaignWithCreator = {
    id: 1,
    creator: {
      displayName: "Lorem Ipsum"
    },
    completionStats: {}
  };

  const data = {
    organization: {
      campaigns: {
        campaigns: [campaignWithCreator]
      }
    }
  };

  // when
  test("Renders for campaign with creator, includes created by", () => {
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} adminPerms={false} />
      </MuiThemeProvider>
    );
    expect(
      wrapper.containsMatchingElement(
        <span> &mdash; Created by Lorem Ipsum</span>
      )
    ).toBeTruthy();
    expect(wrapper.text()).not.toMatch(/Archive/);
  });
});
