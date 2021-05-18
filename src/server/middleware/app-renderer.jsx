import renderIndex from "./render-index";
import wrap from "../wrap";
import fs from "fs";
import path from "path";

const DEBUG =
  process.env.NODE_ENV === "development" || !!process.env.WEBPACK_HOT_RELOAD;

let assetMap = {
  "bundle.js": "/assets/bundle.js"
};

if (!DEBUG) {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      (process.env.ASSETS_DIR || "").startsWith(".")
        ? path.join(
            __dirname,
            "../../../../",
            process.env.ASSETS_DIR,
            process.env.ASSETS_MAP_FILE
          )
        : path.join(process.env.ASSETS_DIR, process.env.ASSETS_MAP_FILE)
    )
  );
  const staticBase = process.env.STATIC_BASE_URL || "/assets/";
  for (var a in assetMapData) {
    assetMap[a] = staticBase + assetMapData[a];
  }
}

export default wrap(async (req, res) => {
  const query = req.query ? encodeURIComponent(req.query) : "";
  if (!req.isAuthenticated() && !req.path.startsWith("/login")) {
    res.redirect(302, `/login?nextUrl=${req.path}${query}`);
    return;
  }
  res.send(renderIndex("", "", assetMap));
});
