import { log } from "../lib";
import { getConfig } from "./api/lib/config";
import nodemailer from "nodemailer";
import mailgunConstructor from "mailgun-js";

const mailgun =
  getConfig("MAILGUN_API_KEY") &&
  getConfig("MAILGUN_DOMAIN") &&
  mailgunConstructor({
    apiKey: getConfig("MAILGUN_API_KEY"),
    domain: getConfig("MAILGUN_DOMAIN")
  });

const nodeMailerConfig = {
  host: getConfig("EMAIL_HOST"),
  port: getConfig("EMAIL_HOST_PORT"),
  secure:
    typeof process.env.EMAIL_HOST_SECURE !== "undefined"
      ? getConfig("EMAIL_HOST_SECURE", null, { truthy: 1 })
      : true,
  auth: {
    user: getConfig("EMAIL_HOST_USER"),
    pass: getConfig("EMAIL_HOST_PASSWORD")
  }
};

const sender =
  getConfig("MAILGUN_API_KEY") && getConfig("MAILGUN_DOMAIN")
    ? {
        sendMail: ({ from, to, subject, replyTo, text }) =>
          mailgun.messages().send({
            from,
            "h:Reply-To": replyTo,
            to,
            subject,
            text
          })
      }
    : nodemailer.createTransport(nodeMailerConfig);

export const sendEmail = async ({ to, subject, text, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`);

  if (process.env.NODE_ENV === "development") {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`);
    return null;
  }

  const params = {
    from: getConfig("EMAIL_FROM"),
    to,
    subject,
    text
  };

  if (replyTo) {
    params["replyTo"] = replyTo;
  }
  return sender.sendMail(params);
};
