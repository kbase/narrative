/* eslint strict: ["error", "global"] */
/* global browser */

'use strict';
const TOKEN = browser.config.kbaseToken;
const URL_BASE = browser.config.baseUrl;

const makeURL = (path) => `${URL_BASE}/${path}`;

async function setSessionCookie () {
    return await browser.setCookies([{
        name: 'kbase_session',
        path: '/',
        secure: false,
        value: TOKEN,
        samesite: 'Lax'
    }]);
}

async function login() {
    await browser.url(makeURL('narrative/static/kbase/config/config.json'));
    await setSessionCookie();
    return;
}

module.exports = {
    setSessionCookie: setSessionCookie,
    login: login,
    makeURL: makeURL
};
