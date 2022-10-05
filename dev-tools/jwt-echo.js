const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const express = require("express");

var bodyParser = require("body-parser");
const port = 3001;
const app = express();

dotenv.config();

app.get("/spoke", (req, res) => {
  res.send(
    `<html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/picnic/7.1.0/picnic.min.css" referrerpolicy="no-referrer" />
      </head>
      <body style="height: 100%; padding: 70px">
      <article class="card" style="width: 500px; margin: auto;">
        <form action="/auth" method="POST">
        <header>
          <h3>Log in as</h3>
        </header>
        <div style="margin: 1rem">
          <input name="name" type="text" placeholder="Name" />
        </div>
        <div style="margin: 1rem">
          <input name="email" type="email" placeholder="Email" />
        </div>
        <input name="callback" type="hidden" value="${req.query.callback}" />
        <footer>
          <button type="submit">Log  in</button>
        </footer>
        </form>
      </article>
      </body>
    </html>`
  );
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/auth", (req, res) => {
  const callbackUrl = new URL(req.body.callback);
  const token = {
    sub: req.body.email || "admin@spoke.test",
    name: req.body.name,
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
