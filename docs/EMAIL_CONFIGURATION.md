# Configuring email notifications
This guide explains how to configure Spoke to send email notifications. Email notifications are sent for account-related actions, to remind texters when they have messages to send and for data exports.

If you host Spoke on AWS Lambda or your own server, you will need an SMTP server configured to send email. If you auto-deployed to Heroku, you can also use the [Mailgun add-on](https://elements.heroku.com/addons/mailgun).

## Mailgun setup for Heroku
[Skip this section](#configuring-environment-variables) if you are hosting Spoke anywhere other than Heroku, or if you're hosting Spoke on Heroku but using your own SMTP server.
When you auto-deploy to Heroku, the Mailgun add-on is automatically provisioned with a sandbox domain. The sandbox domain can send email only to addresses specified by hand. To configure Mailgun to actually send emails (without needing to manually add the address of every Spoke user), you'll need to configure a custom domain for it.
1. Navigate to Add-Ons in your Heroku app and click on Mailgun, or run `heroku addons:open mailgun`.
2. Click on Domains. Add a custom domain (often a subdomain like `email.bartletforamerica.com`, but not one that's already in use).
3. Configure the provided TXT and MX records with your DNS provider. Mailgun periodically checks for DNS record creation, and also provides an option to trigger the check manually.
4. Configure the following Mailgun environment variables
  - `MAILGUN_DOMAIN`
  - `MAILGUN_PUBLIC_KEY`
  - `MAILGUN_SMTP_LOGIN`
  - `MAILGUN_SMTP_PASSWORD`
  - `MAILGUN_SMTP_PORT`
  - `MAILGUN_SMTP_SERVER`
See the [environment variables reference document](REFERENCE-environment_variables.md) for more information. Some of these variables are set during Heroku auto-deploy, some are not. Confusingly, some of the ones that are automatically set are _set incorrectly_ with the Mailgun sandbox domain. The environment variable reference document specifies the correct, production value for each variable.
5. Set the `EMAIL_FROM` environment variable. This is the email address users will see when they receive emails.


## Configuring environment variables
Spoke requires the following environment variables to be set to send email:
  - `EMAIL_FROM`
  - `EMAIL_HOST`
  - `EMAIL_HOST_PASSWORD`
  - `EMAIL_HOST_PORT`
  - `EMAIL_HOST_USER`
See the [environment variables reference document](REFERENCE-environment_variables.md) for more information.
