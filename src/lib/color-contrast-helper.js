import theme from "../styles/theme";

const tinycolor = require("tinycolor2");

export const setContrastingColor = color => {
  const colorIsValid = tinycolor(color).isValid();
  const brightness = tinycolor(color).getBrightness();
  const alpha = tinycolor(color).getAlpha();

  const brightnessThreshhold = 160;
  const alphaThreshhold = 0.4;

  const contrastingColor =
    brightness > brightnessThreshhold ||
    alpha < alphaThreshhold ||
    !colorIsValid
      ? theme.colors.darkGray
      : theme.colors.white;
  return contrastingColor;
};
