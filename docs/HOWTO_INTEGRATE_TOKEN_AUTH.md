# How to configure Token Authentication

This integration uses a shared secret to validate a signed JSON Web Token (JWT)
to delegate the authentication of the current user to an external system. This
can be useful in scenarios where development teams are responsible for tightly
integrating a third-party app with Spoke. For more complex authentication environment
options, please see the Auth0 configuration.

## Set up

#### Configure the third-party system

This authentication strategy leverages JWT's flexibility to allow a third-party
app to assert that the user is authenticated and it also allows the app to set up
authorization for the user. Here is an example of a token payload:

```json
{
  "sub": "admin@spoke.test",
  "iat": 1655812965,
  "exp": 1655816565,
  "iss": "thirdparty",
  "aud": "spoke",
  "name": "Admin User",
  "user_organizations": [
    {
      "organization_id": 1,
      "role": "OWNER"
    }
  ]
}
```

- `sub`: identifier, in this case email, of the user with this assertion
- `iat`: date the token was issued, in seconds since Unix Epoch
- `exp`: date the token expired, in seconds since Unix Epoch
- `iss`: name of the issuing app
- `aud`: name of the intended audience for this token

The last 2 claims in the token are not standard and are used to support upserting new users

- `name`: user's name
- `user_organizations`: list of JSON objects with the user's organization and role membership

#### Configure Spoke env vars

Set the following env vars:

- PASSPORT_STRATEGY: Set this to `token`
- TOKEN_AUTH_URL: url in your third-party app that will generate a new JWT and redirects the user to `https://<spoke domain>/login-callback?jwt=<jwt>`
- TOKEN_AUTH_SHARED_SECRET: arbitrary string that will be shared between spoke and the third-party app, and will be used to ensure the validity of the JWT
- TOKEN_AUTH_ISSUER: issuer of the token, needs to match between Spoke and third-party app
- TOKEN_AUTH_AUDIENCE: audience of the token, needs to match between Spoke and third-party app

### Testing the token auth

There is a small script that echoes the JWT in the right format and using the appropriate values and shared secret.

**Setting up the initial organization and the initial superuser:**

In order to start authenticating using the delegated auth, a super user needs to be added to the database along with a new organization. This user can be created by either following the Spoke self sign up flow, or with the following SQL:

```sql
INSERT INTO organization (name)
    VALUES ('test_org');

INSERT INTO "user" (auth0_id, first_name, last_name, email,is_superadmin, terms, cell)
    VALUES ('local|super', 'Super', 'Admin', 'admin@spoke.test', 't', 't', '');

INSERT INTO user_organization (user_id, organization_id, role)
    VALUES ((SELECT id FROM "user" WHERE email = 'admin@spoke.test' LIMIT 1), (SELECT id FROM organization WHERE name = 'test_org' LIMIT 1), 'OWNER');
```

Once the initial user is set up, follow these steps to authenticate users using the dev script:

1. Set up your .env variables with sensible defaults and pointing to the scripts output. Example:

```
PASSPORT_STRATEGY=token
TOKEN_AUTH_URL=http://localhost:3001
TOKEN_AUTH_SHARED_SECRET=secret # Do not use this in production
TOKEN_AUTH_ISSUER=issuer
TOKEN_AUTH_AUDIENCE=audience
```

2. Start the JWT echo script by running `node dev-tools/jwt-echo.js` in the root of the Spoke repo.
3. Start the Spoke development server and open the browser on the login page
4. It should redirect you to a page with two text boxes where you can set up the users name and email address (which will be used to create a new user).
5. Clicking on the `Log in` button will authenticate you within Spoke
