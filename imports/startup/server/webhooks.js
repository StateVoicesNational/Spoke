import { Picker } from 'meteor/meteorhacks:picker'
import bodyParser from 'body-parser'
import { insertMessage, getFormattedPhoneNumber } from '../../api/messages/methods'
import { Messages } from '../../api/messages/messages'
// import { e164 } from 'libphonenumber'
Picker.middleware( bodyParser.urlencoded( { extended: false } ) );

// Handle post only
Picker.route('/plivo', function(params, req, res, next) {
  console.log("Incoming message from Plivo")
  const {To, From, Text, MessageUUID} = req.body
  const contactNumber = getFormattedPhoneNumber(From)
  const userNumber = getFormattedPhoneNumber(To)

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
});
