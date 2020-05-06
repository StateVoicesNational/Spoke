/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import injectTapEventPlugin from "react-tap-event-plugin";
import each from "jest-each";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CardActions, CardTitle } from "material-ui/Card";
import { AssignmentSummary } from "../src/components/AssignmentSummary";
import Badge from "material-ui/Badge/Badge";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";

function getAssignment(isDynamic = false) {
  return {
    id: "1",
    campaign: {
      id: "1",
      title: "New Campaign",
      description: "asdf",
      useDynamicAssignment: isDynamic,
      hasUnassignedContacts: false,
      introHtml: "yoyo",
      primaryColor: "#2052d8",
      logoImageUrl: ""
    }
  };
}

describe("AssignmentSummary text", function t() {
  beforeEach(() => {
    this.summary = mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment()}
          unmessagedCount={1}
          unrepliedCount={0}
          badTimezoneCount={0}
          pastMessagesCount={0}
          skippedMessagesCount={0}
        />
      </MuiThemeProvider>
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
      const title = this.summary.find(CardTitle);
      expect(title.prop("title")).toBe("New Campaign");
      // expect(title.find(CardTitle).prop('subtitle')).toBe('asdf - Jan 31 2018')

      const htmlWrapper = this.summary.findWhere(
        d => d.length && d.type() === "div" && d.prop("dangerouslySetInnerHTML")
      );
      expect(htmlWrapper.prop("dangerouslySetInnerHTML")).toEqual({
        __html: "yoyo"
      });
    }
  );
});

describe("AssignmentSummary actions inUSA and NOT AllowSendAll", () => {
  injectTapEventPlugin(); // prevents warning
  function create(
    unmessaged,
    unreplied,
    badTimezone,
    past,
    skipped,
    isDynamic
  ) {
    window.NOT_IN_USA = 0;
    window.ALLOW_SEND_ALL = false;
    return mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment(isDynamic)}
          unmessagedCount={unmessaged}
          unrepliedCount={unreplied}
          badTimezoneCount={badTimezone}
          pastMessagesCount={past}
          skippedMessagesCount={skipped}
        />
      </MuiThemeProvider>
    ).find(CardActions);
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
        .find(RaisedButton)
        .at(0)
        .prop("label")
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
        .find(RaisedButton)
        .at(0)
        .prop("label")
    ).toBe("Send first texts");
  });

  it('renders "send first texts" with no unmessaged (dynamic assignment)', () => {
    const actions = create(0, 0, 0, 0, 0, true);
    expect(
      actions
        .find(RaisedButton)
        .at(0)
        .prop("label")
    ).toBe("Send first texts");
  });

  it('renders a "past messages" badge after messaged contacts', () => {
    const actions = create(0, 0, 0, 1, 0, false);
    expect(actions.find(RaisedButton).length).toBe(1);
  });

  it("renders two buttons with unmessaged and unreplied", () => {
    const actions = create(3, 9, 0, 0, 0, false);
    expect(actions.find(RaisedButton).length).toBe(2);
  });

  it('renders "past messages (n)" with messaged', () => {
    const actions = create(0, 0, 0, 9, 0, false);
    expect(
      actions
        .find(Badge)
        .at(0)
        .prop("badgeContent")
    ).toBe(9);
    expect(
      actions
        .find(RaisedButton)
        .at(0)
        .prop("label")
    ).toBe("Past Messages");
  });
});

describe("AssignmentSummary NOT inUSA and AllowSendAll", () => {
  function create(
    unmessaged,
    unreplied,
    badTimezone,
    past,
    skipped,
    isDynamic
  ) {
    window.NOT_IN_USA = 1;
    window.ALLOW_SEND_ALL = true;
    return mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment(isDynamic)}
          unmessagedCount={unmessaged}
          unrepliedCount={unreplied}
          badTimezoneCount={badTimezone}
          pastMessagesCount={past}
          skippedMessagesCount={skipped}
        />
      </MuiThemeProvider>
    ).find(CardActions);
  }

  it('renders "Send message" with unmessaged', () => {
    const actions = create(1, 0, 0, 0, 0, false);
    expect(
      actions
        .find(RaisedButton)
        .at(0)
        .prop("label")
    ).toBe("Send messages");
  });

  it('renders "Send messages" with unreplied', () => {
    const actions = create(0, 1, 0, 0, 0, false);
    expect(
      actions
        .find(RaisedButton)
        .at(0)
        .prop("label")
    ).toBe("Send messages");
  });
});

it('renders "Send later" when there is a badTimezoneCount', () => {
  const actions = mount(
    <MuiThemeProvider>
      <AssignmentSummary
        assignment={getAssignment()}
        unmessagedCount={0}
        unrepliedCount={0}
        badTimezoneCount={4}
        skippedMessagesCount={0}
      />
    </MuiThemeProvider>
  ).find(CardActions);
  expect(
    actions
      .find(Badge)
      .at(1)
      .prop("badgeContent")
  ).toBe(4);
  expect(
    actions
      .find(RaisedButton)
      .at(0)
      .prop("label")
  ).toBe("Past Messages");
  expect(
    actions
      .find(RaisedButton)
      .at(1)
      .prop("label")
  ).toBe("Send messages");
});

describe("contacts filters", () => {
  // These are an attempt to confirm that the buttons will work.
  // It would be better to simulate clicking them, but I can't
  // get it to work right now because of 'react-tap-event-plugin'
  // some hints are here https://github.com/mui-org/material-ui/issues/4200#issuecomment-217738345

  it("filters correctly in USA", () => {
    window.NOT_IN_USA = 0;
    window.ALLOW_SEND_ALL = false;
    const mockRender = jest.fn();
    AssignmentSummary.prototype.renderBadgedButton = mockRender;
    mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment()}
          unmessagedCount={1}
          unrepliedCount={1}
          badTimezoneCount={4}
          skippedMessagesCount={0}
        />
      </MuiThemeProvider>
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
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment()}
          unmessagedCount={1}
          unrepliedCount={1}
          badTimezoneCount={4}
          skippedMessagesCount={0}
        />
      </MuiThemeProvider>
    );
    const sendMessages = mockRender.mock.calls[0][0];
    expect(sendMessages.title).toBe("Past Messages");
    expect(sendMessages.contactsFilter).toBe("stale");

    const skippedMessages = mockRender.mock.calls[1][0];
    expect(skippedMessages.title).toBe("Skipped Messages");
    expect(skippedMessages.contactsFilter).toBe("skipped");

    const sendFirstTexts = mockRender.mock.calls[2][0];
    expect(sendFirstTexts.title).toBe("Send messages");
    expect(sendFirstTexts.contactsFilter).toBe("all");
  });
});

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});
afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});
