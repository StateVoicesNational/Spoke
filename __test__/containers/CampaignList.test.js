/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CampaignList } from "../../src/containers/CampaignList";
import { StyleSheetTestUtils } from "aphrodite";

describe("CampaignList", () => {
  const mutations = {
    archiveCampaign: () => {},
    unarchiveCampaign: () => {}
  };

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
        id: 77,
        cacheable: 2,
        campaigns: {
          campaigns: [campaignWithoutCreator],
          pageInfo: {
            limit: 1000,
            offset: 0,
            total: 1
          }
        }
      }
    };

    // when
    test("Renders for campaign with null creator, doesn't include created by", () => {
      StyleSheetTestUtils.suppressStyleInjection();
      const wrapper = mount(
        <MuiThemeProvider>
          <CampaignList data={data} mutations={mutations} adminPerms={true} />
        </MuiThemeProvider>
      );
      const text = wrapper.text();
      expect(text.includes("Created by")).toBeFalsy();
      expect(text.includes("Yes on A")).toBeTruthy();
      expect(text).toMatch(/Archive/);
      expect(text).toMatch(/1202/);
      expect(text).toMatch(/1101/);
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
        id: 1,
        cacheable: 2,
        campaigns: {
          campaigns: [campaignWithCreator],
          pageInfo: {
            limit: 1000,
            offset: 0,
            total: 1
          }
        }
      }
    };

    // when
    test("Renders for campaign with creator, includes created by", () => {
      StyleSheetTestUtils.suppressStyleInjection();
      const wrapper = mount(
        <MuiThemeProvider>
          <CampaignList data={data} mutations={mutations} />
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
});
