var Superagent = require('superagent');
var Http = require('http');
var Url = require('url');
var Open = require('opn');
var Crypto = require('crypto');

module.exports = UserAuthenticator;

function UserAuthenticator (config) {
    if (!config) config = {};

    this.authorizationServer = config.authorizationServer;
    this.audience = config.audience;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.refreshToken = config.refreshToken;
    this.scope = config.scope;
}

UserAuthenticator.prototype.login = function (options) {
    options = options || {};

    if (this.refreshToken) {
        return this._refreshFlow(options);
    }
    else {
        return this._authorizationFlow(options);
    }
};

// Refresh token flow
UserAuthenticator.prototype._refreshFlow = function (options) {
    var refreshUrl = Url.parse(this.authorizationServer);
    refreshUrl.pathname = '/oauth/token';
    var self = this;
    return Superagent
        .post(Url.format(refreshUrl))
        .send({
            grant_type: 'refresh_token',
            client_id: this.clientId,
            refresh_token: this.refreshToken,
        })
        .then(res => {
            console.log('Your access token was successfuly refreshed.');
            return self._processAccessTokenResponse(options, res.body);
        })
        .catch(e => {
            // In case of any error during refresh token flow, fall back on
            // regular authorization flow
            console.log(`Failure trying to refresh the access token: ${e.message}`);
            return self._authorizationFlow(options);
        });
};

// Browser based authorization flow
UserAuthenticator.prototype._authorizationFlow =  function (options) {
    // Initialize PKCE authorization flow through a browser

    var self = this;
    var codeVerifier = base64URLEncode(Crypto.randomBytes(16));
    var codeChallange = base64URLEncode(Crypto.createHash('sha256').update(codeVerifier).digest());
    var port = Url.parse(self.redirectUri).port;

    var onceServer$ = createOnceServer();
    var loginUrl = createLoginUrl();

    console.log('Attempting to open the following login url in your browser: ');
    console.log();
    console.log(loginUrl);
    console.log();
    console.log('If the browser does not automatically open, please copy this address and paste it into your browser.');

    Open(loginUrl, { wait: false });

    return onceServer$;

    // Create PKCE login URL
    function createLoginUrl() {
        var loginUrl = Url.parse(self.authorizationServer, true);
        loginUrl.pathname = '/authorize';
        loginUrl.query = {
            redirect_uri: self.redirectUri,
            audience: self.audience,
            response_type: 'code',
            client_id: self.clientId,
            scope: self.scope,
            code_challenge: codeChallange,
            code_challenge_method: 'S256',
        };

        return Url.format(loginUrl);
    }

    // Returns a promise that resolves when a transient, localhost HTTP server
    // receives the first request. This request is a redirect from the authorization server.
    function createOnceServer() {
        return new Promise((resolve, reject) => {
            var server = Http.createServer((req, res) => {

                return processRedirectCallback(req, done);

                function done(error, data) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    if (error) {
                        res.end(error.message);
                    }
                    else {
                        res.end('Authentication successful. You may close this browser window/tab.');
                    }
                    server.close();
                    return error ? reject(error) : resolve(data);
                }
            }).listen(port, (e) => {
                if (e) reject(e);
            });
        });
    }

    // Process redirect from authorization server to get authorization code
    function processRedirectCallback(req, done) {
        var url = Url.parse(req.url, true);
        if (req.method !== 'GET' || url.pathname !== '/') {
            return done(new Error(`Authentication failed. Invalid redirect from authorization server: ${req.method} ${req.url}`));
        }

        if (url.query.error) {
            return done(new Error(`Authentication failed: ${url.query.error}.`));
        }
        if (!url.query.code) {
            return done(new Error(`Authentication failed. Authorization server response does not specify authorization code: ${req.url}.`));
        }

        return exchangeAuthorizationCode(url.query.code, done);
    }

    // Exchange authorization code for access token using PKCE
    function exchangeAuthorizationCode(code, done) {
        var tokenUrl = Url.parse(self.authorizationServer);
        tokenUrl.pathname = '/oauth/token';

        return Superagent
            .post(Url.format(tokenUrl))
            .send({
                grant_type: 'authorization_code',
                client_id: self.clientId,
                code,
                code_verifier: codeVerifier,
                redirect_uri: self.redirectUri
            })
            .end((e,r) => {
                if (e) return done(new Error(`Unable to obtian access token: ${e.message}.`));
                return self._processAccessTokenResponse(options, r.body, done);
            });
    }

};

// Process refresh token or authorization code exchange response
UserAuthenticator.prototype._processAccessTokenResponse = function(options, body, done) {

    var data = {};

    if (body) {
        data.accessToken = body.access_token;
        data.refreshToken = body.refresh_token;
        data.idToken = body.id_token;
        data.expiresIn = body.expires_in;
        data.tokenType = body.token_type;
    } else {
        return done(new Error('Error processing access token response.'));
    }

    return done ? done(null, data) : data;
};

function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}