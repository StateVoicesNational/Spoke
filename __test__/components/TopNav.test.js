import React from "react";

import { shallow } from "enzyme";
import TopNav from "../../src/components/TopNav";

describe("TopNav component", () => {
  // given
  const orgId = "1";
  const wrapper = shallow(<TopNav orgId={orgId} />);

  // when
  test("Renders UserMenu with orgId", () => {
    const UserMenu = wrapper.find("UserMenu");

    // then
    expect(UserMenu.prop("orgId")).toBe("1");
  });
});
