# Configuring email notifications
This guide explains how to configure Spoke to send email notifications. Email notifications are sent for account-related actions, to remind texters when they have messages to send and for data exports. See .[Data Exporting doc].(DATA_EXPORTING.md) in the /docs folder regarding setting up an AWS S3 'bucket' to receive exports.

If you auto-deployed to Heroku, the [Mailgun add-on](https://elements.heroku.com/addons/mailgun) was automatically provisioned for you. To use it, [follow the steps below](#mailgun-setup-heroku-only).

If you host Spoke on AWS Lambda or your own server, you will need an SMTP server configured to send email. Follow the [external SMTP server setup steps](#external-smtp-server-setup).


## Mailgun setup (Heroku-only)
__Skip this section__ if you are using your own SMTP server or hosting Spoke anywhere other than Heroku.

When you auto-deploy to Heroku, the Mailgun add-on is automatically provisioned with a sandbox domain. The sandbox domain can send email only to a list of specified email addresses. To configure Mailgun to actually send emails (without needing to manually specify the address of every Spoke user), you must configure a custom domain.

1. Navigate to Add-Ons in your Heroku app and click on Mailgun, or run `heroku addons:open mailgun`.
2. Click on Domains. Add a custom domain (often a subdomain like `email.bartletforamerica.com`, but not one that's already in use).
3. Configure the provided TXT, MX, and CNAME records with your DNS provider. Mailgun periodically checks for DNS record creation, and also provides an option to trigger the check manually.
4. Configure the following Mailgun environment variables:
  - `MAILGUN_DOMAIN`
  - `MAILGUN_PUBLIC_KEY`
  - `MAILGUN_SMTP_LOGIN`
  - `MAILGUN_SMTP_PASSWORD`
  - `MAILGUN_SMTP_PORT`
  - `MAILGUN_SMTP_SERVER`

See the [environment variables reference document](REFERENCE-environment_variables.md) for more information. Some of these variables are set during Heroku auto-deploy, some are not. Confusingly, some of those that are set automatically are set with values for the sandbox domain and __must be changed for production__. The environment variables reference document specifies the correct value for each variable.

5. Set the `EMAIL_FROM` environment variable. This is the email address users will see when they receive emails.


## External SMTP server setup
__Skip this section__ if you are using Mailgun.

Spoke requires the following environment variables to be set to send email:
  - `EMAIL_FROM`
  - `EMAIL_HOST`
  - `EMAIL_HOST_PASSWORD`
  - `EMAIL_HOST_PORT`
  - `EMAIL_HOST_USER`

See the [environment variables reference document](REFERENCE-environment_variables.md) for more information.
