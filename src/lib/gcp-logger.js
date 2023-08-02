import { LoggingWinston } from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston({
  logName: 'spoke', // The name of the log in Google Cloud Logging
  resource: { type: 'global' },
});

export { loggingWinston as gcpLogger };
