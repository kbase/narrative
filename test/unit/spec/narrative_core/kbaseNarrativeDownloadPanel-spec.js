define(['jquery', 'kbaseNarrativeDownloadPanel', 'base/js/namespace', 'narrativeMocks', 'testUtil'], (
    $,
    kbaseNarrativeDownloadPanel,
    Jupyter,
    Mocks,
    TestUtil
) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeDownloadPanel widget', () => {
        let $div = null;
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
        });

        it('Should properly load with a valid upa', () => {
            const ws = 1111,
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
                    result: [
                        {
                            infos: [
                                [
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
                                    meta,
                                ],
                            ],
                            paths: [[upa]],
                        },
                    ],
                }),
            });

            new kbaseNarrativeDownloadPanel($div, {
                token: null,
                type: objType,
                objId: oid,
                ref: upa,
                objName: name,
                downloadSpecCache: {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: { export_functions: { FAKE: 'fake_method' } },
                    },
                },
            });
            expect($div.html()).toContain('JSON');
            expect($div.html()).toContain('FAKE');
        });

        it('Should load and register a Staging app button', () => {
            const ws = 1111,
                oid = 2222,
                ver = 3333,
                name = 'fake_test_object',
                objType = 'KBaseGenomes.Genome',
                upa = String(ws) + '/' + String(oid) + '/' + String(ver);

            new kbaseNarrativeDownloadPanel($div, {
                token: null,
                type: objType,
                objName: name,
                objId: oid,
                ref: upa,
                downloadSpecCache: {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: {
                            export_functions: {
                                FAKE: 'fake_method',
                                STAGING: 'staging_method',
                            },
                        },
                    },
                },
            });

            expect($div.html()).toContain('STAGING');
        });
    });
});
