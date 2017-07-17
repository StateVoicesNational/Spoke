var testsContext = require.context(".", true, /_test$/);
testsContext.keys().forEach(testsContext);

console.log("Running tests");
