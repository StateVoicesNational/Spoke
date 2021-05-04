import AuthHasher from "passport-local-authenticate";
import wrap from "../../../server/wrap";
import { log } from "../../../lib";
import { getConfig } from "../../../server/api/lib/config";

export {
  getServiceConfig,
  buyNumbersInAreaCode,
  deleteNumbersInAreaCode,
  createMessagingService, // Bandwidth calls these 'applications'
  deleteMessagingService,
  updateConfig,
  fullyConfigured
} from "./setup-and-numbers";

import {
  sendMessage,
  handleIncomingMessage,
  handleDeliveryReport,
  errorDescription
} from "./messaging";

export {
  sendMessage,
  handleIncomingMessage,
  handleDeliveryReport,
  errorDescription
};

export const getMetadata = () => ({
  supportsOrgConfig: !getConfig("SERVICE_VENDOR_NO_ORGCONFIG", null, {
    truthy: true
  }),
  name: "bandwidth"
});

const webhooks = {
  "message-delivered": handleDeliveryReport,
  "message-failed": handleDeliveryReport,
  "message-received": handleIncomingMessage,
  "message-sending": () => Promise.resolve() // ignore MMS intermediate state
};

function verifyBandwidthServer(hashPassword) {
  return new Promise((resolve, reject) => {
    // maybe create an hmac
    const [salt, hash] = hashPassword.split(":");
    AuthHasher.verify(
      `${getConfig("SESSION_SECRET")}:bandwidth.com`,
      { salt, hash },
      { keylen: 64 },
      (err, verified) => resolve(verified && !err)
    );
  });
}

export function addServerEndpoints(addPostRoute) {
  // https://dev.bandwidth.com/messaging/callbacks/messageEvents.html
  // Bandwidth has a 10 second timeout!!
  addPostRoute(
    "/bandwidth/:orgId?",
    wrap(async (req, res) => {
      // parse login and password from headers
      const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
      const [login, password] = Buffer.from(b64auth, "base64")
        .toString()
        .split(":");

      // TODO: better login/password auto-creation/context
      // await verifyBandwidthServer(password)
      if (login !== "bandwidth.com" || password !== "testtest") {
        res.set("WWW-Authenticate", 'Basic realm="401"');
        res.status(401).send("Authentication required.");
        return;
      }

      // req.body is JSON
      if (req.body.length && req.body[0].type) {
        for (let i = 0, l = req.body.length; i < l; i++) {
          const payload = req.body[i];
          if (webhooks[payload.type]) {
            try {
              // FUTURE: turn into tasks to avoid timeout issues
              await webhooks[payload.type](payload, req.params);
            } catch (err) {
              log.error(err);
            }
          }
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"success": true}');
    })
  );
}
