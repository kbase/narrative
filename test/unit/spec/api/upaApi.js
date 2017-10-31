/*global define*/
/*global describe, it, expect fail*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'api/workspaceObjectApi',
    'narrativeConfig',
    'testUtil'
], function(
    UpaApi,
    Config,
    TestUtil
) {
    'use strict';
    describe('Test the Workspace object API', function() {

        var mainWorkspace = '31',
            upaApi,
            testData = [{
                upa: '31/2/3',
                serial: '2/3'
            }, {
                upa: '31/2/3;4/5/6',
                serial: '2/3;4/5/6'
            }, {
                upa: '31/2/3;4/5/6;7/8/9',
                serial: '2/3;4/5/6;7/8/9'
            }, {
                upa: ['31/2/3', '4/5/6', '7/8/9'],
                serial: '2/3;4/5/6;7/8/9'
            }];

        beforeEach(function() {
            if (TestUtil.getAuthToken()) {
                upaApi = new UpaApi(mainWorkspace, {token: TestUtil.getAuthToken()});
            }
        });

        it('Should properly serialize an UPA from this workspace', function () {
            TestUtil.pendingIfNoToken();

            testData.forEach(function(pair) {
                expect(upaApi.serialize(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should properly deserialize an UPA from this workspace', function () {
            TestUtil.pendingIfNoToken();

            testData.forEach(function(pair) {
                if (typeof pair.upa === 'string') {
                    expect(upaApi.deserialize(pair.serial)).toBe(upa);
                }
            });
        });

        it('Should serialize an UPA from a different workspace', function () {
            TestUtil.pendingIfNoToken();

            var upa = '1/2/3';
            expect(upaApi.serialize(upa)).toBe(upaApi.externalTag + 'upa');
        });

        it('Should deserialize an UPA from a different workspace', function() {
            TestUtil.pendingIfNoToken();

            var externalUpa = upaApi.externalTag + '1/2/3';
            expect(upaApi.deserialize(externalUpa)).toBe('1/2/3');
        });

        it('Should retrieve object info from an UPA (headless or not)', function () {
            TestUtil.pendingIfNoToken();

            // TODO
        });

        it('Should fail to serialize a bad UPA', function () {
            try {
                upaApi.serialize('not_an_upa');
                fail('Should have thrown an error here!');
            } catch (error) {
                expect(error).not.toBeNull();
            }
        });

        it('Should fail to deserialize a bad UPA', function () {
            try {
                upaApi.deserialize('not_a_serial_upa');
                fail('Should have thrown an error here!');
            } catch(error) {
                expect(error).not.toBeNull();
            }
        });
});
