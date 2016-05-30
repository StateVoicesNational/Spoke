import { Picker } from 'meteor/meteorhacks:picker'
import bodyParser from 'body-parser'
import { insertMessage } from '../../api/messages/methods'
import { Messages } from '../../api/messages/messages'
// import { e164 } from 'libphonenumber'
Picker.middleware( bodyParser.urlencoded( { extended: false } ) );

console.log(bodyParser)
// Handle post only
Picker.route('/plivo', function(params, req, res, next) {
  const {To, From, Text, MessageUUID} = req.body
  console.log("hello test")
  e164(From, 'US', (fromErr, contactNumber) => {
    if (!fromErr) {
      console.log("contactNumber converted")
      e164(To, 'US', (toErr, userNumber) => {
        if (!toErr) {
          console.log("usernumber converted", userNumber)
          const message = Messages.findOne({
            contactNumber,
            userNumber
          }, {
            sort: {
              createdAt: -1
            }
          })

          // Should it find the first or last message in a thread?
          if (message) {
            const campaignId = message.campaignId
            const reply = {
              campaignId,
              text: Text,
              contactNumber,
              userNumber,
              serviceMessageId: MessageUUID,
              isFromContact: true,
            }
            console.log("reply!", reply)
            insertMessage.call(reply)

          } else  {
            console.log("We are not handling this reply bc we never sent a message first")
          }
          // TODO: Figure out how to link the text to the actual message thread

            // From: '13025215541',
            // I20160425-01:23:36.814(-7)?   TotalRate: '0',
            // I20160425-01:23:36.815(-7)?   Units: '1',
            // I20160425-01:23:36.815(-7)?   Text: 'Guys',
            // I20160425-01:23:36.815(-7)?   TotalAmount: '0',
            // I20160425-01:23:36.815(-7)?   Type: 'sms',
            // I20160425-01:23:36.816(-7)?   MessageUUID: '01a0ed96-0abf-11e6-a4b5-22000afd08f6' }
          res.end();
        }
      })
    }
  })
});
