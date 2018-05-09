/* global module phantom casper*/
var fs = require('fs'),
    tokens = {},
    testConfigFile = 'test/casper/testConfig.json',
    testConfig = JSON.parse(fs.read(testConfigFile).trim()),
    jupyterPort = testConfig.jupyterPort;

// gotta munge the token file a bit to work with nodejs/ Casperjs, as opposed to Karma.
Object.keys(testConfig.users).forEach(function(user) {
    'use strict';
    var userInfo = testConfig.users[user];
    var token = fs.read(userInfo.tokenFile).trim();
    tokens[userInfo.id] = token;
});

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
    if (tokens[user]) {
        return tokens[user];
    }
    else {
        throw new Error('No auth token found for user "' + user + '"');
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
    if (!tokens[user]) {
        throw new Error('Unable to set auth cookie - user "' + user + '" not found');
    }
    phantom.addCookie({
        'name': 'kbase_session',
        'value': tokens[user],
        'domain': 'localhost',
        'path': '/'
    });
}

function buildNarrativeUrl(workspaceId, narrativeId) {
    'use strict';
    if (!workspaceId || !narrativeId) {
        throw new Error('Unable to build Narrative URL - need both workspace and narrative ids!');
    }
    return 'http://localhost:' + jupyterPort + '/narrative/ws.' + workspaceId + '.obj.' + narrativeId;
}

function getNarrativeUrl(configKey) {
    'use strict';
    if (!testConfig.widgets[configKey]) {
        throw new Error('Unable to build Narrative URL - unknown test config key "' + configKey + '"');
    }
    return 'http://localhost:' + jupyterPort + '/narrative/' + testConfig.widgets[configKey].narrativeId;
}

function serializeUpa(upa) {
    'use strict';
    if (typeof upa !== 'string') {
        // stringify the array version of an UPA, if that's what we have.
        if (Array.isArray(upa)) {
            upa = upa.join(';');
        }
        else {
            throw {error: 'Can only serialize UPA strings or Arrays of UPA paths'};
        }
    }
    return upa.replace(/^(\d+)\//, '[$1]/');
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
    getWidgetConfig: getWidgetConfig,
    getUserToken: getUserToken,
    setAuthCookie: setAuthCookie,
    getNarrativeUrl: getNarrativeUrl,
    buildNarrativeUrl: buildNarrativeUrl,
    addDataWidgetFromIcon: addDataWidgetFromIcon,
    serializeUpa: serializeUpa
};
