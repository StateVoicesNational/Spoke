const randomString = () => (
  Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
)
const mocks = {
  String: () => `STRING_MOCK_${randomString()}`,
  Date: () => new Date(),
  Int: () => 42,
  ID: () => `ID_MOCK_${randomString()}`,
  Phone: () => '+12223334444',
  Timezone: () => { return { offset: -9, hasDST: true } },
  JSON: () => '{"field1":"value1", "field2": "value2"}'
}

export default mocks
