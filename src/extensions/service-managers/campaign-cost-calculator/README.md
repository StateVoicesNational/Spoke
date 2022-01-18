# Campaign Cost Service Manager

This service manager calculates the SMS costs for started (and archived) campaigns.

Importantly, it calculates the cost on the basis of the number of message
_segments_ used. This ensures a more accurate (though not 100% foolproof) estimate
of costs.

## Requirements

- [PostgreSQL](https://www.postgresql.org/)

This extension has been tested against PostgreSQL 11 specifically.
Your mileage may vary with other versions (but shouldn't).

You will need administrator privileges in your database to perform installation.

## Installation

### Modify your .env file

1. Add `campaign-cost-calculator` to your `SERVICE_MANAGERS` variable
2. Add `CAMPAIGN_COST_CURRENCY` and assign it a three letter currency code in quotes (eg. `CAMPAIGN_COST_CURRENCY='USD'`)
3. Add `CAMPAIGN_COST_INBOUND` and assign it the inbound price per segment (eg. `CAMPAIGN_COST_INBOUND=0.0075`)
4. Add `CAMPAIGN_COST_OUTBOUND` and assign it the outbound price per segment (eg. `CAMPAIGN_COST_OUTBOUND=0.049`)

### Configure PostgreSQL

Use `psql` or your preferred database client and connect as an administrator
to your PostgreSQL Spoke database. Then run the following commands:

1. Install your language extension

```
CREATE EXTENSION plpgsql;
```

2. Create a function to detect message encoding

```
CREATE OR REPLACE FUNCTION smsdetectencoding(msg TEXT) RETURNS INT AS $$
DECLARE
  encoding integer :=3;
  _gsm7ch text := E'@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\\"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  _gsm7exch text := E'\\^{}\[~\\]\\|€';
  _gsm7regex text := E'^[' || _gsm7ch || ']*$';
  _gsm7exregex text := E'^[' || _gsm7ch || _gsm7exch || ']*$';
BEGIN
  IF REGEXP_MATCH(msg, _gsm7regex) IS NOT NULL THEN
    encoding := 1;
  ELSIF REGEXP_MATCH(msg, _gsm7exregex) IS NOT NULL THEN
    encoding := 2;
  ELSE
    encoding := 3;
  END IF;
  RETURN encoding;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
```

3. Create a function to count extended GSM-7 messages properly

```
CREATE OR REPLACE FUNCTION smscountgsmext(msg TEXT) RETURNS INT AS $$
DECLARE
_gsm7exch TEXT := E'\\^{}\\\\\\[~\\]|€';
_gsm7exregex TEXT := E'^[' || _gsm7exch || ']*$';
x TEXT;
_msgarr TEXT[];
len INT := 0;
BEGIN
  SELECT string_to_array(msg::TEXT, NULL) INTO _msgarr;
  FOREACH x IN ARRAY _msgarr LOOP
    IF REGEXP_MATCH(x, _gsm7exregex) IS NOT NULL THEN
      len := len + 2;
    ELSE
      len := len + 1;
    END IF;
  END LOOP;
  RETURN len;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
```

4. Create a function to calculate the number of segments used for a message

```
CREATE OR REPLACE FUNCTION smssegments(msg TEXT) RETURNS INT AS $$
DECLARE
  _msglen JSONB := '{ "1": 160, "2": 160, "3": 70 }';
  _mulmsglen JSONB := '{ "1": 153, "2": 153, "3": 67 }';
  _len INT;
  _enc INT;
  _permsg INT;
  segments INT;
BEGIN
  SELECT smsdetectencoding(msg) INTO _enc;
  SELECT length(msg) INTO _len;
  RAISE NOTICE 'len: %', _len;
  IF _enc = 2 THEN
    _len := _len + smscountgsmext(msg);
    RAISE NOTICE 'new len: %', _len;
  END IF;
  SELECT _msglen::jsonb->>_enc::TEXT INTO _permsg;
  IF _len > _permsg THEN
    SELECT _mulmsglen::jsonb->>_enc::TEXT INTO _permsg;
  END IF;
  SELECT ceil(_len::NUMERIC / _permsg) INTO segments;
  RETURN segments;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
```

5. Create a function to calculate the inbound, outbound and total costs for a Spoke campaign

```
CREATE OR REPLACE FUNCTION smscampaigncost(cid INT, obp FLOAT4, ibp FLOAT4) RETURNS JSON AS $$
DECLARE
  _obsegs INT := 0;
  _insegs INT := 0;
  _obcost FLOAT4 := 0.00;
  _ibcost FLOAT4 := 0.00;
  _totalcost FLOAT4;
  _msg RECORD;
  results RECORD;
BEGIN
  FOR _msg IN
    SELECT m.text, m.is_from_contact
    FROM message m
    INNER JOIN campaign_contact cc ON cc.id = m.campaign_contact_id
    WHERE cc.campaign_id = cid
  LOOP
    IF _msg.is_from_contact THEN
      SELECT (_insegs + SMSSegments(_msg.text)) INTO _insegs;
    ELSE
      SELECT (_obsegs + SMSSegments(_msg.text)) INTO _obsegs;
    END IF;
  END LOOP;

  _obcost := ROUND((_obsegs * obp)::NUMERIC, 2);
  _ibcost := ROUND((_insegs * ibp)::NUMERIC, 2);
  _totalcost := _obcost + _ibcost;
  SELECT _obcost AS outboundcost, _ibcost AS inboundcost, _totalcost AS totalcost INTO results;
  RETURN row_to_json(results);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
```

## Acknowledgements

The code to calculate the number of segments is an adaptation of 
[danxexe's sms-counter project](https://github.com/danxexe/sms-counter) work from JavaScript to PL/pgsql.
