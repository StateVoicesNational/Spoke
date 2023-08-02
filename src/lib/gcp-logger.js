import { Logging } from '@google-cloud/logging';

const logging = new Logging();

// Selects the log to write to
const gcpLog = logging.log('spoke');

// The metadata associated with the entry
const metadata = {
  resource: {type: 'global'},
};

export function gcpLogger(name, level, args) {
  // If the log data is an object, log it as is.
  // If it's a string, log it under the 'message' key.
  let data;
  if (args.length === 1 && typeof args[0] === 'object') {
    if (args[0] instanceof Error) {
      // For Error objects, log the message and stack trace
      data = {message: args[0].message, stack: args[0].stack};
    } else {
      // For other objects, log them as is
      data = args[0];
    }
  } else {
    data = {message: args.join(' ')};
  }

  const textPayload = `${name}/${level}: ${data.message}`; // this will be the main text
  const fullPayload = {
    message: textPayload,
    data,
    timestamp: (new Date()).toISOString(),
  };

  const entry = gcpLog.entry(metadata, fullPayload);
  gcpLog.write(entry).catch(console.error);
};
