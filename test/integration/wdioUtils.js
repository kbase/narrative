/* eslint strict: ["error", "global"] */
/* global browser */

'use strict';
const TOKEN = browser.config.kbaseToken;
const BASE_URL = browser.config.baseUrl;

function makeURL(path) {
    return `${BASE_URL}/${path}`;
}

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
    const url = makeURL('narrative/static/kbase/config/config.json');
    await browser.url(url);
    await setSessionCookie();
    return;
}

async function sendString(s) {
    await seriesPromise(s.split('').map(async (letter) => {
        await browser.keys(letter);
    }));
}

async function seriesPromise(arrayOfPromises) {
    async function resolveNext([p, ...rest]) {
        if (!p) {
            return;
        }
        await p;
        await resolveNext(rest);
    }
    await resolveNext(arrayOfPromises);
}

async function openNarrative(workspaceId) {
    await browser.url(makeURL(`narrative/${workspaceId}`));
}

module.exports = {
    setSessionCookie,
    login,
    makeURL,
    seriesPromise,
    sendString,
    openNarrative
};
