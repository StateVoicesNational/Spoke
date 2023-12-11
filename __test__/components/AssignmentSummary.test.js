/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import each from "jest-each";
import { ApolloProvider } from '@apollo/client'
import ApolloClientSingleton from "../../src/network/apollo-client-singleton";
import { AssignmentSummaryBase as AssignmentSummary } from "../../src/components/AssignmentSummary";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import { muiTheme } from "../test_helpers";

function getAssignment({ isDynamic = false, counts = {} }) {
  return {
    id: "1",
    hasUnassignedContactsForTexter: 100,
    campaign: {
      id: "1",
      title: "New Campaign",
      description: "asdf",
      organization: {
        allowSendAll: window.ALLOW_SEND_ALL
      },
      useDynamicAssignment: isDynamic,
      hasUnassignedContacts: false,
      introHtml: "yoyo",
      primaryColor: "#2052d8",
      logoImageUrl: "",
      texterUIConfig: {
        options: "{}",
        sideboxChoices: isDynamic ? ["default-dynamicassignment"] : []
      }
    },
    ...counts
  };
}

describe("AssignmentSummary text", function t() {
  let summary;

  beforeEach(() => {
    summary = mount(
      <AssignmentSummary
        muiTheme={muiTheme}
        assignment={getAssignment({
          counts: {
            unmessagedCount: 1,
            unrepliedCount: 0,
            badTimezoneCount: 0,
            pastMessagesCount: 0,
            skippedMessagesCount: 0
          }
        })}
      />
    );
  });

  each([
    [0, false],
    [1, false],
    [0, true],
    [1, true]
  ]).test(
    "renders title and html for notInUSA=%s and allowSendAll=%s",
    (notInUSA, allowSendAll) => {
      window.NOT_IN_USA = notInUSA;
      window.ALLOW_SEND_ALL = allowSendAll;
      const title = summary.find(CardHeader);
      expect(title.prop("title")).toBe("New Campaign");

      const htmlWrapper = summary.findWhere(
        d => d.length && d.type() === "div" && d.prop("dangerouslySetInnerHTML")
      );
      expect(htmlWrapper.prop("dangerouslySetInnerHTML")).toEqual({
        __html: "yoyo"
      });
    }
  );
});

describe("AssignmentSummary actions when NOT AllowSendAll", () => {
  function create(
    unmessaged,
    unreplied,
    badTimezone,
    past,
    skipped,
    isDynamic
  ) {
    window.ALLOW_SEND_ALL = false;
    return mount(
      <ApolloProvider client={ApolloClientSingleton}>
        <AssignmentSummary
          muiTheme={muiTheme}
          assignment={getAssignment({
            isDynamic,
            counts: {
              allContactsCount:
                unmessaged + unreplied + badTimezone + past + skipped,
              unmessagedCount: unmessaged,
              unrepliedCount: unreplied,
              badTimezoneCount: badTimezone,
              pastMessagesCount: past,
              skippedMessagesCount: skipped
            }
          })}
        />
      </ApolloProvider>
    ).find(CardContent);
  }

  it('renders "send first texts (1)" with unmessaged (dynamic assignment)', () => {
    const actions = create(5, 0, 0, 0, 0, true);
    expect(
      actions
        .find(Badge)
        .at(0)
        .prop("badgeContent")
    ).toBe(5);
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Send first texts");
  });

  it('renders "send first texts (1)" with unmessaged (non-dynamic)', () => {
    const actions = create(1, 0, 0, 0, 0, false);
    expect(
      actions
        .find(Badge)
        .at(0)
        .prop("badgeContent")
    ).toBe(1);
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Send first texts");
  });

  it('renders "send first texts" with no unmessaged (dynamic assignment)', () => {
    const actions = create(0, 0, 0, 0, 0, true);
    // This button will come from the default-dynamicassignment texter-sidebox
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Start texting");
  });

  it('renders a "past messages" badge after messaged contacts', () => {
    const actions = create(0, 0, 0, 1, 0, false);
    expect(actions.find(Button).length).toBe(1);
  });

  it("renders two buttons with unmessaged and unreplied", () => {
    const actions = create(3, 9, 0, 0, 0, false);
    expect(actions.find(Button).length).toBe(2);
  });

  it('renders "past messages (n)" with messaged', () => {
    const actions = create(0, 0, 0, 9, 0, false);
    expect(
      actions
        .find(Button)
        .at(0)
        .prop("children")
    ).toBe("Past 9 Messages");
  });

  it('renders "skipped messages (n)" with messaged', () => {
    const actions = create(0, 0, 0, 0, 8, false);
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Skipped 8 Messages");
  });
});

describe("AssignmentSummary when AllowSendAll", () => {
  function create(
    unmessaged,
    unreplied,
    badTimezone,
    past,
    skipped,
    isDynamic
  ) {
    window.ALLOW_SEND_ALL = true;
    return mount(
      <AssignmentSummary
        muiTheme={muiTheme}
        assignment={getAssignment({
          isDynamic,
          counts: {
            unmessagedCount: unmessaged,
            unrepliedCount: unreplied,
            badTimezoneCount: badTimezone,
            pastMessagesCount: past,
            skippedMessagesCount: skipped
          }
        })}
      />
    ).find(CardContent);
  }

  it('renders "Send message" with unmessaged', () => {
    const actions = create(1, 0, 0, 0, 0, false);
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Send messages");
  });

  it('renders "Respond" with unreplied', () => {
    const actions = create(0, 1, 0, 0, 0, false);
    expect(
      actions
        .find(Button)
        .at(0)
        .text()
    ).toBe("Respond");
  });
});

it('renders "Send later" when there is a badTimezoneCount', () => {
  const actions = mount(
    <AssignmentSummary
      muiTheme={muiTheme}
      assignment={getAssignment({
        counts: {
          unmessagedCount: 0,
          unrepliedCount: 0,
          badTimezoneCount: 4,
          skippedMessagesCount: 0,
          pastMessagesCount: 0
        }
      })}
    />
  ).find(CardContent);
  expect(
    actions
      .find(Badge)
      .at(0)
      .prop("badgeContent")
  ).toBe(4);
  expect(
    actions
      .find(Button)
      .at(1)
      .text()
  ).toBe("Send later (outside timezone)");
  expect(
    actions
      .find(Button)
      .at(0)
      .text()
  ).toBe("Send messages");
});

describe("contacts filters", () => {
  // These are an attempt to confirm that the buttons will work.
  // It would be better to simulate clicking them, but I can't
  // get it to work right now because of 'react-tap-event-plugin'
  // some hints are here https://github.com/mui-org/material-ui/issues/4200#issuecomment-217738345
  // 'react-tap-event-plugin' was depricated

  it("filters correctly in USA", () => {
    window.NOT_IN_USA = 0;
    window.ALLOW_SEND_ALL = false;
    const mockRender = jest.fn();
    AssignmentSummary.prototype.renderBadgedButton = mockRender;
    mount(
      <AssignmentSummary
        muiTheme={muiTheme}
        assignment={getAssignment({
          counts: {
            unmessagedCount: 1,
            unrepliedCount: 1,
            badTimezoneCount: 4,
            skippedMessagesCount: 0
          }
        })}
      />
    );
    const sendFirstTexts = mockRender.mock.calls[0][0];
    expect(sendFirstTexts.title).toBe("Send first texts");
    expect(sendFirstTexts.contactsFilter).toBe("text");

    const sendReplies = mockRender.mock.calls[1][0];
    expect(sendReplies.title).toBe("Respond");
    expect(sendReplies.contactsFilter).toBe("reply");

    const sendLater = mockRender.mock.calls[2][0];
    expect(sendLater.title).toBe("Past Messages");
    expect(sendLater.contactsFilter).toBe("stale");

    const skippedMessages = mockRender.mock.calls[3][0];
    expect(skippedMessages.title).toBe("Skipped Messages");
    expect(skippedMessages.contactsFilter).toBe("skipped");
  });
  it("filters correctly out of USA", () => {
    window.NOT_IN_USA = 1;
    window.ALLOW_SEND_ALL = true;
    const mockRender = jest.fn();
    AssignmentSummary.prototype.renderBadgedButton = mockRender;
    mount(
      <AssignmentSummary
        muiTheme={muiTheme}
        assignment={getAssignment({
          counts: {
            unmessagedCount: 1,
            unrepliedCount: 1,
            badTimezoneCount: 4,
            skippedMessagesCount: 0
          }
        })}
      />
    );
    const respondMessages = mockRender.mock.calls[0][0];
    expect(respondMessages.title).toBe("Respond");
    expect(respondMessages.contactsFilter).toBe("reply");

    const sendMessages = mockRender.mock.calls[1][0];
    expect(sendMessages.title).toBe("Past Messages");
    expect(sendMessages.contactsFilter).toBe("stale");

    const skippedMessages = mockRender.mock.calls[2][0];
    expect(skippedMessages.title).toBe("Skipped Messages");
    expect(skippedMessages.contactsFilter).toBe("skipped");

    const sendFirstTexts = mockRender.mock.calls[3][0];
    expect(sendFirstTexts.title).toBe("Send messages");
    expect(sendFirstTexts.contactsFilter).toBe("text");
  });
});

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});
afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});
