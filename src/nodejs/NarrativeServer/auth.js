'use strict';

const cookie = require('cookie');
const HttpError = require('./utils').HttpError;
const QueryString = require('querystring');

module.exports.Auth = Object.create({}, {
    parseCookie: {
        value: function (cookie) {
            const obj = {};
            cookie.split(/\|/).forEach((field) => {
                const o = field.split(/=/);
                obj[o[0]] = o[1];
            });
            return obj;
        }
    },
    fixToken: {
        value: function (token) {
            return token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');
        }
    },
    parseSessionCookie: {
        value: function (cookie) {
            const session = this.parseCookie(cookie);
            session.token = this.fixToken(session.token);
            return session;
        }
    },
    getSession: {
        value: function (req) {
            // NB not validating during this feasibility test.
            //
            // Check the userid from the cookie against the requested user

            // Validate the token (via signature)

            // NB the original lua implementation used the kbase_sessionid, but
            // in the code the session id variable is set to the username, so I
            // presume this was a change in implementation to key of of the username
            // for containers rather than session -- but the variable names and comments
            // were not updated.
            if (!req.headers.cookie) {
                throw new Error('No narrative auth cookie');
            }
            const cookies = cookie.parse(req.headers.cookie);

            const narrCookie = cookies.kbase_session;
            if (!narrCookie) {
                throw HttpError.make(401, 'Auth required', 'Sorry, you need to log in');
                // throw new Error('No narrative auth cookie');
            }
            const session = this.parseSessionCookie(narrCookie);
            if (!session) {
                throw new Error('Session is missing or invalid');
            }
            const userId = session.user_id;
            if (!userId) {
                throw new Error('User id not found');
            }
            return userId;
        }
    },
    renderLogin: {
        value: function (req, res, url) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            const content = '<form action="/signin" method="POST">'+
                          'Username: <input type="text" name="username"><br>'+
                          'Password: <input type="password" name="password"><br>'+
                          '<input type="text" name="return_uri" value="' + url.query.return_uri + '">'+
                          '<button type="submit">Sign In</button>'+
                          '</form>';

            res.write(content);
            res.end();
        }
    },
    handleSignin: {
        value: function (req, res, url) {
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            });
            req.on('end', () => {
                const formData = QueryString.parse(data);
                const username = formData.username;
                const password = formData.password;

                res.setHeader('Set-Cookie', [cookie.serialize('kbase_session', username)]);

                console.log(formData);

                const location = formData.return_uri;
                res.statusCode = 302;
                res.setHeader('Location', location);
                res.end();
            });
        }
    }
});
