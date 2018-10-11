const AUTH_SERVER = 'https://d60402.auth0.com'; // CHANGE THIS TO YOUR AUTH0 DOMAIN
const AUDIENCE = 'https://my-api.org/api/v1'; // CHANGE THIS TO YOUR API IDENTIFIER AS DEFINED IN AUTH0 APIS
const CLIENT_ID = 'djB0UQRDP7PQUtcxkd465yCOsh8IOu7'; // CHANGE THIS TO YOUR NATIVE APPLICATION CLIENT ID AS DEFINE IN AUTH0
const REDIRECT_URI = 'http://localhost:3000'; // ADD THIS URL TO 'ALLOWED CALLBACK URLS' IN THE NATIVE APP SETTINGS IN AUTH0; OPTIONALLY CHANGE TO DIFFERENT, AVAILABLE PORT ON CLI WORKSTATION
const SCOPE = ''; // OPTIONAL: SET TO 'openid offline_access' TO INCLUDE BOTH ID AND REFRESH TOKENS IN ADDITION TO ACCESS TOKEN

var UserAuthenticator = require('./userAuthenticator');

var authenticator = new UserAuthenticator({
    authorizationServer : AUTH_SERVER,
    audience : AUDIENCE,
    clientId : CLIENT_ID,
    redirectUri : REDIRECT_URI,
    scope: SCOPE
});

authenticator.login()
.then(function (tokenData) {

    var accessToken = tokenData.accessToken;
    var tokenType = tokenData.tokenType;
    var expiresIn = tokenData.expiresIn;
    var idToken = tokenData.idToken;
    var refreshToken = tokenData.refreshToken;

    console.log();
    console.log("Access token: " + accessToken);
    console.log();
    console.log("Token type: " + tokenType);
    console.log();
    console.log("Expires in: " + expiresIn);
    console.log();
    console.log("ID token: " + idToken);
    console.log();
    console.log("Refresh token: " + refreshToken);

    // Uncomment this block to illustrate getting refreshed access token...
    /*
    if (refreshToken) {
        console.log();
        console.log('Attempting refresh token flow...');
        console.log();

        var refreshAuthenticator = new UserAuthenticator({
            authorizationServer : AUTH_SERVER,
            clientId : CLIENT_ID,
            refreshToken : refreshToken
        }).login()
        .then(function (tokenData) {
            console.log('Refrehed token data: ' + JSON.stringify(tokenData));    
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    */
})
.catch(function (error) {
    console.log(error);
});
