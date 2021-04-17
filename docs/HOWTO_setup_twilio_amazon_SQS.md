
# Handling high volume inbound SMS & Webhooks with Twilio Functions & Amazon SQS

### Instead of making this the primary means of receiving messages, you can set the Twilio messaging service fallback to the SQS queue. 
If your Spoke application is down/not-responding, then Spoke doesn't lose messages and they are added to the SQS queue. 
In this scenario, we do NOT automate it, but when service is restored, we can manually run the trigger and load in the sqs messages from Twilio without having lost any incoming messages.
* Due to an existing bug, we DO NOT recommend scheduling the following job yet:
- recurring Lambda (technically CloudWatch) trigger enabled to reguarly look for incoming messages:
https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_DEPLOYING_AWS_LAMBDA.md#setting-up-scheduled-jobs

### Instructions Below for Set Up
* Follow the instructions in this link [Instructions for Set Up on Twilio.com] (https://www.twilio.com/blog/2017/07/handling-high-volume-inbound-sms-and-webhooks-with-twilio-functions-and-amazon-sqs.html)
* TWILIO_SQS_QUEUE_URL should be the 'https://sqs.CHANGEME.amazonaws.com/CHANGEME` url (not the twilio function)
* Set up AWS creds in the app


Twilio function source here (must change the line `const INCOMING_SMS_URL = 'https://sqs.CHANGEME.amazonaws.com/CHANGEME` and maybe `region: 'us-west-1' `):
```
/* global exports, require, console, process, Twilio */
'use strict'
 
// Some Node.js modules are preinstalled in the system environment.
// As of this writing, the third party modules are not configureable, but
// they should be soon. For now, though, you can take advantage of
// the AWS SDK being preinstalled. Require and initialize it here with the
// IAM credentials in your system environment.
const AWS = require('aws-sdk')
AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET
})
 
// Get a handle to SQS in the AWS region you created it in
let sqs = new AWS.SQS({ region: 'us-west-1' })
 
// Define SQS queue URLs from your AWS account
const INCOMING_SMS_URL = 'https://sqs.CHANGEME.amazonaws.com/CHANGEME
// const STATUS_CALLBACK_URL = 'https://sqs.us-east-2.amazonaws.com/XXX/status-callbacks'
 
// Implement handler function for incoming messages and status callbacks
exports.handler = function(context, event, callback) {
  // SQS send params - assume it's a status callback to a standard queue
  let sendParameters = {
    MessageBody: JSON.stringify(event)
    //QueueUrl: STATUS_CALLBACK_URL
  }
  
  // If the MessageStatus parameter is not passed, this is an incoming SMS
  // message - add appropriate SQS parameters and change the URL
  if (!event.MessageStatus) {
      sendParameters.QueueUrl = INCOMING_SMS_URL
      // FIFO queues use the message group ID to return messages to consumers
      // in logical groups. For an SMS app, a good group ID is the recipient
      // phone number
      // sendParameters.MessageGroupId = event.From.replace(/\D/g,'')


    // Add the message to the appropriate SQS queue
    sqs.sendMessage(sendParameters, (err, res) => {
      // For now, we'll just log any errors SQS throws us
      console.log(err)
      console.log(res)

      // Send a TwiML response with no reply message - we'll handle 
      // any responses from our workers
      let twiml = new Twilio.twiml.MessagingResponse()
      callback(null, twiml)
    })
  }
}
```


