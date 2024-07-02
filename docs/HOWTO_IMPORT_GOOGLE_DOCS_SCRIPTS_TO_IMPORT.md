# HOWTO import interaction steps and canned responses from a Google Doc into Spoke **EXPERIMENTAL**

Note that in order to make the examples realistic, this document includes real IDs and secrets in the examples. The credentials and accounts connected with these examples will have been deleted before this file was pushed to Github.

It's a horrible idea to publish live secrets to Github. You should never do that. Please be sure to take adequate steps to protect your secrets.

## Current Work in Progress (May 2024)

This doc and associated feature is under construction/maintenence. Please consider the Google Docs Integration **experimental** for the time being and open an issue if you run into any issues. 

## Setup

1. You must be logged in to Google.
2. Visit [this page](https://developers.google.com/docs/api/quickstart/nodejs) to start creating Google API credentials.
3. Scroll down and click `Enable the Google Docs API`.
4. Follow the steps to endable Google Docs API.
5. On the top left of the page, click on "GoogleCloud", which will redirect you to the home page. Then, click `APIs & Services`.
6. Scroll down until you find `Google Docs API` and click it.
7. You'll be redirected to a page. On the top of the page, it will ask you to create a `New Service Account`, click it.
    - Select `New service account` from the dropdown
    - In `Servie account name` enter an arbirary name (`test` is fine, for example)
    - In the `Role` Select `Project > Owner`
    - You may skip the opition "Grand Users access to this service account"
6. Return to the `Google Docs API` page, and on the left, click `Credentials` and then click `ADD KEY`.
    - Set type to JSON and continue.
8. Another file will be downloaded. The name of the file (which will have the extension `json`) will be displayed when the download is complete.
9. Open the file.
10. The contents will look like this:

```
{
  "type": "service_account",
  "project_id": "quickstart-1552345943126",
  "private_key_id": "1f029699545c3a00039b7ed0894f60d8bccfb970",
  "private_key": "-----BEGIN PRIVATE KEY-----\naVeryLongPrivateKey\n-----END PRIVATE KEY-----\n",
  "client_email": "test-252@quickstart-1552345943126.iam.gserviceaccount.com",
  "client_id": "103778937997709997381",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test-252%40quickstart-1552345943126.iam.gserviceaccount.com"
}
```

16. Delete all the new lines so the entire contents of the file appears on a single line, and that line should not have a hard line end. It should be the only line in the file. It should look like this:

```
{ "type": "service_account", "project_id": "quickstart-1552345943126", "private_key_id": "1f029699545c3a00039b7ed0894f60d8bccfb970", "private_key": "-----BEGIN PRIVATE KEY-----\naVeryLongPrivateKey\n-----END PRIVATE KEY-----\n", "client_email": "test-252@quickstart-1552345943126.iam.gserviceaccount.com", "client_id": "103778937997709997381", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test-252%40quickstart-1552345943126.iam.gserviceaccount.com" }
```

17. In the Spoke `.env` file, or the environment variables section in Heroku settings, or in whatever your platform uses for configuration, create a key called `GOOGLE_SECRET` and set its value to the single line of text you created in step 16. (If you're using a `.env` file you must surround it by single quotes. If you're using Heroku you don't need to add quotes.) For AWS Lambda, there are [special deployment instructions](HOWTO_DEPLOYING_AWS_LAMBDA.md#environment-variable-maximum-4k)
18. Restart Spoke after changing the configuration.
19. Grab the value of the `client_email` key in the `JSON` in step 16, without the quotes (in our example, it's `test-252@quickstart-1552345943126.iam.gserviceaccount.com`). This is the email address with which you must share documents you want to import.

## Create script documents

1. Create a script from a Google Doc Spoke script template - see for example https://docs.google.com/document/d/1gFji2Vh_0svb4j7VUtmJZkqNhRWt3htp_bdGoWh6S6w/edit
2. Copy the template, create a new draft doc with that and save it, then edit the new script doc, not the template :)
3. Share the script document with your API user.
   - Go to the document in Google Docs.
   - Click `Share` in the upper right corner of the browser window. The `Share with others` dialog will appear.
   - Paste the email address from step 19 above (in this example, `test-252@quickstart-1552345943126.iam.gserviceaccount.com`) in the `People` field in the lower section of the `Share with others` dialog.
   - Clear the `Notify people` checkbox.
   - Click `OK`.

## Import a script

When creating or editing a campaign that has not started:

1. Copy the URL for the Google Doc from the URL bar in the browser.
1. Click on `Script Import`.
1. Paste the URL into the `Google Doc URL` field.
1. Click `IMPORT`.

Note that Spoke will not allow you to import a script after the campaign starts.

## Tips for editing script documents

- Install the ‘Show’ add-on to be able to see non-printable characters
  - You can see codes like End of Paragraph (Usually from Return)
  - The ability to see hidden characters and formatting marks isn't built into Docs. However, there's an add-on for Docs called Show that can do this.
  - You can get it by going to Add-ons (in the tool bar) > Get add-ons and then searching for it by name.
  - Once you find it, just press the blue Free button to add it to Docs. You can then access it by clicking on Add-ons in the tool bar to display all the add-ons you have.
- Use Outline
- Important formatting tips
  - Others TBD
