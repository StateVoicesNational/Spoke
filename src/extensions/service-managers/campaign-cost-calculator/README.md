# Campaign Cost Service Manager

This service manager calculates the SMS costs for started (and archived) campaigns.

Importantly, it calculates the cost on the basis of the number of message
_segments_ used. This ensures a more accurate (though not 100% foolproof) estimate
of costs.

## Requirements

- [PostgreSQL](https://www.postgresql.org/)
- [PL/v8 language extension for PostgreSQL](https://plv8.github.io/)

This extension has been tested against PostgresSQL 11 specifically.
Your mileage may vary with other versions.

You will need administrator privileges in your database to perform installation.

## Installation

### Modify your .env file

1. Add `campaign-cost-calculator` to your `SERVICE_MANAGERS` variable
2. Add `CAMPAIGN_COST_CURRENCY` and assign it a three letter currency code in quotes (eg. `CAMPAIGN_COST_CURRENCY='USD'`)
3. Add `CAMPAIGN_COST_INBOUND` and assign it the number (eg. `CAMPAIGN_COST_INBOUND=0.0025`)
4. Add `CAMPAIGN_COST_OUTBOUND` and assign it the outbound pricea (eg. `CAMPAIGN_COST_OUTBOUND=0.055`) 

### Configure PostgreSQL

Use `psql` or your preferred database client and connect as an administrator
to your postgresql Spoke database. Then run the following commands:

1. Install the PL/v8 language extension

`CREATE EXTENSION plv8;`

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

2. Create a function to count extended GSM-7 messages

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

3. Create a function to calculate the number of segments used for a message

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

4. Create a function to calculate the inbound, outbound and total costs for a Spoke campaign

    CREATE OR REPLACE FUNCTION SMSCampaignCost(cid INT, obp FLOAT4, ibp FLOAT4) RETURNS JSON AS $$
      const campaignId = cid;
      const outboundPrice = obp;
      const inboundPrice = ibp;
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
      outboundCost = +(Math.round((outboundSegments * outboundPrice) + "e+2") + "e-2");
      inboundCost = +(Math.round((inboundSegments * inboundPrice) + "e+2") + "e-2");
    
      return {
        outboundCost: outboundCost,
        inboundCost: inboundCost,
        totalCost: outboundCost + inboundCost
      }
    $$ LANGUAGE plv8 IMMUTABLE STRICT;

## Notes

### Use of PL/v8

The PL/v8 language extension is not included by default in PostgreSQL installations.
It also appears to be an abandoned project. As such, there are plans to rewrite
the database functions in Python. The PL/Python language extension is included in
the standard PostgreSQL distribution and therefore more readily available for more
people.

### Data structure returned from database might be different

While developing this extension it was noted that the structure of the JSON data
returned by the SMSCampaignCost function to Spoke was slightly different depending
on the version of PostgreSQL. In particular the JSON object either look like this:

    {
      smscampaigncost: { outboundCost: 0.3, inboundCost: 0.01, totalCost: 0.31 }
    }

or looked like this:

    {
      smscampaigncost: { outboundcost: 0.3, inboundcost: 0.01, totalcost: 0.31 }
    }

This is enough of a change to break the extension. Spoke will still run but
the extension will report costs as `$undefined USD` or similar.

If you find this to be true in your installation, you may need to modify the contents
of the `index.js` file (lines 49-51 in particular).

## Acknowledgements

The JavaScript code to calculate the number of segments is drawn almost entirely
verbatim from [danxexe's sms-counter project](https://github.com/danxexe/sms-counter).
