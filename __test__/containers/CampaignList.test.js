/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { act } from "react-dom/test-utils";
import {
  render,
  screen,
  waitFor,
  cleanup
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StyleSheetTestUtils } from "aphrodite";

import { AdminCampaignList } from "../../src/containers/AdminCampaignList";

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});
afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
  cleanup();
});

describe("CampaignList", () => {
  const params = {
    adminPerms: true,
    organizationId: "77"
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
      },
      organization: {
        id: 77
      }
    };

    const data = {
      organization: {
        id: 77,
        cacheable: 2,
        campaigns: {
          campaigns: [campaignWithoutCreator],
          pageInfo: {
            limit: 100,
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
        <AdminCampaignList data={data} mutations={mutations} params={params} />
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
      completionStats: {},
      organization: {
        id: 1
      }
    };

    const data = {
      organization: {
        id: 1,
        cacheable: 2,
        campaigns: {
          campaigns: [campaignWithCreator],
          pageInfo: {
            limit: 100,
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
        <AdminCampaignList data={data} mutations={mutations} params={params} />
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
      id: "1",
      title: "test",
      creator: {
        displayName: "Lorem Ipsum"
      },
      completionStats: {},
      organization: {
        id: 1
      },
      timezone: "US/Eastern"
    };

    const data = {
      organization: {
        id: "1",
        cacheable: 2,
        campaigns: {
          campaigns: [campaignWithCreator],
          pageInfo: {
            limit: 100,
            offset: 0,
            total: 1
          }
        }
      },
      refetch: () => {}
    };

    test("Timezone column is displayed when timezone is current sort", async () => {
      StyleSheetTestUtils.suppressStyleInjection();
      act(() => {
        render(
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
        );
      });

      act(() => {
        userEvent.click(
          screen.getByRole("button", { name: /sort: created, newest/i }),
          { skipHover: true }
        );
      });

      act(() => {
        userEvent.click(
          screen.getByRole("option", { name: /sort: timezone/i }),
          { skipHover: true }
        );
      });

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: /timezone/i })
        ).toBeTruthy()
      );
    });

    test("Timezone column is hidden when it isn't the current sort", () => {
      StyleSheetTestUtils.suppressStyleInjection();
      act(() => {
        render(
          <AdminCampaignList
            data={data}
            mutations={mutations}
            params={params}
          />
        );
      });
      const timezoneButton = screen.queryByText("columnheader", {
        name: /timezone/i
      });
      expect(timezoneButton).toBeNull();
    });
  });
});
