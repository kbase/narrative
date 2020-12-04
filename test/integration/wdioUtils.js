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
    // await browser.waitUntil(async () => {
    //     const loadingText = await loadingBlocker.getText();
    //     loadingText.getText().includes('Connecting to KBase services...');
    // });
    console.log('have loading cover');

    await loadingBlocker.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for loading blocker to disappear`,
        reverse: true
    });
    console.log('it has disappeared');

    const $debug =  await $('#__EAP_DEBUG__');
    const debugText = await $debug.getAttribute('data-debug-value');
    console.log('DEBUG:', debugText);
    

    // Ensure logged in
    const loginButton = await $('#signin-button > div > button');
    await loginButton.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for login button to appear`
    }); 

    // DEBUG vvv
    const dialog = await $('.modal.fade.in[role="dialog"]');
    await dialog.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for loading dialog to appear`
    });
    const dialogTitle = await dialog.$('.modal-title');
    await browser.waitUntil(async () => {
        const text = await dialogTitle.getText();
        return (text && text.length > 0);
    });
    const dialogText = await dialogTitle.getText();
    console.log('DIALOG', dialogText);

    await browser.pause(1000);

    const dialogBody = await dialog.$('.modal-body');
    await browser.waitUntil(async () => {
        const text = await dialogBody.getText();
        return (text && text.length > 0);
    });
    const dialogBodyText = await dialogBody.getText();
    console.log('DIALOG', dialogBodyText);

    // DEBUG ^^

    // await browser.waittUntil(async () => {
    //     const clickable = await loginButton.isClickable();
    //     console.log('is it?', clickable);
    //     return clickable;
    // });
    console.log('DEBUG: skipping clickable test');
    await loginButton.click();
    console.log('DEBUG: clicked');
    const userLabelElement = await $('[data-element="user-label"]');
    await browser.waitUntil(async () => {
        const text = await userLabelElement.getText();
        return (text && text.length > 0);
    });
    const text = await userLabelElement.getText();
    console.log(`Logged in with user ${text}`);
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

module.exports = {
    login,
    makeURL,
    sendString,
    openNarrative
};