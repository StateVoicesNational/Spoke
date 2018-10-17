import crypto from 'crypto'
const uuidv4 = require('uuid').v4

export function newUUID() {
  return uuidv4()
}

export function getHash(text) {
  const shaHash = crypto.createHash('sha256')
  shaHash.update(text)
  return shaHash.digest('base64')
}
