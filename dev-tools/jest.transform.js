#!/usr/bin/env node
var config = require('dotenv').config()
require('babel-register')
require('babel-polyfill')
require('../' + process.argv[2])
model.exports = require('babel-jest').createTransformer(config)
