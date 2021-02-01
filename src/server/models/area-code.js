import thinky from "./thinky";
const type = thinky.type;
import { optionalString, requiredString } from "./custom-types";

const AreaCode = thinky.createModel(
  "area_code",
  type
    .object()
    .schema({
      area_code: requiredString(),
      location: optionalString(),
      country: optionalString(),
      overlay_area_codes: optionalString(),
      state_area_codes: optionalString()
    })
    .allowExtra(false),
  { pk: "area_code", noAutoCreation: true }
);

export default AreaCode;
