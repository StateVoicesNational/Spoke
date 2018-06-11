const { Builder, By, Key, until } = require('selenium-webdriver');
const baseUrl = 'localhost:3000' //TODO: Belongs in a config file or maybe use the env var?
//promise.USE_PROMISE_MANAGER = false; //TODO: This was recommended by Selenum but it doesn't work.

describe('Signing up a new user to Spoke', () => {

    jest.setTimeout(60000); //TODO: Maybe this belongs in jest.config

    let driver;

    beforeAll(async () => {
        driver = await new Builder().forBrowser('chrome').build();
    })

    afterAll(async () => {
        await driver.quit();
    })

    it('gets the landing page', async () => {
        await driver.get(baseUrl);
    })

    it('clicks the login link', async () => {
        const loginUrl = `${baseUrl}/login`;
        let el = await driver.findElement(By.css('#login'));
        await driver.wait(until.elementIsVisible(el));
        await el.click();
        await driver.wait(until.urlContains(loginUrl));
        
        // Example of a validation statement.
        let url = await driver.getCurrentUrl();
        expect(url).toContain(loginUrl);

        // https://facebook.github.io/jest/docs/en/jest-platform.html
    })
})