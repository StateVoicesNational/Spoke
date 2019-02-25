# Summary

## Selenium

End to end tests use **Selenium**, which is a framework which drives the WebDriver API exposed by browsers. A test script can therefore be executed at the UI level which is as close to a manual test as possible.

## Sauce Labs

**Sauce Labs** is a cloud service which provides access to test clients on which automated tests are run.

In order to run tests on Sauce Labs, environment variables need to get set on your environment:

The access keys `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` is set in the "Environment Variables" section of [Travis-CI](https://travis-ci.org/MoveOnOrg/Spoke/settings)

To run tests against your localhost on Sauce Labs clients, you must first setup [Sauce Labs Connect](https://wiki.saucelabs.com/display/DOCS/Basic+Sauce+Connect+Proxy+Setup).

Reporting is setup between Sauce Labs and Travis CI using a [Jasmine custom reporter](https://jasmine.github.io/api/edge/global.html#SuiteResult) and [console stdout](https://wiki.saucelabs.com/display/DOCS/Setting+Up+Reporting+between+Sauce+Labs+and+Jenkins#SettingUpReportingbetweenSauceLabsandJenkins-OutputtingtheJenkinsSessionIDtostdout) in the tests.

# Test Writing

## Jest / Jasmine

**Jest** is the test runner which locates, runs and summarizes the tests.

Reference: [Jest 22.4 docs](http://jestjs.io/docs/en/22.4/getting-started)

**Jasmine** is the BDD test framework used by many test harnesses including Jest.

Example of a Jasmine block:
```
describe('test description', () => {
  it('step description', async () => {
    // Operations
  })
})
```
A note on `this`: Arrow functions lexically bind the this keyword. This interferes with how the test runner wants to use the `this` keyword for context. More information is available online.

Reference: [Jasmine 2.0 docs](https://jasmine.github.io/2.0/introduction.html#section-The_%3Ccode%3Ethis%3C/code%3E_keyword)

Example of a validation statement:

```
const url = await driver.getCurrentUrl()
expect(url).toContain('www.example.com')
```

## Selectors

Example of an attribute for end to end selectors:
```
import { dataTest } from '../lib/attributes'
<Control
  {...dataTest('someValue')}
  ...
/>
```
This adds a `data-test` attribute to the **non-production** rendered HTML and indicates to future developers that this control is used in automated tests.

## Helpers

In `./Spoke/__test__/e2e/util/helpers.js` you'll find a helper named `wait`. This is an important collection of methods for interactive commands like click.

```
await wait.andClick(driver, <locator>)
```