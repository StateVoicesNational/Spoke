# How to configure Slack Authentication

This integration ties a Spoke instance to a single Slack workspace. All
users in the Slack workspace will be able to log in to Spoke without any
additional set up. Note that users will still need to join organizations
using organization and/or campaign join links.

## Set up

#### Configure a Slack App

Create a private (non-distributed) Slack app [here](https://api.slack.com/apps)
using your workspace as the development workspace. 

1. On the landing page, under "Add features and functionality", select "Permissions"
2. Go to "OAuth & Permissions" in the sidebar
    1. Under "Redirect URLs" add `https://<your spoke domain>/login-callback`
    2. Under "Scopes > User Token Scopes" add the following OAuth Scopes:
       * identity.basic
       * identity.email
       * identity.team
3. Install the app into your workspace


#### Configure Spoke env vars

Set the following env vars:
* PASSPORT_STRATEGY: Set this to `slack`
* SLACK_CLIENT_ID: Copy this from your Slack app's "Basic Information" page
* SLACK_CLIENT_SECRET: Copy this from your Slack app's "Basic Information" page
* SLACK_TEAM_NAME: The subdomain of your slack workspace https://<team name>.slack.com
* SLACK_TEAM_ID: The ID of your team. This can be tricky to find, see [this SO thread.](https://stackoverflow.com/questions/40940327/what-is-the-simplest-way-to-find-a-slack-team-id-and-a-channel-id)
