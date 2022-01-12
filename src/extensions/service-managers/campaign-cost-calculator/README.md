// Run the following commands in your Spoke database to set up
// the required code to support the Twilio Cost Calculator service manager

// 1. Enable the PLV8 language extension
CREATE EXTENSION plv8;

// 2. Function to detect SMS message encoding

CREATE OR REPLACE FUNCTION SMSDetectEncoding(msg TEXT) RETURNS INT AS $$
  const gsm7bitChars = "@£$¥èéùìòÇ\\nØø\\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\\\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
  const gsm7bitExChar = "\\^{}\\\\\\[~\\]|€";
  const gsm7bitRegExp = RegExp("^[" + gsm7bitChars + "]*$");
  const gsm7bitExRegExp = RegExp("^[" + gsm7bitChars + gsm7bitExChar + "]*$");
  switch (false) {
    case msg.match(gsm7bitRegExp) == null:
      return 1;
    case msg.match(gsm7bitExRegExp) == null:
      return 2;
    default:
      return 3;
  }
$$ LANGUAGE plv8 IMMUTABLE STRICT;

// 3. Function to count extended GSM-7 message length

CREATE OR REPLACE FUNCTION SMSCountGSMExt(msg TEXT) RETURNS INT AS $$
  const gsm7bitExChar = "\\^{}\\\\\\[~\\]|€";
  const gsm7bitExOnlyRegExp = RegExp("^[\\" + gsm7bitExChar + "]*$");
  var char2, chars;
  chars = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = msg.length; _i < _len; _i++) {
      char2 = msg[_i];
      if (char2.match(this.gsm7bitExOnlyRegExp) != null) {
        _results.push(char2);
      }
    }
    return _results;
  }).call(this);
  return chars.length;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

// 4. Calculate number of segments for message

CREATE OR REPLACE FUNCTION SMSSegments(msg TEXT) RETURNS INT AS $$
  const messageLength = {
    1: 160,
    2: 160,
    3: 70
  };
  const multiMessageLength = {
    1: 153,
    2: 153,
    3: 67
  };
  let fnDetect = plv8.find_function("SMSDetectEncoding", msg);
  let fnCountExt = plv8.find_function("SMSCountGSMExt", msg);
  let remaining;
  const encoding = fnDetect(msg);
  let length = msg.length;
  if (encoding === 2) {
    length += fnCountExt(msg);
  }
  let per_message = messageLength[encoding];
  if (length > per_message) {
    per_message = multiMessageLength[encoding];
  }
  let segments = Math.ceil(length / per_message);
  remaining = (per_message * segments) - length;
  if(remaining == 0 && segments == 0){
    remaining = per_message;
  }
  return segments;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

// 5. Calculate total cost of campaign

CREATE OR REPLACE FUNCTION SMSCampaignCost(cid INT) RETURNS JSON AS $$
  const campaignId = cid;
  const outboundPrice = 0.075;
  const inboundPrice = 0.0049;
  let fnCount = plv8.find_function("SMSSegments");
  const messages = plv8.execute('SELECT m.text, m.is_from_contact FROM message m INNER JOIN campaign_contact cc ON cc.id = m.campaign_contact_id WHERE cc.campaign_id = $1',[ campaignId ]);

  let outboundSegments = 0;
  let inboundSegments = 0;
  let outboundCost = 0;
  let inboundCost = 0;
  for (let i = 0; i < messages.length; i++) {
    (messages[i].is_from_contact)
    ? inboundSegments += fnCount(messages[i].text)
    : outboundSegments += fnCount(messages[i].text);
  }
  outboundCost = outboundSegments * outboundPrice;
  inboundCost = inboundSegments * inboundPrice;

  return {
    outboundCost: outboundCost,
    inboundCost: inboundCost,
    totalCost: outboundCost + inboundCost
  }
$$ LANGUAGE plv8 IMMUTABLE STRICT;

