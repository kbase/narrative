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

    const realnameElement = await $('[data-element="realname"]');
    const usernameElement = await $('[data-element="username"]');
    await browser.waitUntil(async () => {
        const text = await realnameElement.getText();
        return (text && text.length > 0);
    });
    const realname = await realnameElement.getText();
    const username = await usernameElement.getText();
    console.warn(`Signed in as user "${realname}" (${username})`);
    await loginButton.click();
    
    // Ensure narrative notebook has displayed
    // TODO: more interesting waitUntil loop to signal the 
    // failure reason (useful for debugging tests?)
    const container = await $('#notebook-container');
    await container.waitForDisplayed({
        timeout,
        timeoutMsg: `Timeout after waiting ${timeout}ms for narrative to appear`
    });
    return container;
}

function mergeObjects(listOfObjects) {
    const simpleObjectPrototype = Object.getPrototypeOf({});

    function isSimpleObject(obj) {
        if (typeof obj !== 'object') {
            return false;
        }
        return Object.getPrototypeOf(obj) === simpleObjectPrototype;
    }

    function merge(targetObj, sourceObj) {
        if (!isSimpleObject(targetObj)) {
            throw new Error(`Can only merge simple objects, target is a "${typeof targetObj}"`);
        } 
        
        // Copy target, so we don't stomp over original objects.
        // Note that the source object is not copied, since we don't care if
        // there is object sharing in the result, we just want to ensure that 
        // we don't overwrite properties of shared objects.
        targetObj = JSON.parse(JSON.stringify(targetObj));

        Object.keys(sourceObj).forEach(function (key) {
            if (isSimpleObject(targetObj[key]) && isSimpleObject(sourceObj[key])) {
                targetObj[key] = merge(targetObj[key], sourceObj[key]);
            } else {
                targetObj[key] = sourceObj[key];
            }
        });
        
        return targetObj;
    }

    const objectsToMerge = listOfObjects.map((obj, index) => {
        if (!isSimpleObject(obj)) {
            throw new Error(`Can only merge simple objects, object #${index} is a "${typeof obj}"`);
        } else {
            return JSON.parse(JSON.stringify(obj));
        }
    });
    let merged = objectsToMerge[0];
    for (let i = 1; i < objectsToMerge.length; i += 1) {
        merged = merge(merged, objectsToMerge[i]);
    }
    return merged;
}

function getCaseData(testData, caseLabel) {
    const env = browser.config.testParams.ENV;

    // Note, order is least specific to most specific, so that the more
    // specific can override the least.

    // Top level test cases provide defaults (non-env-specific) per-case
    // test data.
    const testCase = testData.cases[caseLabel];

    // Each env can establish defaults (e.g. narrative id)
    const envDefaults = testData[env].defaults;

    // Each test case is defined per environment as well, as the 
    // state of services will be different.
    const envTestCase = testData[env][caseLabel];

    return mergeObjects([testCase, envDefaults, envTestCase]);
}

module.exports = {
    login,
    makeURL,
    sendString,
    openNarrative,
    clickWhenReady,
    getCaseData
};