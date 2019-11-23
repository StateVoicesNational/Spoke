import { setContrastingColor } from "../../src/lib/color-contrast-helper";

import theme from "../../src/styles/theme";

describe("test setContrastingColor", () => {
  it("returns darkGray when a light color is passed in", () => {
    expect(setContrastingColor("#fff")).toEqual(theme.colors.darkGray);
  });

  it("returns white when a dark color is passed in", () => {
    expect(setContrastingColor("#000")).toEqual(theme.colors.white);
  });

  it("returns darkGray when a color is passed in with an opacity of less than .4", () => {
    expect(setContrastingColor("rgba(0, 0, 0, .39)")).toEqual(
      theme.colors.darkGray
    );
  });

  it("returns darkGray when an invalid color is passed in", () => {
    expect(setContrastingColor("incorrect")).toEqual(theme.colors.darkGray);
  });
});
