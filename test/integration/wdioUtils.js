/* eslint strict: ["error", "global"] */
/*global browser, $*/

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
    for (const letter of s.split()) {
        await browser.keys(letter);
    }
}

async function openNarrative(workspaceId) {
    await browser.url(makeURL(`narrative/${workspaceId}`));
    await $('#notebook-container');
}

// async function init() {
//     browser.setTimeout({ 'implicit': 30000 });
// }

// async function finish() {
//     await browser.reloadSession();
// }

module.exports = {
    setSessionCookie,
    login,
    makeURL,
    sendString,
    openNarrative
};