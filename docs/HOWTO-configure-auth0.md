# How to configure Auth0 for authentication

There are two authentication backends supported for Spoke.  The first and default is using
[https://auth0.com](https://auth0.com). This service allows support for e.g. Google authentication
and others, and supports things like password resets and account management separate from Spoke.

The alternative and default for development environments is local login, where passwords are hashed locally
in the database and resets, etc are administered all within Spoke.  While good for development, we
believe Auth0 still provides better security for production environments.  Below are the steps to configure
Spoke for Auth0.

## Configuration Steps

1. First configure the environment variable `PASSPORT_STRATEGY=auth0` in `.env` or wherever to configure Spoke environment
variables.
2. Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to [Applications](https://manage.auth0.com/#/applications/), click on `Default App` and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
3. Run `yarn dev` to create and populate the tables.
4. In your Auth0 app settings, set the following (Note: for development use `http://localhost:3000` instead of `https://yourspoke.example.com`):
    + **Allowed Callback URLs** - `https://yourspoke.example.com/login-callback`
    + **Allowed Web Origins** - `https://yourspoke.example.com`
    + **Allowed Logout URLs** - `https://yourspoke.example.com/logout-callback`
    + **Allowed Origins (CORS)** - `https://yourspoke.example.com`
5. In Advanced Settings, under the OAuth section, turn off 'OIDC Conformant'.
6. Add a [new empty rule](https://manage.auth0.com/#/rules/create) in Auth0:
```javascript
function (user, context, callback) {
context.idToken["https://spoke/user_metadata"] = user.user_metadata;
callback(null, user, context);
}
```
7. Update the Auth0 [Universal Landing page](https://manage.auth0.com/#/login_page), click on the `Customize Login Page` toggle, and copy and paste following code in the drop down into the `Default Templates` space:

    <details>
    <summary>Code to paste into Auth0</summary>

    ```html
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
      <title>Sign In with Auth0</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
      <!--[if IE 8]>
      <script src="//cdnjs.cloudflare.com/ajax/libs/ie8/0.2.5/ie8.js"></script>
      <![endif]-->

      <!--[if lte IE 9]>
      <script src="https://cdn.auth0.com/js/base64.js"></script>
      <script src="https://cdn.auth0.com/js/es5-shim.min.js"></script>
      <![endif]-->
      <script src="https://cdn.auth0.com/js/lock/11.11/lock.min.js"></script>
      <script>
        // Decode utf8 characters properly
        var config = JSON.parse(decodeURIComponent(escape(window.atob('@@config@@'))));
        config.extraParams = config.extraParams || {};
        var connection = config.connection;
        var prompt = config.prompt;
        var languageDictionary;
        var language;

        if (config.dict && config.dict.signin && config.dict.signin.title) {
          languageDictionary = { title: config.dict.signin.title };
        } else if (typeof config.dict === 'string') {
          language = config.dict;
        }
        var loginHint = config.extraParams.login_hint;

        // Available Lock configuration options: https://auth0.com/docs/libraries/lock/v11/configuration
        var lock = new Auth0Lock(config.clientID, config.auth0Domain, {
          auth: {
            redirectUrl: config.callbackURL,
            responseType: (config.internalOptions || {}).response_type ||
              (config.callbackOnLocationHash ? 'token' : 'code'),
            params: config.internalOptions
          },
          // Additional configuration needed for custom domains: https://auth0.com/docs/custom-domains/additional-configuration
          // configurationBaseUrl: config.clientConfigurationBaseUrl,
          // overrides: {
          //   __tenant: config.auth0Tenant,
          //   __token_issuer: 'YOUR_CUSTOM_DOMAIN'
          // },
          assetsUrl:  config.assetsUrl,
          allowedConnections: ['Username-Password-Authentication'],
          rememberLastLogin: !prompt,
          language: language,
          languageDictionary: {
            title: 'Spoke',
            signUpTerms: 'I agree to the <a href="YOUR_LINK HERE" target="_new">terms of service and privacy policy</a>.'
          },
          mustAcceptTerms: true,
          theme: {
            logo:            '',
            primaryColor:    'rgb(83, 180, 119)'
          },
          additionalSignUpFields: [{
            name: 'given_name',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png',
            placeholder: 'First Name'
          }, {
            name: 'family_name',
            placeholder: 'Last Name',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png'
          }, {
            name: 'cell',
            placeholder: 'Cell Phone',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png',
            validator: (cell) => ({
              valid: cell.length >= 10,
              hint: 'Must be a valid phone number'
            })
          }],
          prefill: loginHint ? { email: loginHint, username: loginHint } : null,
          closable: false,
          defaultADUsernameFromEmailPrefix: false,
          // Uncomment if you want small buttons for social providers
          // socialButtonStyle: 'small'
        });
        lock.show();
      </script>
    </body>
    </html>
    ```

    </details>

