## Deciding how to run Spoke

At a high level, you need to decide how much control you want over your deployment architecture. Control over system scaling issues and security trades off against amount of time it'll take to setup and maintain your system. 

For guidance on hiring someone to 

Reasons to want more control:
1. High scale: you want to send millions of text messages, and/or anticipate having thousands of simultaneous texters
2. High profile target: you are an important, highly visible org, and bad people on the internet will try to hack you no matter what you do. You need to carefully control and vet the security of all public-facing tools

Reasons to be ok with less control:
1. You aren't yet sure if you are able to / want to scale up your system and just want to try it out first
1. The cost of devops time spent implementing control over your deployment architecture isn't worth the benefit textbanking has to your organization

There are many ways to deploy software onto hardware and many cloud computing providers. In this set of documentation, we use Heroku and Amazon AWS. AWS is more work to setup than Heroku, but gives you more control over scaling and security. In our experience, a full stack engineer with 2+ yrs experience that includes AWS can set this up in 5 days. There is also a Spoke open source community anchored in the Progressive Coders Network slack who can help with setup.

If you're ok with less control, you can follow the instructions [here](HOWTO_HEROKU_DEPLOY.md) to deploy an instance of Spoke to Heroku  

If you want more control, you can follow the instructions [here](HOWTO_DEPLOYING_AWS_LAMBDA.md) to deploy an instance of Spoke onto Amazon AWS. Many people use dedicated EC2 servers for deployment, but we've found lambda (pay-per-invocation vs hour) to be more cost effective for bursty traffic.


## What else do I need to worry about?

Scaling! Let's say you are scaling up a texting program and can afford to send millions of messages. Congrats! Now you need a plan for how to scale up your use of Spoke.

The AWS setup described above as of this writing is CPU-bound at the database level. When it hits its scaling limitations, we've seen the RDS database CPU spike to 90% utilization which then caused cascading side-effects. There will eventually be a longer term software-based solution for these problems, but one easy way to handle this if it happens to you is to monitor database CPU and when it hits 80%, increase the size of the database (which is just a button push in Amazon RDS, but can takes hours depending on the size of your database) to get more CPU headroom. This is expensive- some high CPU databases in the RDS ecosystem cost $1000/week or more, so this is akin to throwing money at the problem. We've handled as many as 2MM messages / day with this setup before needing to scale up.

Amazon lambda automatically spins up more server containers when you send in more requests, but there is an undocumented data center specific limit on the number of simultaneous containers you can run at a time, which can cause problems with lots of simultaneous texting activity. Deploy to a data center that has a high concurrent lambda limit and ask your Amazon AWS rep which one this is.

Carrier specific sending limits are a problem for all texting systems- ask your metered SMS API provider (Twilio in this example) for granular error messages and carrier status, so you can analyze and understand the real throughput of your texting program.

