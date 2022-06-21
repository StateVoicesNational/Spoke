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

* `sub`: identifier, in this case email, of the user with this assertion
* `iat`: date the token was issued, in seconds since Unix Epoch
* `exp`: date the token expired, in seconds since Unix Epoch
* `iss`: name of the issuing app
* `aud`: name of the intended audience for this token

The last 2 claims in the token are not standard and are used to support upserting new users
* `name`: user's name
* `user_organizations`: list of JSON objects with the user's organization and role membership


#### Configure Spoke env vars

Set the following env vars:
* PASSPORT_STRATEGY: Set this to `token`
* TOKEN_AUTH_URL: url in your third-party app that will generate a new JWT and redirects the user to `https://<spoke domain>/login-callback?jwt=<jwt>`
* TOKEN_AUTH_SHARED_SECRET: arbitrary string that will be shared between spoke and the third-party app, and will be used to ensure the validity of the JWT
* TOKEN_AUTH_ISSUER: issuer of the token, needs to match between Spoke and third-party app
* TOKEN_AUTH_AUDIENCE: audience of the token, needs to match between Spoke and third-party app
