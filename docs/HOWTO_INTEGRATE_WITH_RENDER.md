# How to integrate with Render

## Purpose
In order to support our users in accessing low-cost and free tech, figuring out how to integrate with Render is a Heroku-Alternative Initiative.

Find information and stats on Render...

Explain what Render is...

## Instructions for initial integration
- Go to this repository and fork it. [get spoke repository link]
- Sign into your Render Account [link render account here](https://dashboard.render.com/)
  - you have the option to sign in through your github account, gitlab account, or gmail account.  This integration instructions used Gmail Account.
- Once logged in, I click on the `Make Webservice`
  - Connect to your forked Spoke repository
    - click `Connect account`, under GitHub
    - A permissions page will open and request for authority to act on your behalf (similar to permissions given through Heroku to pull in a branch from your updated code.)
    - Click `Authorize Render`
    - If you have multiple organizations, pick the organization where the forked repository exists.
    - Decide if you want Render to be installed for all your repositories or only select repositories.
    - I've chosen only select repositories.
    - Click install
    - Authorize your account
    - It sometimes returns back to the original screen with no instructions on what to do next.  Don't be alarmed! That might mean it worked! Please click `Create New Webservice` again, and you should see your repository linked with a purple button reading `connect`
- Now you should see a message that is suggesting `Docker`
    - If not, please enter the following:
    - `Name` - your name, it helps if it's your organization or campaign name with spoke next to it.
    - `Environment` - Docker
    - `Region` - Oddly there are only four choices, all bizzare, I went with what they picked for me, Oregon. Ohio has east if that matters to you.  The other two options are Singapore and Frankfurt EU
    - `Branch` : pick the branch from your repository, typically in production is main.
- For `plans`
    - We are testing to see if the Free Plan is enough to sustain the application.
    - This has a RAM of 512 MB and CPU of status shared << I'm not sure what that means for security but for now it seems okay.  Need to check it.
    - The Starter Plan is just $7/month which gives RAM 512 MB and CPU 0.5
    - The Starter Plus is RAM 1GB CPU 1 at $15/month
- Under `Advanced`
    - `Environment Variable`
        - There needs to be an environment variable that we add, but I need circle back and get it. [GET THE ENVIRONMENT VARIABLE NAME AND ADD THOSE INSTRUCTIONS HERE].  For now, I am skipping.
    - `Secret File`
        - skip!
    - `Health Check Path`
        - skip!
    - `Docker Build Context Directory`
        - skip!
    - `Dockerfile Path`
        - This is what we need to add: `./Dockerfile`
    - `Docker Command`
        - skip!
    - `Auto-Deploy`
        - set to yes.
    - Click on `Create Web Service`
    - it is building...
    - It found Docker and is done with the WORKDIR /spoke
    - I don't know what's going to happen with this and not having the backend set up yet.
    - Honestly, now I'm expecting it to fail.
    - Actually, it's merging the pull requests right now.
    - First error message.  Code: ENOENT for path .env
    - That makes sense.
    - It's still surviving
    - It's building!
    - It finished the builder.  Now it's exporting layers.
    - exporting cache, cool cool!
    - It's pushing an image to registry
    and Now it's done.
    - Jk, now it's looking for the server...it won't find one!  Is this where it crashes?
    - yup!  Got the npm error!
    - As expected this build failed.  Let's go set up the Backend.





  - Hook it up to Dockerfile

## Instructions for upgrading an already existing Render Application
