# Azure Deployment of Spoke

## SERVER SET UP
- In the Azure portal, create a resource group.
- Set up an Azure account
- Click start free
- Sign up with Github!
- Fill out information
- They will ask for CC information, but don’t worry, they won’t charge for the first $200, so don’t spend up a huge rendering farm or something.
- Click the Azure Portal
- We will hopefully be able to incorporate a template for this section so new users don’t have to go through this lengthy process

## Processor, memory, disk
- Pick a virtual machine that Microsoft gives you (with Public IP Address and whatever amount of storage you selected to be associated with the machine.)
- Choose Linux -- Ubuntu 20.04 (the current long term support release; Ubuntu is released in two year LTS cycles (next will be 22.04))
- Create new resource group

### For Size 
- Click ‘see all sizes’
- Azure Virtual Machine Selector (how to choose which one virtual machine is good for your needs.)
- FOR OUR PURPOSES: Click on ‘B-series’ (cheaper basic version, users should upgrade for production deployment - potentially something in the D-series, e.g. D2v3, 2 production virtual CPUs, 8 GB of memory, 50 GB of temporary storage)
- B1s
- General purpose
- 1 virtual CPU
- 1 GB of memory
- 4 GB of temporary storage
- 320
- Click Select
- Verify you picked the right one: Size says Standard_B1s - 1vcpu, 1GiB memory ($7.59/month)
-	Depending on how you create it, you may be prompted for “Next: Disks >” which will allow you to attach permanent storage

### Create the Username and Password as primary administrator
- Set up with Password
- Inbound Port Rules, leave as is. 
- Keeping port 22 open will allow us to SSH to clone Spoke onto our new server. (You may be warned: You have set SSH port(s) open to the internet.  This is only recommended for testing.  If you want to change this setting, go back to Basics tab.)

### Enter your virtual machine,
- Click Review + create
- Create
- Click Go to resource
- We want to ssh into the new server
- Microsoft will provide you with a public IP address (which is static)
- In terminal: $ssh <your-username>@<static IP address>
- Enter your password for this user
- For production purposes, you will want to attach permanent disk storage (documentation update coming soon)
- Set up the domain you want associated with it.

## NODE.JS SETUP

It turns out we need those instructions for a different portion of the setup, but initially we should use the [development documentation from Spoke(https://github.com/StateVoicesNational/Spoke/blob/fc267eafbbc07d6d383ddab4bbc17810d7c75883/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md) 
- Start at Step 1 for installing Node.js
- Install Node: `sudo apt install -y nodejs`
- DON’T DO THIS LINE: Install Yarn: sudo apt-get update && sudo apt-get install yarn
- INSTEAD USE THE NPM PACKAGE MANAGER `sudo npm install -g yarn`
- IF YOU ACCIDENTALLY USED THE LINE WE TOLD YOU NOT TO, HERE’S HOW TO REMOVE IT: `sudo apt remove yarn cmdtest`
- Clone down Spoke `git clone https://github.com/StateVoicesNational/Spoke.git`

## PACKAGE
### Spoke installation and package setup
- CD into Spoke and 
- Run `yarn install`
- Begin the [Spoke Minimalist Deploy](https://github.com/StateVoicesNational/Spoke/blob/main/docs/HOWTO_MINIMALIST_DEPLOY.md) 

### If you run `yarn run prod-build-client` GAVE AN ERROR OF FAILING TO LOAD ‘/home/{username}/Spoke/webpack/config.js’
- Install Docker for preliminary database and cache setup, [linked here](https://docs.docker.com/engine/install/ubuntu/)
- Verify your docker is set up correctly: $ sudo docker run hello-world
- Install docker compose (click on the Linux tab) [Link to Docker Documentation](https://docs.docker.com/compose/install/)
- Turn on docker `sudo docker-compose up -d`
- Permission Denied Sad Path: `sudo usermod -aG docker $USER` (theoretically making it so you don’t have to use sudo, but let’s come back to this)
Yarn bug: `wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
https://github.com/StateVoicesNational/Spoke/blob/main/docker-compose.yml`
- INITIAL YARN VERSION 1.22.17
- `export NVM_DIR="$HOME/.nvm"`
- command `-v nvm`
- `source ~/.bashrc`
- https://github.com/nvm-sh/nvm
- `cp .env.example .env`
- AFTER RUNNING: `npm install --build-from-resource`
YARN VERSION IS: 
- Run Yarn Dev, there’s enough defaults in the normal environment variables configurations file that you can just run it immediately.

### Running on a different port.
- Set up nginx
- Go into nginx to configure the URL properly routes to the application when you go to it.
- Link: All the steps for starting with a completely blank and empty server.
- Go to section 4 to set up nginx


## Set up the SSL
- Most organizations have their own certificates.
- But in case you don’t: Visit certbot.eff.org
- Follow the instructions on the site
- It assumes you’ve already set up your EngineX.
- You’ll have to type in your contact information
- Then it’s all up and running

## Install Redis
- Something set up by default within the Docker container.  It sets up a Redis instance.
- We’re going to deploy redis separately within the server.
- Since we’ve already broken the database option out of the Docker File.
- But need to look for [Azure Cache for Redis instructions] (https://github.com/StateVoicesNational/Spoke/blob/main/docs/HOWTO_CONNECT_WITH_REDIS.md)

## Install Postgres
- In our documentation there is some information for setting this up.
- The way we set it up is that we have a different database set in Azure and then connected within the container of your Azure project.
- More [expanded Docker descriptions](https://github.com/StateVoicesNational/Spoke/blob/main/docs/HOWTO_USE_POSTGRESQL.md) if people who are doing this wanted to go that route
- Configure environment variables
- Start sticking in the variables you actually want in the environment variable file.
    - SUPRESS_SELF_INVITE=1
    - DB_TYPE=pg
    - DEFAULT_SERVICE=twilio
- If you are adding the variables at an organization level through the front-end, then these variables do not need to be set in the .env file
    - TWILIO_ACCOUNT_SID=
    - TWILIO_MESSAGE_SERVICE_SID
    - TWILIO_MESSAGE_SERVICE_SID
- If you’re doing a smaller organization with one campaign, you don’t want to set this variable to 1.  But if you are working with multiple orgs, setting this variable to 1 allows you to override Twilio in whatever is in the Global Variable file.
    - TWILIO_MULTI_ORG=1
        - Set this variable, because it is not automatically generated for backwards compatibility.
    - TWILIO_VALIDATION=1
- Variables to remove from .env file to ensure Spoke successfully processes responses from the text:
    - TWILIO_AUTH_TOKEN=[ADD TOKEN HERE]
    - TWILIO_MESSAGE_CALLBACK_URL
- Call Back URL needs to be updated.
- There might be a problem with the callback not working due to an Azure firewall
- Usually there is an IP White List for the different access for things
- It’s probably doing something wrong with the environment variables.


## Heroku Deployment
- Documentation update coming soon.


## AZURE AUTOMATED CONFIGURATION FILE
- Coming Soonish!
- Spotcheck
- Sv-beagle
- vrspotcheck << the logic is contained in this

## Node deployment with Azure from Major League Hacking
- https://www.youtube.com/watch?v=0BsR9TrR6do

## Node deployment from Microsoft
- https://www.youtube.com/watch?v=z_4sMQKE_zw
- [Microsoft Documentation](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs?tabs=linux&pivots=development-environment-vscode)
