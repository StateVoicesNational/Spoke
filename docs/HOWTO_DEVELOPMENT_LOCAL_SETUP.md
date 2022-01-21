## Getting Started

---
### [Repository](https://github.com/MoveOnOrg/Spoke)
1. If you have not already, Fork this repo then clone your forked copy. Then future pull requests can be made from your repo to Spoke. 
```
git clone <url of your forked repo>
```

2. change your pwd (present working directory) to the spoke directory before installations 
```
cd spoke
```

3. You may use this opportunity to set the remote upstream to spoke's repo for future fetches.
```
git remote add upstream https://github.com/MoveOnOrg/Spoke.git
``` 
   -  you can check that this is configured correctly to push to the origin and fetch from spoke's repo. 
   ```
   git remote -v
   ```
   Your origin and Upstream should appear configured correctly.
   - this is a good time to take a look at [Syncing a Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) for full understanding.

---
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
   nvm install 12
   nvm use 12
   ```
   - this assumes you have nvm (node version manager) installed.  If not, either
   * run 
   ```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   ```

   * or visit [NVM INTRO](https://github.com/nvm-sh/nvm/blob/master/README.md) for a better understanding.
   - at this time of this writing, nvm install will install a version above 17 but we want to run 12 and then yarn will have to be installed again, even if you use yarn already. 
    
2. Install yarn.


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

---
### Your `.env` file

   We use environment variables to allow instance admins to customize their Spoke experience. If you end up doing dev work on an area that is configured through environment variables, it will be helpful to be familiar with the patterns used. Because of this, we recommend that you take a look at the [environment variable reference](REFERENCE-environment_variables.md) to get a lay of the land.  

   - Initial look for the .env file as of Jan 10, 2022 as seen in image 1.4

   image 1.4 

   ![.env file on open](https://user-images.githubusercontent.com/54221369/148844985-0d50f770-db88-4891-9a08-342a9564013d.png)


---
### Your Database

We have 2 recommended ways to set up your database for your development environment and you can choose either based on your preference or comfort level. This Document covers how to use the use sqlite (which is the default DB so you can proceed to the next section if you choose this) or postgres. At this time, all production Spoke instances use postgres.

#### Using Docker to run postgres (optional and not needed for SQlight quick setup skip if using SQlight "Fixes and updates") 

If you're using postgres (see below),if you're using sqlite, you don't need to change anything about your .env file. 

Docker is optional, but can help with a consistent development environment using postgres. 

   1. Either install docker (recommended) or postgresql on your machine:
      * If you installed docker run the database using: `docker-compose up`
   
      * Documents on install docker and docker compose 

       Downloading Docker: [Link](https://docs.docker.com/get-docker/)
        
       Downloading Docker compose: [Link](https://docs.docker.com/compose/install/)

      * If you installed postgres locally, create the spoke dev database: `psql -c "create database spokedev;"`

   2. Then create a spoke user to connect to the database with `createuser -P spoke` with password "spoke" (to match the credentials in the .env.example file)as seen in image 1.5

      image 1.5

      ![Name and Password must match .env file](https://user-images.githubusercontent.com/54221369/149003896-6b7d6835-4dfe-4688-a586-c22fdb095707.png)


   3. In `.env` set `DB_TYPE=pg` as seen in image 1.6

      image 1.6

      ![.env update to DB type](https://user-images.githubusercontent.com/54221369/149000893-8022a76a-e191-4d0c-8152-d55593574c5a.png)


   4. Set `DB_PORT=5432`, which is the default port for Postgres.

      That's all you need to do initially. The tables will be created the first time the app runs. As seen in image 1.7

      Image 1.7

      ![Setting port to 5432]https://user-images.githubusercontent.com/54221369/149005198-f90cd5ae-5c94-4f6f-b389-901bb241c039.png


### Fixes and updates 

   -There has been a breaking line of code that will prevent the file from running in the "src/server/index.js" file as of Jan 10, 2022, the fix to this can be viewed in image 2.0 a 
   
   - Pull Request has been made to update this error 

   image 2.0

   ![Zipcode Fix](https://user-images.githubusercontent.com/54221369/148846192-f508ed9b-f0b6-4670-8ea6-6728df948bb8.png)


### Getting the app running

At this point, you should be ready to start your app in development mode.


1. Run `yarn dev` to create and populate the tables.
   - Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
2. Go to `http://localhost:3000` to load the app. (Note: the terminal will say it's running on port 8090 -- don't believe it :-)
3. As long as you leave `SUPPRESS_SELF_INVITE=` blank in your `.env` you should be able to invite yourself from the homepage by signing up with your information. (Notice the URL address in your window has an invite page parameter for the next route)
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
