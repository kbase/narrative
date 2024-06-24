define([
    'jquery',
    'kbaseNarrativeDownloadPanel',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    'narrativeConfig'
], ($, kbaseNarrativeDownloadPanel, Jupyter, Mocks, TestUtil, Config) => {
    'use strict';

    fdescribe('The kbaseNarrativeDownloadPanel widget', () => {
        let $div = null;
        const ws = 1111,
            oid = 2222,
            ver = 3333,
            name = 'fake_test_object',
            objType = 'FakeModule.FakeType',
            saveDate = '2018-08-03T00:17:04+0000',
            userId = 'fakeUser',
            wsName = 'fakeWs',
            checksum = '12345',
            meta = {},
            size = 1234567,
            upa = `${ws}/${oid}/${ver}`;

        beforeEach(() => {
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
            };
            $div = $('<div>');
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            $div.remove();
            TestUtil.clearRuntime();
        });

        const exportCases = [
            ['single method', { FAKE: 'fake_method' }],
            ['a staging method', { FAKE: 'fake_method', STAGING: 'fake_staging_method' }],
            ['no downloaders', {}]
        ];
        exportCases.forEach((exportCase) => {
            it(`Should properly load with ${exportCase[0]}`, async () => {
                const exporters = exportCase[1];
                await new kbaseNarrativeDownloadPanel($div, {
                    token: null,
                    type: objType,
                    objId: oid,
                    ref: upa,
                    objName: name,
                    downloadSpecCache: {
                        lastUpdateTime: 100,
                        types: {
                            [objType]: { export_functions: exporters },
                        },
                    },
                });
                const exportBtns = $div.find('.kb-data-list-btn');
                const names = Object.keys(exporters);
                expect(exportBtns.length).toEqual(1 + names.length);
                [...names, 'JSON'].forEach((exporterName, idx) => {
                    expect(exportBtns[idx].textContent).toContain(exporterName);
                });
                expect($div.find('.kb-data-list-cancel-btn').html()).toContain('Cancel');
            });
        });

        it('Should load after fetching exporter info from NMS', async () => {
            jasmine.Ajax.stubRequest(
                Config.url('narrative_method_store'),
                /NarrativeMethodStore.list_categories/
            ).andReturn({
                status: 200,
                statusText: 'HTTP/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    id: '12345',
                    result: [{}, {}, {}, {
                        'FakeModule.FakeType': {
                            export_functions: {
                                SOME_FORMAT: 'export_as_some_format'
                            }
                        }
                    }]
                })
            });

            await new kbaseNarrativeDownloadPanel($div, {
                token: null,
                type: objType,
                objId: oid,
                ref: upa,
                objName: name,
                downloadSpecCache: {}
            });
            const exportBtns = $div.find('.kb-data-list-btn');
            expect(exportBtns.length).toEqual(2);
            ['SOME_FORMAT', 'JSON'].forEach((exporterName, idx) => {
                expect(exportBtns[idx].textContent).toContain(exporterName);
            });
            expect($div.find('.kb-data-list-cancel-btn').html()).toContain('Cancel');
        });
    });
});
