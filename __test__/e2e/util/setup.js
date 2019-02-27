// This script will execute before the entire end to end run
jest.setTimeout(3000) // Set the test callback timeout to 1 minute
global.e2e = {} // Pass global information around using the global object as Jasmine context isn't available.
