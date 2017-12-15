import { schema, resolvers } from '../src/server/api/schema'
import twilio from '../src/server/api/lib/twilio'
import { makeExecutableSchema } from 'graphql-tools'

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true,
})

it('should parse a message with a media url', () => {
  expect(twilio.parseMessageText({ text: 'foo bar' }).body).toBe('foo bar')
  expect(twilio.parseMessageText({ text: 'foo bar [http://example.com/foo.jpg]' }).body).toBe('foo bar ')
  expect(twilio.parseMessageText({ text: 'foo bar [http://example.com/foo.jpg]' }).mediaUrl).toBe('http://example.com/foo.jpg')
  expect(twilio.parseMessageText({ text: 'foo bar [ https://example.com/foo.jpg ]' }).mediaUrl).toBe('https://example.com/foo.jpg')
  expect(twilio.parseMessageText({ text: undefined }).body).toBe('')
})
