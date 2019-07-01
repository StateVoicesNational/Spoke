# OSDI Support

Spoke supports People Import, exposes contacts as OSDI People, interaction steps and questions answers as OSDI Questions and Answers.

It also exposes Messages, Assignments and Users in an experimental schema.

One can now write automation scripts without having to be familiar with Node, directly add code to Spoke, or put extra work on the Spoke developers.  Taking python, ruby or other scripting class, or self-learning is sufficient.

## HOWTO

Browse to http://spoke.dev.joshco.org/osdi

While looking at the HAL browser, try the following walkthrough

1. Click the link for the organization you want to browse
2. See the list of campaigns
3. Choose the campaign you want to browse
4. You should now be at the API Entry Point for the Campaign
5. Click the link for 'osdi:people' and see the first page of people results
6. Choose a person, and look at it's links.  You can navigate to that person's Answers (question responses), or messages
7. Go back to the AEP. (or Click "Go To Entry Point" in the top navbar to start over)
8. Click the link for 'osdi:answers' and see the recently added answers.  From each answer you can navigate to the person (campaign contact) or the question itself (derived from interaction steps)

> You can also start navigating users -> assignments -> messages

## Supported Scenarios

* Batch and Single Import of people / contacts
* Browsing the collection of people
* Downloading the target’s responses and import them into another system of the customer’s choice, eg VAN Survey Questions or others.
* Downloading the messages sent back and forth
* A simple way to browse the underlying data in Spoke without writing database SQL
 

## Service Implementation

### Person Signup / People Import

Allows batched import via OSDI of contacts

### People Collection

### Questions

### Answers

### Messages

### Spoke Assignments

## Example Client Script
In the dev-tools/osdi-client directory, there is an osdi-client.py script.

There are also two CSVs sample.csv and small.csv with some fake data to use with the script.

Example Syntax

```
./osdi-client.py -u http://your-spoke-server/osdi/org/1/campaigns/5/api/v1 -k APIKEY -f ./small.csv                                            
```

## HOWTO

Browse to http://spoke.dev.joshco.org/osdi

While looking at the HAL browser, try the following walkthrough

1. Click the link for the organization you want to browse
2. See the list of campaigns
3. Choose the campaign you want to browse
4. You should now be at the API Entry Point for the Campaign
5. Click the link for 'osdi:people' and see the first page of people results
6. Choose a person, and look at it's links.  You can navigate to that person's Answers (question responses), or messages
7. Go back to the AEP. (or Click "Go To Entry Point" in the top navbar to start over)
8. Click the link for 'osdi:answers' and see the recently added answers.  From each answer you can navigate to the person (campaign contact) or the question itself (derived from interaction steps)


### Using your own Spoke

1. Set up an organization and a campaign
2. Set the API key in Settings
3. Click the "VISIT OSDI BROWSER" button in settings, or browse to http://your-spoke-server/osdi
4. See the HAL browser
5. Past into the Custom Request Headers:
```OSDI-API-Token: YOURTOKEN```
6. Continue follow the steps as for the Spoke demo