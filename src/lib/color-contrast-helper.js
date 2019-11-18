import theme from "../styles/theme";

export const parseRgbValues = color => {
  let rgbColorValuesArray = color
    .slice(color.indexOf("(") + 1, color.indexOf(")"))
    .split(",");

  const r = parseInt(rgbColorValuesArray[0]);
  const g = parseInt(rgbColorValuesArray[1]);
  const b = parseInt(rgbColorValuesArray[2]);
  const alpha = rgbColorValuesArray[3]
    ? parseInt(rgbColorValuesArray[3] * 100)
    : 100;
  return { r, g, b, alpha };
};

export const convertHexToRgb = color => {
  let hexcolor = color.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.replace(/(.)/g, "$1$1");
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  return { r, g, b };
};

export const convertHslToRgb = color => {
  let hslColorValuesArray = color
    .slice(color.indexOf("(") + 1, color.indexOf(")"))
    .replace(/(%)/g, "")
    .split(",");

  const h = hslColorValuesArray[0];
  const s = hslColorValuesArray[1] / 100;
  const l = hslColorValuesArray[2] / 100;
  const alpha = hslColorValuesArray[3]
    ? parseInt(hslColorValuesArray[3] * 100)
    : 100;

  const val1 = (1 - Math.abs(2 * l - 1)) * s;
  const val2 = val1 * (1 - Math.abs(((h / 60) % 2) - 1));
  const val3 = l - val1 / 2;

  let r, g, b;

  if (h >= 0 && h < 60) {
    r = val1;
    g = val2;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = val2;
    g = val1;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = val1;
    b = val2;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = val2;
    b = val1;
  } else if (h >= 240 && h < 300) {
    r = val2;
    g = 0;
    b = val1;
  } else if (h >= 300 && h < 360) {
    r = val1;
    g = 0;
    b = val2;
  }

  r = Math.round((r + val3) * 255);
  g = Math.round((g + val3) * 255);
  b = Math.round((b + val3) * 255);
  return { r, g, b, alpha };
};

export const calcBrightness = primaryColor => {
  const W3CBrightnessFormula = (red, green, blue) =>
    Math.floor((red * 299 + green * 587 + blue * 114) / 1000);

  switch (primaryColor[0]) {
    case "r": {
      const { r, g, b, alpha } = parseRgbValues(primaryColor);
      const brightness = W3CBrightnessFormula(r, g, b);
      return { brightness, alpha };
    }
    case "#": {
      const { r, g, b, alpha } = convertHexToRgb(primaryColor);
      const brightness = W3CBrightnessFormula(r, g, b);
      return { brightness, alpha };
    }
    case "h": {
      const { r, g, b, alpha } = convertHslToRgb(primaryColor);
      const brightness = W3CBrightnessFormula(r, g, b);
      return { brightness, alpha };
    }

    default:
      return { brightness: undefined, alpha: undefined };
  }
};

export const setContrastingColor = primaryColor => {
  const { brightness, alpha } = calcBrightness(primaryColor);
  const threshhold = 160;
  const color =
    brightness > threshhold ||
    (alpha && alpha < 50) ||
    brightness === undefined ||
    isNaN(brightness)
      ? theme.colors.darkGray
      : theme.colors.white;
  return color;
};
