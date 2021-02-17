/*jslint white: true*/
define([
    'jquery',
    'kbaseSampleSetView',
    'base/js/namespace',
    'narrativeConfig'
], (
    $,
    Widget,
    Jupyter,
    Config
) => {
    'use strict';
    describe('Test the kbaseSampleSet viewer widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            Jupyter.narrative = {
                getAuthToken: () => 'NotARealToken!'
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
            Jupyter.narrative = null;
        });

        it('Should properly render SampleSet', (done) => {
            let SampleSet = {
                'samples': [
                    {'id': 'madeup', 'name': 'sample1'},
                    {'id': 'idtwo', 'name': 'sample2'}
                ],
                'description': 'This is a test sample set.'
            };
            let obj_info = [35,'name',',',1,'',45700];
            jasmine.Ajax.stubRequest(Config.url('workspace')).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
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
            const fakeServiceUrl = "https://ci.kbase.us/services/fake_url";
            var sampleServiceInfo = {
                version: '1.1',
                id: '12345',
                result: [{
                    git_commit_hash: 'foo',
                    hash: 'bar',
                    health: 'healthy',
                    module_name: 'SampleService',
                    url: fakeServiceUrl
                }]
            };
            jasmine.Ajax.stubRequest(Config.url('service_wizard')).andReturn({
                status: 200,
                statusText: 'HTTP/1/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(sampleServiceInfo),
                response: JSON.stringify(sampleServiceInfo),
            });
            jasmine.Ajax.stubRequest(fakeServiceUrl).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{
                        sample_id: 'id',
                        user: 'user',
                        node_tree: [{
                            id: 'identificazione',
                            parent: null,
                            type: 'sample',
                            meta_controlled: {
                                'controlled1': {'value': 1, 'units': 'bars'},
                                'controlled2': {'value': 'two', 'units': 'units'},
                                'controlled3': {'value': '3'}
                            },
                            meta_user: {
                                'user1': {'value': 6, 'units': 'units'},
                                'user2': {'value': 'foo'},
                                'user3': {'value': 'bar'}
                            }
                        }],
                        name: 'sample_name',
                        save_date: 'a time',
                        version: 1
                    }]
                })
            });
            let w = new Widget($div, {upas: {id: 'fake'}});
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
                        'two units'
                    ].forEach((str) => {
                        expect($div.html()).toContain(str);
                    });
                    done();
                }, 1000);
            }, 1000);

        });
    });
});
