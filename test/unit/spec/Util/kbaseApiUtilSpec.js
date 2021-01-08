define([
    'util/kbaseApiUtil',
    'narrativeConfig',
    'base/js/namespace'
], (APIUtil, Config, Jupyter) => {
    'use strict';

    /**
     * Should be called by a test, after jasmine.Ajax.install()
     *
     * This is ultra uber simple. We're not testing what we do with the
     * properly structured app specs in this module, only that we actually return something,
     * so this just mocks app specs with a real id and a made up parameter, and app infos
     * with a real id.
     * @param {Array} appIds
     */
    function mockNMSCalls(appIds) {
        jasmine.Ajax.stubRequest(
            Config.url('narrative_method_store'),
            /get_method_full_info/
        ).andReturn({
            status: 200,
            statusText: 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify({
                version: '1.1',
                result: [ appIds.map((appId) => ({ id: appId })) ]
            })
        });
        jasmine.Ajax.stubRequest(
            Config.url('narrative_method_store'),
            /get_method_spec/
        ).andReturn({
            status: 200,
            statusText: 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify({
                version: '1.1',
                result: [
                    appIds.map((appId) => ({
                        info: {
                            id: appId
                        },
                        parameters: []
                    }))
                ]
            })
        });
    }

    describe('test the API util module', () => {
        // parseWorkspaceType - valid workspace type check
        it('Should parse a valid workspace type', () => {
            const type = 'KBaseNarrative.Narrative-1.0',
                output = {
                    module: 'KBaseNarrative',
                    type: 'Narrative',
                    version: '1.0',
                    majorVersion: '1',
                    minorVersion: '0'
                };
            expect(APIUtil.parseWorkspaceType(type)).toEqual(output);
        });

        // parseWorkspaceType - ensure invalid types fail
        const invalidTypes = [
            'KBaseNarrative.1.0', '.Narrative-1.0', '_&^%$.Narrative-1.0', '', undefined, null
        ];
        invalidTypes.forEach((badType) => {
            it(`parseWorkspaceType should fail for bad type "${badType}"`, () => {
                expect(APIUtil.parseWorkspaceType(badType)).toBeNull();
            });
        });

        // checkObjectRef - ensure valid refs work
        const validObjRefs = [
            '1/2/3',
            '1/2',
            '1/2/3;4/5/6',
            '1/2/3;4/5/6;7/8/9'
        ];
        validObjRefs.forEach((ref) => {
            it(`checkObjectRef should return true for valid object ref "${ref}"`, () => {
                expect(APIUtil.checkObjectRef(ref)).toBeTrue();
            });
        });

        // checkObjectRef - ensure invalid refs don't work
        const invalidObjRefs = [
            'notARef',
            '',
            null,
            undefined,
            '+',
            '1/',
            '1/2/',
            '1/2/3/',
            '1/2/3/4',
            '1/2/3;',
            '1/2/3;4/5/6;',
            '1/2;4/5/6'
        ];
        invalidObjRefs.forEach((badRef) => {
            it(`checkObjectRef should return false for bad ref "${badRef}"`, () => {
                expect(APIUtil.checkObjectRef(badRef)).toBeFalse();
            });
        });

        it('getAppVersionTag should return the release tag by default', () => {
            Jupyter.narrative = {};
            expect(APIUtil.getAppVersionTag()).toBe('release');
        });

        it('getAppVersionTag should return the actual value when the app panel is available', () => {
            const testTag = 'dev';
            Jupyter.narrative = {
                sidePanel: {
                    $methodsWidget: {
                        currentTag: testTag
                    }
                }
            };
            expect(APIUtil.getAppVersionTag()).toBe(testTag);
        });

        it('getAppSpec should return an app spec', async () => {
            const appId = 'SomeModule/someApp';
            jasmine.Ajax.install();
            mockNMSCalls([appId]);
            const appSpec = await APIUtil.getAppSpec(appId, 'release');
            expect(appSpec.info.id).toBe(appId);
            jasmine.Ajax.uninstall();
        });

        it('getAppSpec should return an app spec with the default release tag', async () => {
            const appId = 'SomeModule/someApp';
            jasmine.Ajax.install();
            mockNMSCalls([appId]);
            const appSpec = await APIUtil.getAppSpec(appId);
            expect(appSpec.info.id).toBe(appId);
            jasmine.Ajax.uninstall();
        });

        it('getAppSpecs should fetch and return app specs', async () => {
            jasmine.Ajax.install();
            const appIds = ['app1', 'app2'];
            mockNMSCalls(appIds);
            const appSpecs = await APIUtil.getAppSpecs(appIds);
            expect(appSpecs.length).toBe(2);
            appIds.forEach((appId, idx) => {
                expect(appSpecs[idx].info.id).toBe(appId);
            });
            jasmine.Ajax.uninstall();
        });
    });
});
