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
            let w = new KBaseDefaultObjectView($div);
            w.render()
                .then(() => {
                    expect($div.html()).toContain('No objects to display!');
                    done();
                });
        });

        it('Should load properly when not logged in', (done) => {
            Jupyter.narrative.getAuthToken = () => { return null; }
            let w = new KBaseDefaultObjectView($div);
            w.render()
                .then(() => {
                    expect($div.html()).toContain('Not logged in.');
                    done();
                });
        });

        it('Should properly load with a valid upa without metadata', (done) => {
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
                    // simple string matching
                    [
                        'Overview',
                        'Metadata',
                        'Objects of this type don\'t have a viewer associated with them. Showing default information.',
                        'No metadata found for this object'
                    ].forEach((str) => {
                        expect($div.html()).toContain(str);
                    });
                    // more complex structure matching
                    let tabs = $div.find('.tabbable');
                    expect(tabs).not.toBeNull();
                    let tabsContent = $div.find('.tab-pane');
                    expect(tabsContent.length).toEqual(2);
                    [
                        upa,
                        name,
                        userId,
                        size.toLocaleString(),
                        'Explore data landing page',
                        'View data provenance and relationships',
                        objType,
                        'module info',
                        'type spec'
                    ].forEach((str) => {
                        expect($(tabsContent[0]).html()).toContain(str);
                    });
                    expect($(tabsContent[1]).html()).toContain('No metadata found for this object.');
                    expect($(tabsContent[1]).html()).not.toContain('<table>');
                    done();
                });
        });

        it('Should properly load with a valid upa with metadata', (done) => {
            let ws = 1111,
                oid = 2222,
                ver = 3333,
                name = 'fake_test_object',
                objType = 'FakeModule.FakeType-7.7',
                saveDate = '2018-08-03T00:17:04+0000',
                userId = 'fakeUser',
                wsName = 'fakeWs',
                checksum = '12345',
                meta = {
                    'key1': 'value1',
                    'key2': 'value2'
                },
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
                    // simple string matching
                    [
                        'Overview',
                        'Metadata',
                        'Objects of this type don\'t have a viewer associated with them. Showing default information.'
                    ].forEach((str) => {
                        expect($div.html()).toContain(str);
                    });
                    // more complex structure matching
                    let tabs = $div.find('.tabbable');
                    expect(tabs).not.toBeNull();
                    let tabsContent = $div.find('.tab-pane');
                    expect(tabsContent.length).toEqual(2);
                    [
                        upa,
                        name,
                        userId,
                        size.toLocaleString(),
                        'Explore data landing page',
                        'View data provenance and relationships',
                        objType,
                        'module info',
                        'type spec'
                    ].forEach((str) => {
                        expect($(tabsContent[0]).html()).toContain(str);
                    });
                    expect($(tabsContent[1]).html()).not.toContain('No metadata found for this object.');
                    expect($(tabsContent[1]).html()).toContain('table');
                    Object.keys(meta).forEach((key) => {
                        expect($(tabsContent[1]).html()).toContain(key);
                        expect($(tabsContent[1]).html()).toContain(meta[key]);
                    });
                    done();
                });
        });

        it('Should fail to load with an error message if there\'s a problem', (done) => {
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 500,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    error: 'ERROR! OMG!'
                })
            });

            let w = new KBaseDefaultObjectView($div, {upas: {upas: ['nope']}});
            w.render(['nope'])
                .then(() => {
                    expect($div.html()).toContain('Unable to retrieve object information');
                    expect($div.find('.alert.alert-danger').length).toEqual(1);
                    done();
                });
        });
    });
});
