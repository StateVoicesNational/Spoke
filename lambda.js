'use strict'
const awsServerlessExpress = require('aws-serverless-express')
const app = require('./build/server/server/index')
const server = awsServerlessExpress.createServer(app.default)
exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context)
