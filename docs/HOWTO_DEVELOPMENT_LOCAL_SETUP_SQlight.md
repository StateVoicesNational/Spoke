## Getting started with SQlight


### Downloading

1. Fork the repository as seen in photo 1.0 (note this might change when granted more permissions but for now, fork and clone) 

   image 1.0
   ![Where is the fork](https://user-images.githubusercontent.com/54221369/148837584-0460afda-a9dd-4f0c-8d83-8eb46eed693c.png)


2. Then clone down the repository to your local environment as seen in image 1.1

   image 1.1
   ![Clone Repository](https://user-images.githubusercontent.com/54221369/148852070-bf3480bd-7069-478b-9884-a994ca4dada8.png)


3. Then in your Terminal run 

   ```
   cd Spoke
   ```
   this moves into the file 

4. Install the Node version listed in `.nvmrc`. [NVM](https://github.com/creationix/nvm) is one way to do this (from the spoke directory):
   ```
   nvm install
   nvm use
   ```
 - This is what the "nvm use" command should look like after running the command see image 1.2

   image 1.2

   ![NVM Use](https://user-images.githubusercontent.com/54221369/148840015-c8151dd1-5d43-421b-a5b8-5fdaa2d93f57.png)

5. Install yarn.

- Yarn is a package manager that will download all required packages to run Spoke it is similar to NPM.
- Install using the [directions provided by Yarn](https://yarnpkg.com/en/docs/install).

6. Install the packages.
   ```
   yarn install
   ```
7. Create a real environment file:
   ```
   cp .env.example .env
   ```
- This creates a copy of `.env.example`, but renames it `.env` so the system will use it. _Make sure you use this new file._
   After running "cp .env.example .env" in the terminal you can run the following command in your terminal
  
   ```
   ls -a
   ```
- This will verify the file has been added as seen in image 1.3
   
   image 1.3

   ![.env file](https://user-images.githubusercontent.com/54221369/148842257-d9219866-ed3c-4ee6-984d-e7b206b96316.png)

- If using Visual Studio Code (VS Code) [VS Code installation for Mac](https://code.visualstudio.com/docs/setup/mac) you can open the file by typing the folling in your terminal  

   ```
   code .
   ```

### Your `.env` file

We use environment variables to allow instance admins to customize their Spoke experience. If you end up doing dev work on an area that is configured through environment variables, it will be helpful to be familiar with the patterns used. Because of this, we recommend that you take a look at the [environment variable reference](REFERENCE-environment_variables.md) to get a lay of the land.  

- Initial look for the .env file as of Jan 10, 2022 

![.env file on open](https://user-images.githubusercontent.com/54221369/148844985-0d50f770-db88-4891-9a08-342a9564013d.png)

### Fixes and updates 

-There has been a breaking line of code that will prevent the file from running in the "src/server/index.js" file as of Jan 10, 2022, the fix to this can be viewed in image 2.0 a Pull Request has been made to update this error 

image 2.0

![Zipcode Fix](https://user-images.githubusercontent.com/54221369/148846192-f508ed9b-f0b6-4670-8ea6-6728df948bb8.png)

### Your Database

We have 2 recommended ways to set up your database for your development environment and you can choose either based on your preference or comfort level. This Document covers how to use the use sqlite (which is the default DB so you can proceed to the next section if you choose this) or postgres. At this time, all production Spoke instances use postgres.

If you're using postgres (see HOWTO_DEVELOPMENT_LOCAL_SETUP)

### Getting the app running

At this point, you should be ready to start your app in development mode.

1. Run `yarn dev` to start the application.
   - Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)› As seen in image 3.0

   image 3.0

   ![Running in Terminal](https://user-images.githubusercontent.com/54221369/148850583-e79fc190-5f76-43df-a3a7-49dd8c71dc67.png)

2. Go to `http://localhost:3000` to load the app. (Note: the terminal will say it's running on port 8090 -- don't believe it :-) See image 3.1

   image 3.1

   ![Localhost image](https://user-images.githubusercontent.com/54221369/148851287-09554cbb-f863-4707-9ecd-65f85eba540e.png)

3. As long as you leave `SUPPRESS_SELF_INVITE=` blank in your `.env` you should be able to invite yourself from the homepage.
   - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
     ```
     echo "INSERT INTO invite (hash,is_valid) VALUES ('E4502B28-301E-4E63-9A97-ACA14E8160C8', 1);" |sqlite3 mydb.sqlite
     # Note: When doing this with PostgreSQL, you would replace the `1` with `true`
     ```
   - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/E4502B28-301E-4E63-9A97-ACA14E8160C8. This should redirect you to the login screen. Use the "Sign Up" option to create your account.
4. You should then be prompted to create an organization. Create it.
5. Once you've created your organization, we recommend setting the env var `SUPPRESS_SELF_INVITE=1` so you don't get prompted to create a new org every time you log in
6. See the [Admin](https://youtu.be/PTMykMX8gII) and [Texter](https://youtu.be/EqE1UDvKGco) demos to learn about how Spoke works.
7. See [the development guidelines](EXPLANATION-development-guidelines.md)
8. See [How to Run Tests](HOWTO-run_tests.md)

### SMS and Twilio in development

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary. You can also include "autorespond" in the script message text, and an automatic reply will be generated (just for `fakeservice`!)

If you need to use Twilio in development but with live keys, click [here](HOWTO_INTEGRATE_TWILIO.md) for instructions.
When using instructions, please remember that references to NGROK urls should change to your Heroku app url.
