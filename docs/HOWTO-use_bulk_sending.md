# How to configure Spoke for bulk sending outside the USA

## About bulk sending

If Spoke is configured to do bulk sending, a `Send Bulk` button will appear on the texter's view for the first contact. When the texter clicks that button, the next chunk of contacts will receive the initial message. After Spoke queues up messages for those contacts, if there are any contacts left in the texter's assignment, the next chunk of contacts will receive messages the next time the texter clicks `Send Bulk`.

If you navigate away from the page or your computer falls asleep during a bulk send, the send will be interrupted. You must refresh the page and click the `Send Bulk` button again to continue sending messages. You can check on the progress of a bulk send by opening Developer Tools and looking at the console logs.

Only contacts needing the initial message will receive a message.

## After confirming that you can legally use the feature

Refer to [REFERENCE-environment_variables.md](REFERENCE-environment_variables.md) for more information about the environment variables mentioned below.

1. Set the environment variable `ALLOW_SEND_ALL` to `true`.
2. Set the environment variable `BULK_SEND_CHUNK_SIZE` to a number greater than 0.
3. Set the environment variable `BULK_SEND_BATCH_SIZE` to a number greater than 0 and less than or equal to `BULK_SEND_CHUNK_SIZE`.
4. Restart Spoke.

## Example: `.env` file

If you use a `.env` file to configure Spoke, the changes above would appear as follows. If you're using some other method to configure Spoke (such as Heroku settings) please follow the procedures and instructions for that method.

```
ALLOW_SEND_ALL=true
BULK_SEND_CHUNK_SIZE=50000
BULK_SEND_BATCH_SIZE=400
```
