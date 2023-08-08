## Getting Started

---
### Download Windows Subsytem for Linex
Windows Subsystem for Linex (WSL) allows users to run Linux enviroments and applications within Windows. 
Further information can be found [here](https://learn.microsoft.com/en-us/windows/wsl/about).
1. Download WLS in the CMD as Administrator
- WSL comes in two flavors, WSL1 and WSL2. This will install WSL2, and is needed to run the application correctly. Look into this [document](https://learn.microsoft.com/en-us/windows/wsl/install) from Microsoft if you need to upgrade from WSL1.
```
wsl --install
```

2. Restart your PC.
   
3. Enter your bios, and enable _Virtualization_
   
4. Allow your computer to reboot, and Ubuntu will finish installation. Ubuntu will be an application on you PC.
  - Ubuntu will ask you to make a username and password. This is purely local and will only be on your machine.
---
### [Repository](https://github.com/MoveOnOrg/Spoke)
1. Fork this repo then, **in Ubuntu**, clone your forked copy. Future pull requests can be made from your repo to Spoke. 
```
git clone <url of your forked repo>
```

2. Change your pwd (present working directory) to the spoke directory before installations 
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

### Ubuntu and Visual Studio Code

A good majority of steps can be completed in Ubuntu while in the Spoke directory, 
but it will be easier to operate in [Visual Studio Code](https://code.visualstudio.com/)(VS). 
VS has an extension for WSL, allowing for near seemless use. This article [Developing in WSL](https://code.visualstudio.com/docs/remote/wsl) explains this further.

After installing VS, and adding the WSL extension, type:
   ```
   code .
   ```
in the spoke directory.

This will open all files within the Spoke directory, including your soon to be created `.env` file. 
To open an Ubuntu terminal in VS, click the three lines on the top left, then 'Terminal', then click 'New Terminal'.

---

### Downloading

1. Install the Node version listed in `.nvmrc`. This can also be found here:[.nvmrc](https://github.com/MoveOnOrg/Spoke/blob/main/.nvmrc). 
From the spoke directory **in Ubuntu**:
   ```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   nvm install
   nvm use
   ```
   * or visit [NVM](https://github.com/nvm-sh/nvm/blob/master/README.md), a great resource for installation if your terminal isn't recognizing nvm or if you'd like more background on these commands.
   - at this time of this writing, nvm install will install a version above 17 but we want to run 12.  Yarn will have to be installed again, even if you have yarn installed already, as it will need to be compatible with this version of nvm. 
2. Check to ensure that the proper version of nvm (16.18.0), is installed.
   ```
   nvm -v
   ```
3. Install yarn.

- Yarn is a package manager that will download all required packages to run Spoke.
- Install using the [directions provided by Yarn](https://yarnpkg.com/en/docs/install).

4. Install the packages.
   ```
   npm install --global yarn
   ```
   
5. Run Yarn
   ```
   yarn
   ```
6. Ensure yarn was installed
   ```
   yarn -v
   ```

7. Create a real environment file:
   ```
   cp .env.example .env
   ```

- This creates a copy of `.env.example`, but renames it `.env` so the system will use it. _Make sure you use this new file._

---
### Your `.env` file

We use environment variables to allow instance admins to customize their Spoke experience. If you end up doing dev work on an area that is configured through environment variables, it will be helpful to be familiar with the patterns used. Because of this, we recommend that you take a look at the [environment variable reference](REFERENCE-environment_variables.md) to get a lay of the land.  

---
### Your Database
At this time, postgresql is preferred over Docker when running the Spoke application in Windows 10. 

1. In Ubuntu, and in the Spoke directory, install postgresql.
   ```
   sudo apt install postgresql postgresql-contrib
   ```
2. (OPTIONAL) Check to see if postgresql was installed correctly.
   ```
   sudo systemctl status postgresql.service
   ```

---
### Setting up your postgres database
1. In Ubuntu, in the Spoke directory, enter the postgresql database.
   ```
   sudo -i -u postgres
   psql
   ```
2. Create your database.
   ```
   CREATE DATABASE spokedev;
   ```
3. Create your user
   ```
   CREATE USER spoke WITH PASSWORD ‘spoke’;
   ```
4. Grant all privelages to your user.
   ```
   GRANT ALL PRIVILEGES ON DATABASE spokedev TO spoke;
   ```
5. Exit postgresql
   ```
   \q
   exit
   ```
   - The current database name, user, and password align with your current `.env` file, but can be changed to anything. If you do, **ensure** the `.env` reflects that.

---  
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

---
### Further Development

Check the end of [HOWTO_DEVELOPMENT_LOCAL_SETUP.md](https://github.com/engelhartrueben/Spoke/blob/main/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md) for SMS and Twilio Development.

---
### Basic Troubleshooting

1. Check if Windows Subsystem is enabled in the _Turn Windows Features on and off_ control panel easily located in the search bar. If it has to be enabled, you will need to restart your PC after.
2. Ensure virtualization is enabled in the Bios. Ubuntu will not run without it.
3. It is good practice to check if the proper node version is installed and being used with:
    ```
    node -v
    ```
    The console should return `16.18.0`, else run:
    ```
    nvm install 16.18.0
    nvm use 16.18.0
    ```
    Check again to make sure you are using the right node version. 
