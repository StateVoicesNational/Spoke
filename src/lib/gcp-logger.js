import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(), // Use JSON format
  transports: [
    new winston.transports.Console()
  ],
});

export { logger as gcpLogger };