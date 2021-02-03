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

async function clickWhenReady(el) {
    await browser.waitUntil(async () => {
        return await el.isClickable();
    });
    await el.click();
}

/**
* Navigates the wdio browser to a workspace as given by its id, and waits until the 
* narrative container is visible.
* @arg {number} The narrative's workspace id
* @returns {Promise} The Promise value is ignored.
*/
async function openNarrative(workspaceId) {
    const timeout = 60000;

    // Go to the narrative!
    await browser.url(makeURL(`narrative/${workspaceId}`));

    // should experience loading blocker for a few seconds.
    const loadingBlocker = await $('#kb-loading-blocker');
    await loadingBlocker.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for loading blocker to appear`
    }); 

    // And then the loading blocker should disappear!
    await loadingBlocker.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for loading blocker to disappear`,
        reverse: true
    });

    // Ensure logged in
    const loginButton = await $('#signin-button > div > button');
    await loginButton.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for login button to appear`
    }); 

    await clickWhenReady(loginButton);

    const userLabelElement = await $('[data-element="user-label"]');
    await browser.waitUntil(async () => {
        const userLabelText = await userLabelElement.getText();
        return (userLabelText && userLabelText.length > 0);
    });
    const text = await userLabelElement.getText();
    console.warn(`Logged in as user ${text}`);
    await loginButton.click();
    
    // Ensure narrative notebook has displayed
    // TODO: more interesting waitUntil loop to signal the 
    // failure reason (useful for debugging tests?)
    const container = await $('#notebook-container');
    await container.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for narrative to appear`
    });
}

async function waitForClass(el, className) {
    return  browser.waitUntil(async () => {
        const elClass = await el.getAttribute('class');
        return elClass.split(' ').includes(className);
    });
}

module.exports = {
    login,
    makeURL,
    sendString,
    openNarrative,
    clickWhenReady,
    waitForClass
};