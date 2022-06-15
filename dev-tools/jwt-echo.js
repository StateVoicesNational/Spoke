const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const express = require("express");

const port = 3001;
const app = express();

dotenv.config();

app.get("/spoke", (req, res) => {
  const callbackUrl = new URL(req.query.callback);
  const token = {
    sub: req.query.sub || "admin@spoke.test",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iss: process.env.TOKEN_AUTH_ISSUER,
    aud: process.env.TOKEN_AUTH_AUDIENCE
  };
  const signed = jwt.sign(token, process.env.TOKEN_AUTH_SHARED_SECRET);

  callbackUrl.searchParams.set("jwt", signed);
  res.redirect(callbackUrl.toString());
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
