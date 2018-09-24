/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeStagingDataTab',
    'base/js/namespace'
], function(
    $,
    StagingDataTab,
    Jupyter
) {
    'use strict';
    describe('Test the kbaseNarrativeStagingDataTab widget', () => {
        let $dummyNode = $('<div>'),
            stagingWidget,
            fakeUser = 'notAUser';
        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest("https://ci.kbase.us/services/auth/api/V2/me").andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    user: fakeUser,
                    idents: [{
                        provider: 'Google',
                        provusername: 'notAUser@google.com'
                    }, {
                        provider: 'Globus',
                        provusername: 'notauser@globusid.org'
                    }]
                })
            });
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/.*/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([
                    {
                        name: "test_folder",
                        path: fakeUser + "/test_folder",
                        mtime: 1532738637499,
                        size: 34,
                        isFolder: true
                    }, {
                        name: "file_list.txt",
                        path: fakeUser + "/test_folder/file_list.txt",
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload'
                    }
                ])
            });
            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => { return 'fakeToken'; }
            };
            stagingWidget = new StagingDataTab($dummyNode);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $dummyNode.remove();
        });

        it('can load properly', (done) => {
            stagingWidget.render()
                .then(() => {
                    expect(stagingWidget).not.toBeNull();
                    done();
                });
        });

        it('can update its path properly', (done) => {
            stagingWidget.render()
                .then(() => {
                    var newPath = 'a_new_path';
                    stagingWidget.updatePath(newPath);
                    expect(stagingWidget.path).toEqual(newPath);
                    done();
                });
        });
    });
});
