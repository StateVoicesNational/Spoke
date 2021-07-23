/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { AdminCampaignList } from "../../src/containers/AdminCampaignList";
import { TIMEZONE_SORT } from "../../src/components/AdminCampaignList/SortBy";
import { StyleSheetTestUtils } from "aphrodite";

describe("CampaignList", () => {
  const params = {
    adminPerms: true,
    organizationId: 77
  };

  const mutations = {
    createCampaign: () => {},
    archiveCampaigns: () => {},
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
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
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
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
        </MuiThemeProvider>
      );
      expect(
        wrapper.containsMatchingElement(
          <span> &mdash; Created by Lorem Ipsum</span>
        )
      ).toBeTruthy();
    });
  });

  describe("Campaign list sorting", () => {
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

    test("Timezone column is displayed when timezone is current sort", () => {
      const wrapper = mount(
        <MuiThemeProvider>
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
        </MuiThemeProvider>
      );
      wrapper.childAt(0).setState({
        sortBy: TIMEZONE_SORT.value
      });
      expect(
        wrapper.containsMatchingElement(<span>Timezone</span>)
      ).toBeTruthy();
    });

    test("Timezone column is hidden when it isn't the current sort", () => {
      const wrapper = mount(
        <MuiThemeProvider>
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
        </MuiThemeProvider>
      );
      expect(
        wrapper.containsMatchingElement(<span>Timezone</span>)
      ).toBeFalsy();
    });
  });
});
