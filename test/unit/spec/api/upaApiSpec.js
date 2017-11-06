/*global define*/
/*global describe, it, expect fail*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'api/upa'
], function(
    UpaApi
) {
    'use strict';
    describe('Test the UPA API', function() {

        var mainWorkspace = '31',
            upaApi,
            testData = [{
                upa: '31/2/3',
                serial: '[31]/2/3'
            }, {
                upa: '31/2/3;4/5/6',
                serial: '[31]/2/3;4/5/6'
            }, {
                upa: '31/2/3;4/5/6;7/8/9',
                serial: '[31]/2/3;4/5/6;7/8/9'
            }, {
                upa: ['31/2/3', '4/5/6', '7/8/9'],
                serial: '[31]/2/3;4/5/6;7/8/9'
            }];

        beforeEach(function() {
            upaApi = new UpaApi(mainWorkspace);
        });

        it('Should properly serialize an UPA from this workspace', function () {
            testData.forEach(function(pair) {
                expect(upaApi.serialize(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should properly deserialize an UPA from this workspace', function () {
            testData.forEach(function(pair) {
                if (typeof pair.upa === 'string') {
                    expect(upaApi.deserialize(pair.serial)).toBe(pair.upa);
                }
            });
        });

        it('Should serialize an UPA from a different workspace', function () {
            var upa = '1/2/3';
            expect(upaApi.serialize(upa)).toBe(upaApi.externalTag + upa);
        });

        it('Should deserialize an UPA from a different workspace', function() {
            var upa = '1/2/3';
            var externalUpa = upaApi.externalTag + upa;
            expect(upaApi.deserialize(externalUpa)).toBe(upa);
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
});
