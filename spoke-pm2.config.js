const spokeConfig = require('./spoke.config')

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'spoke-server',
      script: './build/server/server',
      env: spokeConfig
    },
    {
      name: 'job-handler',
      script: './build/server/workers/job-handler.js',
      env: spokeConfig
    },
    {
      name: 'incoming-message-handler',
      script: './build/server/workers/incoming-message-handler.js',
      env: spokeConfig
    },
    {
      name: 'message-sender-01',
      script: './build/server/workers/message-sender-01.js',
      env: spokeConfig
    },
    {
      name: 'message-sender-234',
      script: './build/server/workers/message-sender-234.js',
      env: spokeConfig
    },
    {
      name: 'message-sender-56',
      script: './build/server/workers/message-sender-56.js',
      env: spokeConfig
    },
    {
      name: 'message-sender-789',
      script: './build/server/workers/message-sender-789.js',
      env: spokeConfig
    },
    {
      name: 'number-assigner',
      script: './build/server/workers/number-assigner.js',
      env: spokeConfig
    }
  ]
};
