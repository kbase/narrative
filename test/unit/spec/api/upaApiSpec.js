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
        var upaApi = new UpaApi(),
            serializeTestData = [{
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
            }, {
                upa: '31/31/31;31/31/31',
                serial: '[31]/31/31;31/31/31'
            }],
            serializeExternalTestData = [{
                upa: '5/1/2',
                serial: upaApi.externalTag + '5/1/2'
            }, {
                upa: '5/1/2;1/2/3',
                serial: upaApi.externalTag + '5/1/2;1/2/3'
            }, {
                upa: '5/5/5;1/1/1',
                serial: upaApi.externalTag + '5/5/5;1/1/1'
            }],
            badUpas = [
                '1/2',
                '1/2/3;4/5/',
                '1/2/a',
                '123/456/7/',
                '1/2/3;',
                'x/y/z',
                '1',
                'foo',
                'foo/bar',
                '1;2;3',
                'foo/bar;baz/frobozz',
                'myws/myobj/myver;otherws/otherobj/otherver',
                'myws/myobj/myver'
            ],
            badSerials = [
                '[1]/2',
                '[1]/2/3;4/5/',
                '[1]/2/a',
                '[123]/456/7/',
                '[1]/2/3;',
                '[x]/y/z',
                '[1]',
                '[foo]',
                '[foo]/bar',
                '[1];2;3',
                '[f]oo/bar;baz/frobozz',
                '[myws]/myobj/myver;otherws/otherobj/otherver',
                '[myws]/myobj/myver',
                '[1]2/23/4',
                '[1]2/3/4;5/6/7'
            ];

        beforeEach(function () {
            history.pushState(null, null, '/narrative/ws.31.obj.1');
        });

        it('Should properly serialize an UPA from this workspace', function () {
            serializeTestData.forEach(function(pair) {
                expect(upaApi.serialize(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should properly deserialize an UPA from this workspace', function () {
            serializeTestData.forEach(function(pair) {
                if (typeof pair.upa === 'string') {
                    expect(upaApi.deserialize(pair.serial)).toBe(pair.upa);
                }
            });
        });

        it('Should serialize an UPA from a different workspace', function () {
            serializeExternalTestData.forEach(function(pair) {
                expect(upaApi.serializeExternal(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should deserialize an UPA from a different workspace', function() {
            serializeExternalTestData.forEach(function(pair) {
                expect(upaApi.deserialize(pair.serial)).toBe(pair.upa);
            });
        });

        it('Should fail to serialize a bad UPA', function () {
            badUpas.forEach(function(badUpa) {
                try {
                    upaApi.serialize(badUpa);
                    fail('Should have thrown an error here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toEqual('"' + badUpa + '" is not a valid UPA. It may already have been serialized.');
                }
            });
        });

        it('Should fail to deserialize a bad UPA', function () {
            badSerials.forEach(function(badSerial) {
                try {
                    upaApi.deserialize(badSerial);
                    fail('Should have thrown an error here!');
                } catch(error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toMatch(/Deserialized UPA: .+ is invalid!$/);
                }
            });
        });

        it('Should fail to deserialize an UPA that is not a string', function () {
            var badTypes = [
                ['123/4/5', '6/7/8'],
                {'123': '456'},
                null
            ];
            badTypes.forEach(function(badType) {
                try {
                    upaApi.deserialize(badType);
                    fail('Should have thrown an error here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toEqual('Can only deserialize UPAs from strings.');
                }
            });
        });

        it('Should fail if the workspace id cannot be found.', function () {
            history.pushState(null, null, '/narrative/');
            try {
                upaApi.deserialize('[1]/2/3');
                fail('Should have failed here!');
            } catch (error) {
                expect(error).not.toBeNull();
                expect(error.error).toEqual('Currently loaded workspace is unknown! Unable to deserialize UPA.');
            }
        });

        it('Should fail to serialize an object', function () {
            try {
                upaApi.serialize({foo: 'bar'});
                fail('Should have failed here!');
            } catch (error) {
                expect(error).not.toBeNull();
                expect(error.error).toEqual('Can only serialize UPA strings or Arrays of UPA paths');
            }
        });
    });
});
