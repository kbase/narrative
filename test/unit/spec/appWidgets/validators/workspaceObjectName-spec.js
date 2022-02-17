define([
    'widgets/appWidgets2/validators/workspaceObjectName',
    'widgets/appWidgets2/validators/constants',
    'narrativeMocks',
], (Validator, Constants, Mocks) => {
    'use strict';

    function buildResult(expected) {
        const keys = ['isValid', 'messageId', 'errorMessage', 'shortMessage', 'diagnosis'];
        const base = keys.reduce((acc, key) => {
            acc[key] = undefined;
            return acc;
        }, {});
        return Object.assign(base, expected);
    }

    describe('WorkspaceObjectName validator', () => {
        const inputValue = 'some_object';

        [
            {
                label: 'when required',
                required: true,
            },
            {
                label: 'when not required',
                required: false,
            },
            {
                label: 'with special characters',
                value: 'foo.bar-baz_123',
                required: false,
            },
        ].forEach((testCase) => {
            it(`should return a valid result for a valid workspace object name ${testCase.label}`, async () => {
                const constraints = { required: testCase.required };
                const value = testCase.value ? testCase.value : inputValue;
                const result = await Validator.validate(value, { data: { constraints } }, {});
                expect(result).toEqual(buildResult(result));
            });
        });

        const missingValues = ['', null, undefined];
        missingValues.forEach((value) => {
            it(`should return an error if value is "${value}" but required`, async () => {
                const spec = {
                    data: {
                        constraints: {
                            required: true,
                        },
                    },
                };
                const result = await Validator.validate(value, spec, {});
                const expectedResult = {
                    isValid: false,
                    messageId: 'required-missing',
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    shortMessage: undefined,
                };
                expect(result).toEqual(expectedResult);
            });
        });

        it('should be valid with an empty optional value', async () => {
            const result = await Validator.validate(null, {
                data: { constraints: { required: false } },
            });
            expect(result).toEqual(
                buildResult({
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                })
            );
        });

        let tooLongName = 'a';
        for (let i = 0; i < 255; i++) {
            tooLongName += 'a';
        }
        [
            {
                label: 'spaces',
                value: 'some object',
                errorMessage: 'an object name may not contain a space',
                messageId: 'obj-name-no-spaces',
            },
            {
                label: 'number',
                value: '12345',
                errorMessage: 'an object name may not be in the form of an integer',
                messageId: 'obj-name-not-integer',
            },
            {
                label: 'invalid characters',
                value: 'some&object',
                errorMessage:
                    'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"',
                messageId: 'obj-name-invalid-characters',
            },
            {
                label: 'over 255 characters',
                value: tooLongName,
                errorMessage: 'an object name may not exceed 255 characters in length',
                messageId: 'obj-name-too-long',
            },
        ].forEach((testCase) => {
            it(`should invalidate a value with ${testCase.label}`, async () => {
                const spec = { data: { constraints: {} } };
                const result = await Validator.validate(testCase.value, spec, {});
                expect(result).toEqual(
                    buildResult({
                        isValid: false,
                        errorMessage: testCase.errorMessage,
                        messageId: testCase.messageId,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                    })
                );
            });
        });

        describe('name lookup tests', () => {
            const fakeUrl = 'https://kbase.us/services/fake_workspace',
                fakeToken = 'fakeToken',
                wsId = '123',
                inputType = 'SomeModule.SomeType';
            beforeEach(() => {
                jasmine.Ajax.install();
            });

            afterEach(() => {
                jasmine.Ajax.uninstall();
            });

            function mockWorkspaceCall(response) {
                Mocks.mockJsonRpc1Call({
                    url: fakeUrl,
                    body: /get_object_info_new/,
                    response: [response],
                });
            }

            [
                {
                    label: 'valid',
                    wsResponse: null,
                    result: { isValid: true, diagnosis: Constants.DIAGNOSIS.VALID },
                },
                {
                    label: 'warning',
                    wsResponse: [1, inputValue, inputType],
                    result: {
                        isValid: true,
                        diagnosis: Constants.DIAGNOSIS.SUSPECT,
                        shortMessage: 'an object already exists with this name',
                        messageId: 'obj-overwrite-warning',
                    },
                },
                {
                    label: 'error',
                    wsResponse: [1, inputValue, 'SomeModule.OtherType'],
                    result: {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                        errorMessage:
                            'an object already exists with this name and is not of the same type',
                        messageId: 'obj-overwrite-diff-type',
                    },
                },
            ].forEach((testCase) => {
                it(`looks up object data properly when expected, and returns a ${testCase.label} result`, async () => {
                    mockWorkspaceCall(testCase.wsResponse);
                    const constraints = {
                        shouldNotExist: true,
                        types: [inputType],
                        required: true,
                    };
                    const options = {
                        workspaceId: wsId,
                        authToken: fakeToken,
                        workspaceServiceUrl: fakeUrl,
                    };
                    const result = await Validator.validate(
                        inputValue,
                        { data: { constraints } },
                        options
                    );
                    expect(result).toEqual(buildResult(testCase.result));
                });
            });

            it('Should look up object name when requested as an option as well as a constraint', async () => {
                mockWorkspaceCall(null);
                const spec = {
                    data: {
                        constraints: {
                            types: [inputType],
                        },
                    },
                };
                const options = {
                    workspaceId: wsId,
                    authToken: fakeToken,
                    workspaceServiceUrl: fakeUrl,
                    shouldNotExist: true,
                };
                const result = await Validator.validate(inputValue, spec, options);
                expect(result).toEqual(
                    buildResult({ isValid: true, diagnosis: Constants.DIAGNOSIS.VALID })
                );
                expect(jasmine.Ajax.requests.count()).toBe(1);
            });
        });
    });

    describe('WorkspaceObjectName importString function', () => {
        const cases = [
            'foo',
            '  foo',
            'foo  ',
            'foo\n',
            '\nfoo',
            '\tfoo',
            'foo\t',
            'foo\t\n\t   \n',
        ];
        it('should easily import a text string', () => {
            cases.forEach((testCase) => {
                expect(Validator.importString(testCase)).toEqual('foo');
            });
        });
    });
});
