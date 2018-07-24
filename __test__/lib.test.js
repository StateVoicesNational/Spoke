import { resolvers } from '../src/server/api/schema'
import { schema } from '../src/api/schema'
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

  const doubleShouldOnlyUseFirst = 'foo bar [ https://example.com/foo.jpg ] and this other image! [ https://example.com/bar.jpg ]'
  expect(twilio.parseMessageText({ text: doubleShouldOnlyUseFirst }).mediaUrl).toBe('https://example.com/foo.jpg')
  expect(twilio.parseMessageText({ text: doubleShouldOnlyUseFirst }).body).toBe('foo bar  and this other image! [ https://example.com/bar.jpg ]')

  expect(twilio.parseMessageText({ text: undefined }).body).toBe('')
})
