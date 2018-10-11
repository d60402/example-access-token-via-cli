# example-access-token-via-cli
Node.js example CLI using Auth0 to obtain access token for an API

For more details, see https://auth0.com/docs/integrations/using-auth0-to-secure-a-cli

Assumptions
-----------
This example assumes you are familiar with Auth0, and have created an [API](https://auth0.com/docs/apis) and an [Application](https://auth0.com/docs/applications) (of type Native) in the Auth0 Dashboard.

This example also assumes you are familiar with Node.js. However, the same concepts should apply to most languages and platforms.

Overview
--------

This example assumes there is no way to safely store that client secret. Therefore the [Authorization Code Grant with Proof Key Code Exchange (PKCE)](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce) flow is used.

The Authorization Code Grant is what’s known as a redirect-based flow. This implies that a user agent, typically a web browser, along with an HTTP server need to be used in this flow. So what this means in our scenario is that the CLI needs to first launch a web browser for the user to authenticate and authorize the application to access the API, and then secondly retrieve the authorization code that is returned to the callback or redirect URI. The CLI does this second piece by spinning up a temporary HTTP server with an endpoint that corresponds to that callback. Finally, the CLI exchanges the authorization code for a token(s).

Configuration
-------------

- Edit the `cli.js` file, and substitue your Auth0 domain (`AUTH_SERVER`), API identifier (`AUDIENCE`), and application client id (`CLIENT_ID`) in the constants at the top of the file.
- Make sure the `REDIRECT_URI` value is added to your application's **Allowed Callback URLs** list in the Auth0 Dashboard. The port number can be changed to any available port.
- To also get an ID token, include `'openid'` in the `SCOPE` constant. To get a refresh token, include `'offline_access'`. To get both, use `'openid offline_access'`.

```
const AUTH_SERVER = 'https://<YOUR_TENANT>.auth0.com';
const AUDIENCE = 'https://your-api.com/api/v1';
const CLIENT_ID = '<YOUR_CLIENT_ID>';
const REDIRECT_URI = 'http://localhost:3000';
const SCOPE = '';
```

Run It
------
- From a terminal command line, run the CLI with the command `node cli.js`. The default browser should be launched to the `/authorize` endpoint where the user can login with credentials in an Auth0 connection that is enabled for the application.
- After first authentication, a consent dialog should be displayed.
- Once consent is given, the response will be redirected to the callback/redirect URL where the CLI will retrive the authorization code.
- Finally, the CLI will exchange the authorization code for one or more tokens (access, id, and/or refresh).
- The tokens are logged to the console.

