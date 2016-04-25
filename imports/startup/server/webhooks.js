import { Picker } from 'meteor/meteorhacks:picker'
import bodyParser from 'body-parser'

Picker.middleware( bodyParser.urlencoded( { extended: false } ) );

console.log(bodyParser)
// Handle post only
Picker.route('/pligo', function(params, req, res, next) {
  const {Text, MessageUUID} = req.body
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
