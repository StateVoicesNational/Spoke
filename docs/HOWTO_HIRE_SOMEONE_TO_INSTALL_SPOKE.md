# How to Hire Someone to Deploy Spoke

## Deciding to use Spoke

You should treat all tech infrastructure choices as 'build vs buy' decisions, and make the right choice for your organization.

Reasons to run Spoke:
1. You want to run a peer-to-peer textbanking system at scale and pay only infrastructure costs
1. You have the tech capacity to do the technical deployment work to set up Spoke and maintain your instance over time. 
1. You want to be able to control costs and system scaling on your own terms. Perhaps you have experienced scaling problems from a textbanking vendor at an inopportune time. You can choose to control this risk by spending developer time and money on hardware running your own system.
1. You care about the open source community, want to give back to the progressive movement, and are interested in contributing back fixes and features.
1. You don't want to sign a contract with a vendor, and may have a more short term need for peer to peer texting.

Reasons to not run Spoke:
1. You have straightforward and non-bursty scaling needs that are well documented, that a vendor can meet for you. (We recommend contractually binding vendors to SLAs that ensure you get the service you have been promised)
1. You have more money than developer time to spend. 
1. You don't have an organizational need to control costs, system scaling, or vendor risk.

## Deciding how to run Spoke

At a high level, you need to decide how much control you want over your deployment architecture. Control over system scaling issues and security trades off against amount of time it'll take to setup and maintain your system. 

Reasons to want more control:
1. High scale: you want to send millions of text messages, and/or anticipate having thousands of simultaneous texters
2. High profile target: you are an important, highly visible org, and bad people on the internet will try to hack you no matter what you do. You need to carefully control and vet the security of all public-facing tools

Reasons to be ok with less control:
1. You aren't yet sure if you are able to / want to scale up your system and just want to try it out first
1. The cost of devops time spent implementing control over your deployment architecture isn't worth the benefit textbanking has to your organization

There are many ways to deploy software onto hardware and many cloud computing providers. In this set of documentation, we use Heroku and Amazon AWS. AWS is more work to setup than Heroku, but gives you more control over scaling and security. In our experience, a full stack engineer with 2+ yrs experience that includes AWS can set this up in 5 days. There is also a Spoke open source community anchored in the Progressive Coders Network slack who can help with setup.

If you're ok with less control, you can follow the instructions [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md) to deploy an instance of Spoke to Heroku  

If you want more control, you can follow the instructions [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md) to deploy an instance of Spoke onto Amazon AWS. Many people use dedicated EC2 servers for deployment, but we've found lambda (pay-per-invocation vs hour) to be more cost effective for bursty traffic.

## How to hire a person to install Spoke

Congratulations on making decisions about whether and how to run Spoke! You now have enough information to be able to hire someone to set it up for you. 

### Who should you hire and what skills should they have?

Baseline skills:
1. Basic understanding of client / server architecture
1. Basic familiarity with running a React app (the Spoke client)
1. Basic familiarity with running a Node server (the Spoke server)
1. Basic familiarity with background worker processes built in Node
1. Ability to install, configure, and deploy a Node server 
1. Ability to install, maintain, import data into, and query a relational database 
1. Abilty to configure credentials for and troubleshoot dependent infrastructure, like Auth0 and Twilio

If you're going the Heroku route, you'll need:
1. Ability to deploy websites, worker processes and databases in Heroku

If you're going our particular recommended AWS route, you'll need:
1. Ability to setup, configure, and run RDS Postgres databases in AWS
1. Ability to setup, configure and run API gateway and Amazon Lambda server containers
1. Ability to setup, configure and run worker processes 

Note how these are all phrased as "ability to" and not "experience in." The general category of work being done here is devops, and people with experience and interest in devops can learn to use a variety of different systems and tools more or less interchangeably. You also don't need a person who writes code in React and Node, just someone who can work with, configure, and install applications in these frameworks.

You're also not likely to encounter many people with prior experience specifically in deploying Spoke, because political tech is a small niche within tech, and Spoke is a small project within that. Don't filter for prior experience, but rather a track record of getting deployment work done on time and on budget.


### How should you hire them?

There are lots of tech industry people interested in politics. They really want to work with you. 
But tech skills and tech costs vary wildly. You can easily spend $0, $100, $1000, $10,000 for the same work and functionality. Make candidates compete for your business so you can drive down the cost of your project, and make sure the person you bring on is the right fit for your org.

Please, please, please don't just hire your friends, or someone who looks like a tech person who happens to be sitting 100 ft from you in your coworking space when you realize you need a website. Most software contracting projects experience a 50% failure rate due to lack of skill fit and contractor capacity. Publish your job publicly and run a competitive process to find a person to ensure that you're getting the right person with the right skills and right availability for your job.


*Decide on the terms of your job.*

You may think you just need someone to set Spoke up for you, but you'll probably also eventually want someone to maintain your instance over time, do regular upgrades, analyze the Spoke data you gather, and troubleshoot problems. Think about how much you want to spend upfront and in an ongoing retainer basis. Think about whether this work eventually adds up to a full-time person or a contractor.

*Write a job description or a vendor RFP.* 

You can start with [this](https://docs.google.com/document/d/1uxFGwzQqzU1y_W-XAb9jEW1VDeIfH2eNUfF6c1pOSRI/edit) template if you like.


*Advertise this job or RFP publicly* 
Advice on how and where to advertise can be found [here](https://medium.com/@ann_lewis/how-we-hire-tech-folks-7f36bfec594a) under "Advertising The Job." Spending $200 on an ad on a well-trafficked job board is less expensive than less-competitively hiring a person who doesn't finish the job.

## What else do I need to worry about?

Scaling! Let's say you are scaling up a texting program and can afford to send millions of messages. Congrats! Now you need a plan for how to scale up your use of Spoke.

The AWS setup described above as of this writing is CPU-bound at the database level. When it hits its scaling limitations, we've seen the RDS database CPU spike to 90% utilization which then caused cascading side-effects. There will eventually be a longer term software-based solution for these problems, but one easy way to handle this if it happens to you is to monitor database CPU and when it hits 80%, increase the size of the database (which is just a button push in Amazon RDS, but can takes hours depending on the size of your database) to get more CPU headroom. This is expensive- some high CPU databases in the RDS ecosystem cost $1000/week or more, so this is akin to throwing money at the problem. We've handled as many as 2MM messages / day with this setup before needing to scale up.

Amazon lambda automatically spins up more server containers when you send in more requests, but there is an undocumented data center specific limit on the number of simultaneous containers you can run at a time, which can cause problems with lots of simultaneous texting activity. Deploy to a data center that has a high concurrent lambda limit and ask your Amazon AWS rep which one this is.

Carrier specific sending limits are a problem for all texting systems- ask your metered SMS API provider (Twilio in this example) for granular error messages and carrier status, so you can analyze and understand the real throughput of your texting program.

