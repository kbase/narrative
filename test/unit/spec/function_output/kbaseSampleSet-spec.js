/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseSampleSetView',
    'base/js/namespace',
    'kbaseNarrative',
    'narrativeConfig'
], (
    $,
    Widget,
    Jupyter,
    Narrative,
    Config
) => {
    'use strict';
    describe('Test the kbaseSampleSet viewer widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.getAuthToken = () => { return 'NotARealToken!'; };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should properly render SampleSet', (done) => {
            let SampleSet = {
                'samples': [
                    {'id': 'madeup', 'name': 'sample1'},
                    {'id': 'idtwo', 'name': 'sample2'}
                ],
                'description': 'This is a test sample set.'
            };
            let obj_info = [35,'name','','',1,'',45700];
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: {},
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{
                        data: [
                            {
                                data: SampleSet,
                                info: obj_info
                            }
                        ]
                    }]
                })
            });
            let fakeServiceUrl = 'https://ci.kbase.us/services/fake_url';
            var SetAPIInfo = {
                version: '1.1',
                id: '12345',
                result: [{
                    git_commit_hash: 'foo',
                    hash: 'bar',
                    health: 'healthy',
                    module_name: 'SetAPI',
                    url: fakeServiceUrl
                }]
            };
            jasmine.Ajax.stubRequest(Config.url('service_wizard')).andReturn({
                status: 200,
                statusText: 'HTTP/1/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(SetAPIInfo),
                response: JSON.stringify(SetAPIInfo),
            });
            jasmine.Ajax.stubRequest(fakeServiceUrl).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: {},
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{
                        'num_found': 2,
                        'start': 0,
                        'query': {
                            'method': 'search_objects',
                            'params': {
                                'from': 0,
                                'size': 10,
                                'sort': [
                                    {
                                        'name': {
                                            'order': 'asc'
                                        }
                                    }
                                ]
                            },
                            'jsonrpc': '2.0',
                            'id': 'someId'
                        },
                        'samples': [
                            {
                                'sample_version': 1,
                                'name': [
                                    'sample1'
                                ],
                                'kbase_sample_id': 'madeup'
                            },
                            {
                                'sample_version': 1,
                                'name': [
                                    'sample2'
                                ],
                                'some_field_header': ['some field value'],
                                'kbase_sample_id': 'idtwo'
                            },
                        ]
                    }]
                })
            });
            new Widget($div, {upas: {id: 'fake'}});
            setTimeout(() => {
                [
                    'Description',
                    'KBase Object Name',
                    'This is a test sample set.'
                ].forEach((str) => {
                    expect($div.html()).toContain(str);
                });
                $div.find('a[data-tab="Samples"]').click();
                setTimeout(() => {
                    [
                        'Sample ID',
                        'Sample Name',
                        'madeup',
                        'idtwo',
                        'some field header',
                        'some field value'
                    ].forEach((str) => {
                        expect($div.html()).toContain(str);
                    });
                    done();
                }, 50);
            }, 50);

        });
    });
});
