/* global module casper */

var $ = require('../../kbase-extension/static/ext_components/jquery/dist/jquery.min'),
    TestUtil = require('./casperUtil'),
    Workspace = require('../util/miniWorkspace');
    // KBaseClient = require('../util/miniKBaseClient');

function runSharingTest(params) {
    var config = TestUtil.getWidgetConfig(params.widget);
    var token = TestUtil.authToken;
    var ws = new Workspace({
        token: token,
        url: 'https://ci.kbase.us/services/ws'
    });
    return ws.list_objects({'ids': [25022]})
        .then(function(results) {
            casper.echo(JSON.stringify(results));
        })
        .catch(function(err) {
            casper.echo(err);
            casper.then(function() {
                this.exit();
            });
        });

    // var narrativeInfo = createNewNarrative(config.user);
    // insertNarrativeData(narrativeId, params.user, params.data);
    // addViewerWidgetTest(narrativeId, params.user, true); // true === save the narrative
    // shareNarrative(narrativeId, params.user, params.sharedUser);
    // openNarrativeTest(narrativeId, params.sharedUser);  // something here for the widget cell to investigate
    // var copiedNarrativeId = copyNarrative(narrativeId, params.sharedUser);
    // unshareNarrative(narrativeId, params.user, params.sharedUser);
    // openNarrativeTest(copiedNarrativeId, params.sharedUser);
}

/**
 * Makes a new Narrative for a given user id.
 * Need that user id's token to make the NarrativeService client.
 */
function createNewNarrative(user) {
    return narrativeId;
}

/**
 * Copies a piece of data (given an UPA) into the given workspace.
 * Now it should show up in that Narrative.
 */
function copyWorkspaceData(workspaceId, user, dataUpa) {
    return dataUpa;
}

function shareNarrative(workspaceId, ownerUser, shareUser) {

}


/**
 * The workhorse here, that uses CasperJS to do things.
 * This:
 * 1. opens a narrative.
 * 2. selects the last cell.
 * 3. clicks the given data object.
 * 4. validates the generated cell (code, metadata, etc).
 * 5. validates the cell's widget.
 */
function viewerWidgetTest() {

}

module.exports = {
    runSharingTest: runSharingTest
};
