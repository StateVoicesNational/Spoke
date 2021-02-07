import "babel-polyfill";
import bodyParser from "body-parser";
import express from "express";
import { log } from "../lib";
import renderIndex from "./middleware/render-index";
import fs from "fs";
import { existsSync } from "fs";
import path from "path";

// This server is for when it is in downtime mode and we just statically
// serve the client app

const DEBUG = process.env.NODE_ENV === "development";

const app = express();
const port = process.env.DEV_APP_PORT || process.env.PORT;
// Don't rate limit heroku
app.enable("trust proxy");

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets
if (existsSync(process.env.ASSETS_DIR)) {
  app.use(
    "/assets",
    express.static(process.env.ASSETS_DIR, {
      maxAge: "180 days"
    })
  );
}

let assetMap = {
  "bundle.js": "/assets/bundle.js"
};
if (process.env.NODE_ENV === "production") {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      (process.env.ASSETS_DIR || "").startsWith(".")
        ? path.join(
            __dirname,
            "../../../",
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

app.use((req, res, next) => {
  if (req.path !== "/downtime") {
    if (/twilio|nexmo/.test(req.path) && process.env.DOWNTIME_NO_DB) {
      res.status(500).send("Server is down");
    } else {
      res.redirect(302, "/downtime");
    }
  } else {
    res.send(renderIndex("", "", assetMap));
  }
  next();
});

if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });
}

export default app;
