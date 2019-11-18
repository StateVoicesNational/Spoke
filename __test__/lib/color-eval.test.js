import {
  parseRgbValues,
  convertHexToRgb,
  convertHslToRgb,
  calcBrightness,
  setContrastingColor
} from "../../src/lib/color-eval";

import theme from "../../src/styles/theme";

describe("test parseRgbValues", () => {
  it("handles rgba string correctly", () => {
    expect(parseRgbValues("rgba(100, 100, 100, 1)")).toEqual({
      r: 100,
      g: 100,
      b: 100,
      alpha: 100
    });
  });

  it("handles rgb string correctly", () => {
    expect(parseRgbValues("rgb(100, 100, 100)")).toEqual({
      r: 100,
      g: 100,
      b: 100,
      alpha: 100
    });
  });
});

describe("test convertHexToRgb", () => {
  it("handles 6-digit hex string correctly", () => {
    expect(convertHexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("handles 3-digit hex string correctly", () => {
    expect(convertHexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("test convertHslToRgb", () => {
  it("handles hsla string correctly", () => {
    expect(convertHslToRgb("hsla(0, 0%, 100%, 1)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      alpha: 100
    });
  });

  it("handles hsl string correctly", () => {
    expect(convertHslToRgb("hsl(0, 0%, 100%)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      alpha: 100
    });
  });
});

describe("test calcBrightness", () => {
  it("handles rgb string correctly", () => {
    expect(calcBrightness("rgb(255, 255, 255)")).toEqual({
      brightness: 255,
      alpha: 100
    });
  });

  it("handles rgba string correctly", () => {
    expect(calcBrightness("rgb(255, 255, 255, 1)")).toEqual({
      brightness: 255,
      alpha: 100
    });
  });

  it("handles hsl string correctly", () => {
    expect(calcBrightness("hsla(0, 0%, 100%)")).toEqual({
      brightness: 255,
      alpha: 100
    });
  });

  it("handles hsla string correctly", () => {
    expect(calcBrightness("hsla(0, 0%, 100%, 1)")).toEqual({
      brightness: 255,
      alpha: 100
    });
  });

  it("handles hex string correctly", () => {
    expect(calcBrightness("#fff")).toEqual({
      brightness: 255,
      alpha: undefined
    });
  });

  it("handles incorrectly formatted string correctly", () => {
    expect(calcBrightness("incorrect")).toEqual({
      brightness: undefined,
      alpha: undefined
    });
  });
});

describe("test setContrastingColor", () => {
  it("returns theme.colors.darkGray when a light primary color is passed in", () => {
    expect(setContrastingColor("#fff")).toEqual(theme.colors.darkGray);
  });

  it("returns theme.colors.white when a dark primary color is passed in", () => {
    expect(setContrastingColor("#000")).toEqual(theme.colors.white);
  });

  it("returns theme.colors.darkGray when a color is passed in with an opacity of less than .5", () => {
    expect(setContrastingColor("rgba(0, 0, 0, .4)")).toEqual(
      theme.colors.darkGray
    );
  });
});
