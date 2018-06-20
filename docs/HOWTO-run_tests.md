There are current two ways to run tests, using either PostgreSQL or SQLite.

## PostgreSQL Testing (default, closer to most prod environments)

1) Install PostgreSQL
2) In PostgreSQL, create a database and user named "spoke_test":
```
CREATE DATABASE spoke_test;
CREATE USER spoke_test WITH PASSWORD 'spoke_test';
GRANT ALL PRIVILEGES ON DATABASE spoke_test TO spoke_test;
```
3) Run `npm test`

## SQLite Testing (simpler)

1) Run `npm run test-sqlite`

## End-To-End (Interactive Browser) Testing

1. Remember to set `NODE_ENV=dev` 
1. **Start DB** and **Start Spoke Server** as described in the [Getting Started](
https://github.com/MoveOnOrg/Spoke/blob/main/README.md#getting-started) section. 
1. Install browser driver(s)
    
    * Installing chromedriver on MacOS
        ```
        brew tap homebrew/cask
        brew cask install chromedriver
        ```
    * References
        * [Selenium HQ - JavaScript Docs](http://seleniumhq.github.io/selenium/docs/api/javascript/)
        * [Homebrew - Casks - chromedriver](https://github.com/Homebrew/homebrew-cask/blob/master/Casks/chromedriver.rb)
1. Running tests...
    * ... using your local browser
      ```
      npm run test-e2e
      ```
    * ... using Sauce Labs
      ```
      export SAUCE_USERNAME=<Sauce Labs user name>
      export SAUCE_ACCESS_KEY=<Sauce Labs access key>
      npm run test-e2e --saucelabs
      ```
