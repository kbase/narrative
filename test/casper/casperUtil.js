/* global module phantom */

var fs = require('fs'),
    users = {},
    tokenConfigFile = 'test/unit/testConfig.json',
    testConfigFile = 'test/casper/testConfig.json',
    tokenConfig = JSON.parse(fs.read(tokenConfigFile, 'utf8').trim()),
    userId = tokenConfig.token.user,
    tokenFile = tokenConfig.token.file,
    testConfig = JSON.parse(fs.read(testConfigFile, 'utf8').trim());

// gotta munge the token file a bit to work with nodejs/ Casperjs, as opposed to Karma.
tokenFile = tokenFile.substring(1);
var token = fs.read(tokenFile, 'utf8').trim();
users[userId] = token;

/**
 * @method
 * @public
 * Returns the JSON configuration object for running the test on the given widget name.
 * If not present, throws an error so the tests should bomb out.
 */
function getWidgetConfig(widgetName) {
    if (testConfig[widgetName]) {
        return testConfig[widgetName];
    }
    else {
        throw new Error('No configuration found for widget named "' + widgetName + '"');
    }
}

/**
 * @method
 * @public
 * Returns an active token for the given user id. If that's not possible, throws an error.
 * TODO: wire this up with mini-KBase so we can just always have it go. Need WS, etc., aligned
 * with Auth in test mode.
 */
function getUserToken(user) {
    if (users[user]) {
        return users[user];
    }
    else {
        throw new Error('No auth token found for user "' + userId + '"');
    }
}

/**
 * @method
 * @public
 * Sets an auth cookie (in kbase_session) using the given user's token, if available.
 * If not available, throws an error.
 *
 * Assumes that we're calling this from an instance where Phantomjs is available. (I.e. through
 * a casper.test block)
 */
function setAuthCookie(user) {
    if (!users[user]) {
        throw new Error('Unable to set auth cookie - user "' + userId + '" not found');
    }
    phantom.addCookie({
        'name': 'kbase_session',
        'value': token,
        'domain': 'localhost',
        'path': '/'
    });
}

module.exports = {
    userId: userId,
    authToken: token,
    getWidgetConfig: getWidgetConfig,
    getUserToken: getUserToken,
    setAuthCookie: setAuthCookie
};
