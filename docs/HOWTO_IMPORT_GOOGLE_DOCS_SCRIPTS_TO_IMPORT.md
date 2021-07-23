# HOWTO import interaction steps and canned responses from a Google Doc into Spoke

Note that in order to make the examples realistic, this document includes real IDs and secrets in the examples. The credentials and accounts connected with these examples will have been deleted before this file was pushed to Github.

It's a horrible idea to publish live secrets to Github. You should never do that. Please be sure to take adequate steps to protect your secrets.

## Setup

1. You must be logged in to Google.
1. Visit [this page](https://developers.google.com/docs/api/quickstart/nodejs) to start creating Google API credentials.
1. Click `Enable the Google Docs API`.
1. A dialog will appear.
1. Click `DOWNLOAD CLIENT CONFIGURATION`.
1. Open the downloaded file. The file will have a name like `credentials.json` or `credentials-2.json`.
1. The contents of the file will look like this:

```
{
  "installed": {
    "client_id": "971230067213-ochdc8fe93akq3ss04a3sqj3r2needvf.apps.googleusercontent.com",
    "project_id": "quickstart-1552345943126",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "8gRezNEdmjh1CmobG8hS1Ljx",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
}
```

8. Grab the value of the `project_id` key in the JSON in step 6. In this case it's `quickstart-1552345943126`. Note that we discard the quotes that surround it.
9. Go to [your Google API dashboard](https://console.developers.google.com/apis/credentials).
10. At the very top of that page, use the drop down at the top left to select the project whose name you grabbed in step 8. You will be shown a list of project names and IDs. Find your project by its ID and select it.
11. On that page, click `Create credentials` and then choose `Service account key`.
12. You'll be redirected to a page to create a service account.
    - Select `New service account` from the dropdown
    - In `Servie account name` enter an arbirary name (`test` is fine, for example)
    - In the `Role` Select `Project > Owner`
    - Make sure the `JSON` radio button is selected (it should be selected by default)
    - Click `Create`
    - Wait.
13. Another file will be downloaded. The name of the file (which will have the extension `json`) will be displayed when the download is complete.
14. Open the file.
15. The contents will look like this:

```
{
  "type": "service_account",
  "project_id": "quickstart-1552345943126",
  "private_key_id": "1f029699545c3a00039b7ed0894f60d8bccfb970",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDLfJOh++1qhThG\nYE3IPpgdaNFGjmOU+xlBJJY6Ff1XIFmCD8qm2eVaByHVWk9o8ZBxFSYx/fgAiMYK\nJ8lun9hKZA7o7ecHQJt89j8QjLXlpfwuo11KZ+UAA46VqCtmnFuEtpZ5A3sVjc1D\nx9Xdf2VJPNA472nInBIvfi5QaawplICx8f2IbotGPxpNraaJu82vN7VO4n2qABor\nXL0+5d5av6jSbnpf3KJUtDlwxWBLZWmQ8G7WUXFUGYOD4fDMF+xhSrL0VVE+cavI\n28rEfShctWv1c7TZazEZwpK0Zq6e6CzstwBk3rGd950lxcfqueNSg/Ejlp5mSYWH\n8ms+FwLnAgMBAAECggEASFA7PuOCmcpCF3B9892avUjUplhPt1AMx4OzB21tHJtY\nc8oc4HKq+PVz5pgzhD3kcOttKXLxwW7Zwh4ljXSsrrMkQU7aPU+OcjgobT80HSqB\nlilkK98EGJ8q+rBKzCpgs6cXjmXYRe6gtae8rvxpCD/eV31tgGdGZy5WUylaj2Oe\notMtjNm7TbpYiYg/SIuV1o6luJwnxi9wZBrYsrEhI6rWgJ9Q5ULmNijXyApZJ7Gy\nNLLJSVr5J9RtoY+/Uz2Mbm74fYcVHDU4Yy5jkxwROkV1i3onaUdmwHbe58VgcWRN\ntBmAbuPYiFe8uXNqtBDzMLx+Fo+tYBFnmq66vTX0YQKBgQDn3wAFMFC55kQW0MOn\nbpzBGTAUQLeIxBlTfuYniqTAigPI1tlljph6dTlfL/VfzIix1eb0h/fHHWyZ02WU\nIZ7PzefMoTnm9v91VBsjmynDZ/OQKjeU/IBYd72uKOxI8lauZs1Wyp+bLWjCz7vV\n9BFG9BzKQ5eB79CVv1GixYxfLwKBgQDgqWuJJoHXiUqt+QZ6eDwQO9juxpy9bfH1\nnSYjPXp5R90cxgg3FWr8F4E03Da38u06gdi31jqCJoWiSVhdbKrXopVodmrmsUtA\nR0KAleg4XpRENMKF35zIJYeXug715o2XUPZ5H8tT8q0tuqgYFsI1PyroUd/lIfVj\n0AhrqAppyQKBgQCt7dEOE1f6moeotaCOD6L2FfbCumjx5mc5Ao+SSaWb5+s+1Cru\nyzAFa7lFdawR2FMRUuqTswpiCehU2wXvP+jo6ANgs+/DGLQ3Roe1BccmFOvW0FQx\nJdcAhZF6+qeDcIUk/Wg6GnPu6vkSaND1hMcQ+jw+XMVhaoqESabq+lR5cQKBgQC2\nqWkykOl++jSK8O9QghOry00dDsT/y7Wv0n7gpiq/Eyv3Khgh2TssDlxSQz4GH/C7\n4jj3d6oIihObGHFNPH5HZvx9e9J9EOezMn0imT+/HT8FmbQTLvWFUeZF+dQSIMs8\nnWpYnv4tmiEuDhZ/x3lN27ciPveAkDS5W7qM9YrJ6QKBgQDHenfweOPuZxFmfqqG\nao/GuNLdCn8c2ZJzUJR5NNpaXnUlDxEgOmaeAw9quRNtdVAVHBnPC4uFegc7VBcA\n9guK7uF7Q1rB1Ypw8qzuEBz6BDQ9zc4q026xrPXADVK6zqC/CvRhbYaTgykZaCJl\nozRrvrZDHjjgC5wC2+d278NcFQ==\n-----END PRIVATE KEY-----\n",
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
{ "type": "service_account", "project_id": "quickstart-1552345943126", "private_key_id": "1f029699545c3a00039b7ed0894f60d8bccfb970", "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDLfJOh++1qhThG\nYE3IPpgdaNFGjmOU+xlBJJY6Ff1XIFmCD8qm2eVaByHVWk9o8ZBxFSYx/fgAiMYK\nJ8lun9hKZA7o7ecHQJt89j8QjLXlpfwuo11KZ+UAA46VqCtmnFuEtpZ5A3sVjc1D\nx9Xdf2VJPNA472nInBIvfi5QaawplICx8f2IbotGPxpNraaJu82vN7VO4n2qABor\nXL0+5d5av6jSbnpf3KJUtDlwxWBLZWmQ8G7WUXFUGYOD4fDMF+xhSrL0VVE+cavI\n28rEfShctWv1c7TZazEZwpK0Zq6e6CzstwBk3rGd950lxcfqueNSg/Ejlp5mSYWH\n8ms+FwLnAgMBAAECggEASFA7PuOCmcpCF3B9892avUjUplhPt1AMx4OzB21tHJtY\nc8oc4HKq+PVz5pgzhD3kcOttKXLxwW7Zwh4ljXSsrrMkQU7aPU+OcjgobT80HSqB\nlilkK98EGJ8q+rBKzCpgs6cXjmXYRe6gtae8rvxpCD/eV31tgGdGZy5WUylaj2Oe\notMtjNm7TbpYiYg/SIuV1o6luJwnxi9wZBrYsrEhI6rWgJ9Q5ULmNijXyApZJ7Gy\nNLLJSVr5J9RtoY+/Uz2Mbm74fYcVHDU4Yy5jkxwROkV1i3onaUdmwHbe58VgcWRN\ntBmAbuPYiFe8uXNqtBDzMLx+Fo+tYBFnmq66vTX0YQKBgQDn3wAFMFC55kQW0MOn\nbpzBGTAUQLeIxBlTfuYniqTAigPI1tlljph6dTlfL/VfzIix1eb0h/fHHWyZ02WU\nIZ7PzefMoTnm9v91VBsjmynDZ/OQKjeU/IBYd72uKOxI8lauZs1Wyp+bLWjCz7vV\n9BFG9BzKQ5eB79CVv1GixYxfLwKBgQDgqWuJJoHXiUqt+QZ6eDwQO9juxpy9bfH1\nnSYjPXp5R90cxgg3FWr8F4E03Da38u06gdi31jqCJoWiSVhdbKrXopVodmrmsUtA\nR0KAleg4XpRENMKF35zIJYeXug715o2XUPZ5H8tT8q0tuqgYFsI1PyroUd/lIfVj\n0AhrqAppyQKBgQCt7dEOE1f6moeotaCOD6L2FfbCumjx5mc5Ao+SSaWb5+s+1Cru\nyzAFa7lFdawR2FMRUuqTswpiCehU2wXvP+jo6ANgs+/DGLQ3Roe1BccmFOvW0FQx\nJdcAhZF6+qeDcIUk/Wg6GnPu6vkSaND1hMcQ+jw+XMVhaoqESabq+lR5cQKBgQC2\nqWkykOl++jSK8O9QghOry00dDsT/y7Wv0n7gpiq/Eyv3Khgh2TssDlxSQz4GH/C7\n4jj3d6oIihObGHFNPH5HZvx9e9J9EOezMn0imT+/HT8FmbQTLvWFUeZF+dQSIMs8\nnWpYnv4tmiEuDhZ/x3lN27ciPveAkDS5W7qM9YrJ6QKBgQDHenfweOPuZxFmfqqG\nao/GuNLdCn8c2ZJzUJR5NNpaXnUlDxEgOmaeAw9quRNtdVAVHBnPC4uFegc7VBcA\n9guK7uF7Q1rB1Ypw8qzuEBz6BDQ9zc4q026xrPXADVK6zqC/CvRhbYaTgykZaCJl\nozRrvrZDHjjgC5wC2+d278NcFQ==\n-----END PRIVATE KEY-----\n", "client_email": "test-252@quickstart-1552345943126.iam.gserviceaccount.com", "client_id": "103778937997709997381", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test-252%40quickstart-1552345943126.iam.gserviceaccount.com" }
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
