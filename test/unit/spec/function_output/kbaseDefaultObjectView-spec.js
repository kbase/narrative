/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'widgets/function_output/kbaseDefaultObjectView',
    'testUtil',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    KBaseDefaultObjectView,
    TestUtil,
    Runtime,
    Jupyter,
    Narrative
) => {
    'use strict';
    describe('Test the kbaseDefaultObjectView widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.getAuthToken = () => { return 'NotARealToken!' };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should load properly when no upas given', (done) => {
            TestUtil.pendingIfNoToken();
            let w = new KBaseDefaultObjectView($div);
            w.render()
                .then(() => {
                    expect($div.html()).toContain('No objects to display!');
                    done();
                });
        });

        it('Should load properly when not logged in', (done) => {
            if (TestUtil.getAuthToken()) {
                Jupyter.narrative.getAuthToken = () => { return null; }
            }
            let w = new KBaseDefaultObjectView($div);
            w.render()
                .then(() => {
                    expect($div.html()).toContain('Not logged in.');
                    done();
                });
        });

        it('Should properly load with a valid upa', (done) => {
            let ws = 1111,
                oid = 2222,
                ver = 3333,
                name = 'fake_test_object',
                objType = 'FakeModule.FakeType-7.7',
                saveDate = '2018-08-03T00:17:04+0000',
                userId = 'fakeUser',
                wsName = 'fakeWs',
                checksum = '12345',
                meta = {},
                size = 1234567,
                upa = String(ws) + '/' + String(oid) + '/' + String(ver);

            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{
                        infos: [[
                            oid,
                            name,
                            objType,
                            saveDate,
                            ver,
                            userId,
                            ws,
                            wsName,
                            checksum,
                            size,
                            meta
                        ]],
                        paths: [[upa]]
                    }]
                })
            });

            let w = new KBaseDefaultObjectView($div, {upas: {upas: [upa]}});
            w.render([upa])
                .then(() => {
                    expect($div.html()).toContain('fakeUser');
                    done();
                });

        });
    });
});
