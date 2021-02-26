define(['api/upa', 'narrativeConfig'], (UpaApi, Config) => {
    'use strict';
    describe('Test the UPA API', () => {
        const upaApi = new UpaApi(),
            serializeTestData = [
                {
                    upa: '31/2/3',
                    serial: '[31]/2/3',
                },
                {
                    upa: '31/2/3;4/5/6',
                    serial: '[31]/2/3;4/5/6',
                },
                {
                    upa: '31/2/3;4/5/6;7/8/9',
                    serial: '[31]/2/3;4/5/6;7/8/9',
                },
                {
                    upa: ['31/2/3', '4/5/6', '7/8/9'],
                    serial: '[31]/2/3;4/5/6;7/8/9',
                },
                {
                    upa: '31/31/31;31/31/31',
                    serial: '[31]/31/31;31/31/31',
                },
            ],
            serializeExternalTestData = [
                {
                    upa: '5/1/2',
                    serial: upaApi.externalTag + '5/1/2',
                },
                {
                    upa: '5/1/2;1/2/3',
                    serial: upaApi.externalTag + '5/1/2;1/2/3',
                },
                {
                    upa: '5/5/5;1/1/1',
                    serial: upaApi.externalTag + '5/5/5;1/1/1',
                },
            ],
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
                'myws/myobj/myver',
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
                '[1]2/3/4;5/6/7',
            ],
            upaStruct = {
                foo: '1/2/3',
                bar: ['4/5/6', '7/8/9'],
                baz: {
                    a: '1/2/3',
                    b: '1/2/3',
                },
            },
            upaStructSerial = {
                foo: '[1]/2/3',
                bar: ['[4]/5/6', '[7]/8/9'],
                baz: {
                    a: '[1]/2/3',
                    b: '[1]/2/3',
                },
            };

        beforeEach(() => {
            Config.config.workspaceId = 31;
        });

        it('Should properly serialize an UPA from this workspace', () => {
            serializeTestData.forEach((pair) => {
                expect(upaApi.serialize(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should properly deserialize an UPA from this workspace', () => {
            serializeTestData.forEach((pair) => {
                if (typeof pair.upa === 'string') {
                    expect(upaApi.deserialize(pair.serial)).toBe(pair.upa);
                }
            });
        });

        it('Should serialize an UPA from a different workspace', () => {
            serializeExternalTestData.forEach((pair) => {
                expect(upaApi.serializeExternal(pair.upa)).toBe(pair.serial);
            });
        });

        it('Should deserialize an UPA from a different workspace', () => {
            serializeExternalTestData.forEach((pair) => {
                expect(upaApi.deserialize(pair.serial)).toBe(pair.upa);
            });
        });

        it('Should fail to serialize a bad UPA', () => {
            badUpas.forEach((badUpa) => {
                try {
                    upaApi.serialize(badUpa);
                    fail('Should have thrown an error here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toEqual(
                        '"' + badUpa + '" is not a valid UPA. It may already have been serialized.'
                    );
                }
            });
        });

        it('Should fail to deserialize a bad UPA', () => {
            badSerials.forEach((badSerial) => {
                try {
                    upaApi.deserialize(badSerial);
                    fail('Should have thrown an error here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toMatch(/Deserialized UPA: .+ is invalid!$/);
                }
            });
        });

        it('Should fail to deserialize an UPA that is not a string', () => {
            const badTypes = [['123/4/5', '6/7/8'], { 123: '456' }, null];
            badTypes.forEach((badType) => {
                try {
                    upaApi.deserialize(badType);
                    fail('Should have thrown an error here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toEqual('Can only deserialize UPAs from strings.');
                }
            });
        });

        it('Should fail if the workspace id cannot be found.', () => {
            history.pushState(null, null, '/narrative/');
            Config.config.workspaceId = undefined;
            try {
                upaApi.deserialize('[1]/2/3');
                fail('Should have failed here!');
            } catch (error) {
                expect(error).not.toBeNull();
                expect(error.error).toEqual(
                    'Currently loaded workspace is unknown! Unable to deserialize UPA.'
                );
            }
        });

        it('Should fail to serialize an object', () => {
            try {
                upaApi.serialize({ foo: 'bar' });
                fail('Should have failed here!');
            } catch (error) {
                expect(error).not.toBeNull();
                expect(error.error).toEqual(
                    'Can only serialize UPA strings or Arrays of UPA paths'
                );
            }
        });

        it('Should serialize all elements of a structure', () => {
            const serialized = upaApi.serializeAll(upaStruct);
            Object.keys(serialized).forEach((key) => {
                if (typeof upaStructSerial[key] === 'string') {
                    expect(serialized[key]).toEqual(upaStructSerial[key]);
                } else if (Array.isArray(upaStructSerial[key])) {
                    upaStructSerial[key].forEach((serialUpa) => {
                        expect(serialized[key].indexOf(serialUpa)).toBeGreaterThan(-1);
                    });
                }
            });
        });

        it('Should throw an error when changing the version of an UPA that isn\t an UPA', () => {
            try {
                upaApi.changeUpaVersion('not an upa', 'no new version');
                fail('Should have failed here!');
            } catch (error) {
                expect(error).not.toBeNull();
                expect(error.error).toContain(
                    'is not a valid upa, so its version cannot be changed!'
                );
            }
        });

        it('Should throw an error when changing the version of an UPA to a bad value', () => {
            const badVersionValues = [0, -1, '-1', '0', 'abc', '12V', 'V12', '1v3'];
            badVersionValues.forEach((badVal) => {
                try {
                    const newUpa = upaApi.changeUpaVersion('1/2/3', badVal);
                    fail(newUpa + ' -- Should have failed here!');
                } catch (error) {
                    expect(error).not.toBeNull();
                    expect(error.error).toContain(badVal + ' is not a valid version number!');
                }
            });
        });
    });
});
