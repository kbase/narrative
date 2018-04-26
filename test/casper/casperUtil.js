/* global module phantom casper*/
var fs = require('fs'),
    users = {},
    tokenConfigFile = 'test/unit/testConfig.json',
    testConfigFile = 'test/casper/testConfig.json',
    tokenConfig = JSON.parse(fs.read(tokenConfigFile).trim()),
    userId = tokenConfig.token.user,
    tokenFile = tokenConfig.token.file,
    testConfig = JSON.parse(fs.read(testConfigFile).trim()),
    jupyterPort = testConfig.jupyterPort;

// gotta munge the token file a bit to work with nodejs/ Casperjs, as opposed to Karma.
tokenFile = tokenFile.substring(1);
var token = fs.read(tokenFile).trim();
users[userId] = token;

casper.options.waitTimeout = 30000;

/**
 * @method
 * @public
 * Returns the JSON configuration object for running the test on the given widget name.
 * If not present, throws an error so the tests should bomb out.
 */
function getWidgetConfig(widgetName) {
    'use strict';
    if (testConfig.widgets[widgetName]) {
        return testConfig.widgets[widgetName];
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
    'use strict';
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
    'use strict';
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

function getNarrativeUrl(configKey) {
    'use strict';
    if (!testConfig.widgets[configKey]) {
        throw new Error('Unable to build Narrative URL - unknown test config key "' + configKey + '"');
    }
    return 'http://localhost:' + jupyterPort + '/narrative/' + testConfig.widgets[configKey].narrativeId;
}

/**
 * @method
 * @public
 * Adds a data widget to the bottom of the Narrative (the last cell) by clicking the icon in the
 * Data panel. Really, this can be any selector relative to a Data panel card, but it should be a
 * unique sub-selector. That selector will have a .click() applied to it.
 */

function addDataWidgetFromIcon(selector) {
    'use strict';
    var cardSelector = '.narrative-side-panel-content > .kb-side-tab:first-child .kb-side-separator:first-child .narrative-card-row ' + selector;
    casper.evaluate(function(selector) {
        var numCells = Jupyter.notebook.get_cells().length;
        Jupyter.notebook.select(numCells-1);
        $(selector).click();
    }, cardSelector);
}

module.exports = {
    userId: userId,
    authToken: token,
    getWidgetConfig: getWidgetConfig,
    getUserToken: getUserToken,
    setAuthCookie: setAuthCookie,
    getNarrativeUrl: getNarrativeUrl,
    addDataWidgetFromIcon: addDataWidgetFromIcon
};
