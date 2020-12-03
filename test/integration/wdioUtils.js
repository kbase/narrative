/* eslint strict: ["error", "global"] */
/*global browser, $*/

'use strict';

const TOKEN = browser.config.kbaseToken;
const BASE_URL = browser.config.baseUrl;

/**
 * Aids in constructing a url on the configured url base.
 * @arg {string} path - a path component of the url
 * @returns {string} The fully constructed url.
 */
function makeURL(path) {
    return `${BASE_URL}/${path}`;
}

/**
* Set the KBase auth session cookie from the token 
* configured in the global wdio "browser" object.
* @returns {Promise} Promise value is ignored
*/
async function login() {
    // This just needs to be some small text file present in the narrative 
    // site's document tree. 
    // The wdio "browser" needs to load a url on the narrative site 
    // before it can set the session cookie on it.
    const url = makeURL('narrative/static/kbase/config/config.json');
    await browser.url(url);
    await browser.setCookies([{
        name: 'kbase_session',
        path: '/',
        secure: false,
        value: TOKEN,
        samesite: 'Lax'
    }]);
    return;
}

/**
* "Types" a string into the wdio browser.
* Webdriver simulates user keyboard input by individual key presses.
* This function makes providing user keyboard easier by abstracting 
* input of a string.
* Note that the keys are sent to the currently focused control in the browser.
* @arg {string} stringToSend - the string to "type" into the browser
* @returns {Promise} Promise value is ignored
*/
async function sendString(stringToSend) {
    for (const letter of stringToSend.split()) {
        await browser.keys(letter);
    }
}

/**
* Navigates the wdio browser to a workspace as given by it's id, and waits until the 
* narrative container is visible.
* @arg {number} The narrative's workspace id
* @returns {Promise} The Promise value is ignored.
*/
async function openNarrative(workspaceId) {
    await browser.url(makeURL(`narrative/${workspaceId}`));
    const container = await $('#notebook-container');
    const timeout = 60000;
    await container.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for narrative to appear`
    });
}


module.exports = {
    login,
    makeURL,
    sendString,
    openNarrative
};