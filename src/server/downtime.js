import "babel-polyfill";
import bodyParser from "body-parser";
import express from "express";
import { log } from "../lib";
import renderIndex from "./middleware/render-index";

// This server is for when it is in downtime mode and we just statically
// serve the client app

const DEBUG = process.env.NODE_ENV === "development";

const app = express();
const port = process.env.DEV_APP_PORT || process.env.PORT;
// Don't rate limit heroku
app.enable("trust proxy");

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path !== "/downtime") {
    res.redirect(302, "/downtime");
  } else {
    res.send(
      renderIndex("", "", {
        "bundle.js": "/assets/bundle.js"
      })
    );
  }
  next();
});

if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });
}

export default app;
