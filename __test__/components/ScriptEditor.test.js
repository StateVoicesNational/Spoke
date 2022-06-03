import React from "react";
import { shallow } from "enzyme";
import { Editor } from "draft-js";

import ScriptEditor from "../../src/components/ScriptEditor";
import { sleep } from "../test_helpers";

describe("ScriptEditor component", async () => {
  test("re-encodes unicode easy-wins for GSM", () => {
    const wrapper = shallow(
      <ScriptEditor
        scriptFields={["Field1"]}
        scriptText={"f✱xx and «foo« ― dash"}
        onChange={editorState => {}}
        name={"Canned Response"}
      />
    );
    const editor = wrapper.find(Editor);
    expect(editor.prop("name")).toBe("Canned Response");
    expect(wrapper.instance().getValue()).toBe('f*xx and "foo" - dash');
  });

  test("readyToAdd is delayed to avoid mouse race-conditions", async () => {
    const wrapper = shallow(
      <ScriptEditor
        scriptFields={["Field1"]}
        scriptText={"f✱xx and «foo« ― dash"}
        onChange={editorState => {}}
        name={"Canned Response"}
      />
    );
    expect(wrapper.state().readyToAdd).toEqual(false);
    await sleep(300); // wait until it's ready: see readyToAdd in component
    expect(wrapper.state().readyToAdd).toEqual(true);
  });
});
