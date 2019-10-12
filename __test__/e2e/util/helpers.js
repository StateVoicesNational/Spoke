import { Builder, until } from "selenium-webdriver";
import remote from "selenium-webdriver/remote";
import config from "./config";
import _ from "lodash";

import SauceLabs from "saucelabs";

const saucelabs = new SauceLabs({
  username: process.env.SAUCE_USERNAME,
  password: process.env.SAUCE_ACCESS_KEY
});

const defaultWait = 10000;

export const selenium = {
  buildDriver(options) {
    const capabilities = _.assign({}, config.sauceLabs.capabilities, options);
    const driver = process.env.npm_config_saucelabs
      ? new Builder()
          .withCapabilities(capabilities)
          .usingServer(config.sauceLabs.server)
          .build()
      : new Builder().forBrowser("chrome").build();
    driver.setFileDetector(new remote.FileDetector());
    return driver;
  },
  async quitDriver(driver) {
    await driver.getSession().then(async session => {
      if (process.env.npm_config_saucelabs) {
        const sessionId = session.getId();
        process.env.SELENIUM_ID = sessionId;
        await saucelabs.updateJob(sessionId, {
          passed: global.e2e.failureCount === 0
        });
        console.log(
          `SauceOnDemandSessionID=${sessionId} job-name=${process.env
            .TRAVIS_JOB_NUMBER || ""}`
        );
      }
    });
    await driver.quit();
  },
  reporter: {
    specDone: async result => {
      global.e2e.failureCount =
        global.e2e.failureCount + result.failedExpectations.length || 0;
    },
    suiteDone: async result => {
      global.e2e.failureCount =
        global.e2e.failureCount + result.failedExpectations.length || 0;
    }
  }
};

export const urlBuilder = {
  login: `${config.baseUrl}/login`,
  admin: {
    root() {
      return `${config.baseUrl}/admin/${global.e2e.organization}`;
    }
  },
  app: {
    todos() {
      return `${config.baseUrl}/app/${global.e2e.organization}/todos`;
    }
  }
};

const waitAnd = async (driver, locator, options) => {
  const el = await driver.wait(
    until.elementLocated(locator, options.msWait || defaultWait)
  );
  if (options.elementIsVisible !== false)
    await driver.wait(until.elementIsVisible(el));
  if (options.waitAfterVisible) await driver.sleep(options.waitAfterVisible);
  if (options.click) await el.click();
  if (options.keys) await driver.sleep(500);
  if (options.clear) await el.clear();
  if (options.keys) await el.sendKeys(options.keys);
  if (options.goesStale) await driver.wait(until.stalenessOf(el));
  return el;
};

export const wait = {
  async untilLocated(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({}, options));
  },
  async andGetEl(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({}, options));
  },
  async andClick(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({ click: true }, options));
  },
  async andType(driver, locator, keys, options) {
    return await waitAnd(
      driver,
      locator,
      _.assign({ keys, clear: true, click: true }, options)
    );
  },
  async andGetValue(driver, locator, options) {
    const el = await waitAnd(driver, locator, _.assign({}, options));
    return await el.getAttribute("value");
  },
  async andIsEnabled(driver, locator, options) {
    const el = await waitAnd(driver, locator, _.assign({}, options));
    return await el.isEnabled();
  }
};
