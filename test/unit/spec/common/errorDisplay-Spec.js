define(['common/errorDisplay', 'common/props'], (ErrorDisplay, Props) => {
    'use strict';
    const validInput = Props.make({
        data: {
            exec: {
                jobState: {
                    error: {
                        name: 'Oh no',
                        message: 'Disaster',
                        error: 'calamity\ndisaster\ndespair',
                    },
                },
            },
        },
    });
    let cssBaseClass;

    describe('The error display module', () => {
        it('loads', () => {
            expect(ErrorDisplay).not.toBe(null);
        });

        it('has expected exports', () => {
            const exports = ['make', 'defaultAdvice', 'cssBaseClass'];
            exports.forEach((ex) => {
                expect(ErrorDisplay[ex]).toBeDefined();
            });
        });
    });

    describe('The UI module attribute defaultAdvice', () => {
        it('should return a string about contacting support', () => {
            expect(ErrorDisplay.defaultAdvice).toContain('www.kbase.us/support');
        });
    });

    describe('The UI module attribute cssBaseClass', () => {
        it('should return a string to use as a CSS base class', () => {
            expect(ErrorDisplay.cssBaseClass).toContain('kb-error-display');
        });
    });

    describe('An errorDisplay instance', () => {
        let errorDisplayInstance;
        beforeEach(() => {
            errorDisplayInstance = ErrorDisplay.make({
                model: validInput,
            });
        });

        it('has a make function that returns an object', () => {
            expect(errorDisplayInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            ['start', 'stop'].forEach((fn) => {
                expect(errorDisplayInstance[fn]).toBeDefined();
                expect(errorDisplayInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and render an error', async () => {
            const node = document.createElement('div');
            cssBaseClass = ErrorDisplay.cssBaseClass;

            await errorDisplayInstance.start({ node: node });
            expect(node.classList).toContain(`${cssBaseClass}__container`);
            expect(node.innerHTML).toContain('Error stacktrace');
        });

        it('should clean up after itself', async () => {
            const node = document.createElement('div');
            cssBaseClass = ErrorDisplay.cssBaseClass;

            await errorDisplayInstance.start({ node: node });
            expect(node.classList).toContain(`${cssBaseClass}__container`);
            await errorDisplayInstance.stop();
            expect(node.innerHTML).toBe('');
        });
    });

    describe('The ErrorDisplay module should render different errors', () => {
        const invalidArgs = [null, undefined, {}, { this: 'that' }, Props.make({})];
        invalidArgs.forEach((input) => {
            it(`should throw an error with invalid input ${JSON.stringify(input)}`, () => {
                // it is unclear why, but the standard `toThrow` or `toThrowError`
                // matchers fail to catch these errors
                try {
                    ErrorDisplay.make(input);
                    fail(`Error not thrown with invalid input ${JSON.stringify(input)}`);
                } catch (error) {
                    expect(error.toString()).toContain('Invalid input for the ErrorDisplay module');
                    expect(error).toBeInstanceOf(Error);
                }
            });
            // fails for unknown reasons => disabled for now
            xit(`should pass a toThrow(Error, /regex/) test with invalid input ${JSON.stringify(
                input
            )}`, () => {
                expect(ErrorDisplay.make(input)).toThrow(
                    Error,
                    /Invalid input for the ErrorDisplay module/
                );
            });
        });

        const { defaultAdvice } = ErrorDisplay,
            testErrors = [
                {
                    desc: 'classic KBase RPC error',
                    in: validInput,
                    outObject: {
                        type: 'Oh no',
                        message: 'Disaster',
                        stacktrace: 'calamity\ndisaster\ndespair',
                    },
                    outDisplay: {
                        type: 'Oh no',
                        message: 'Disaster',
                        advice: [defaultAdvice],
                        stacktrace: 'calamity\ndisaster\ndespair',
                    },
                },
                {
                    desc: 'name/code combo',
                    in: Props.make({
                        data: {
                            exec: {
                                jobState: {
                                    error: {
                                        name: 'Something awful',
                                        code: '007',
                                    },
                                },
                            },
                        },
                    }),
                    outObject: {
                        type: 'Something awful',
                        message: 'Error code: 007',
                        detail: 'This error occurred during execution of the app job.',
                    },
                    outDisplay: {
                        type: 'Something awful',
                        message: 'Error code: 007',
                        advice: [defaultAdvice],
                        detail: 'This error occurred during execution of the app job.',
                    },
                },
                {
                    desc: 'error integrated into jobState object',
                    in: Props.make({
                        data: {
                            exec: {
                                jobState: {
                                    status: 'error',
                                    errormsg: 'A series of unfortunate events',
                                    error_code: 666,
                                },
                            },
                        },
                    }),
                    outObject: {
                        type: 'Error code 666',
                        message: 'A series of unfortunate events',
                        detail: 'This error occurred during execution of the app job.',
                    },
                    outDisplay: {
                        type: 'Error code 666',
                        message: 'A series of unfortunate events',
                        advice: [defaultAdvice],
                        detail: 'This error occurred during execution of the app job.',
                    },
                },
                {
                    desc: 'unknown job error',
                    in: Props.make({
                        data: {
                            exec: {
                                jobState: {
                                    error: {
                                        this: 'that',
                                    },
                                },
                            },
                        },
                    }),
                    outObject: {
                        type: 'Unknown error',
                        message: 'error in unknown format',
                        errorDump: { this: 'that', location: 'job execution' },
                    },
                    outDisplay: {
                        type: 'Unknown error',
                        message: 'error in unknown format',
                        advice: [defaultAdvice],
                        errorDump: JSON.stringify(
                            { this: 'that', location: 'job execution' },
                            null,
                            1
                        ),
                    },
                },
                {
                    desc: 'internal error',
                    in: Props.make({
                        data: {
                            internalError: {
                                title: 'Terrible internal error',
                                message: 'Oh no!',
                                advice: ['do this', 'then this', 'then that'],
                                detail: 'we have no stacktrace',
                            },
                        },
                    }),
                    out: {
                        type: 'Terrible internal error',
                        message: 'Oh no!',
                        advice: ['do this', 'then this', 'then that'],
                        detail: 'we have no stacktrace',
                    },
                },
                {
                    desc: 'default error',
                    in: Props.make({
                        data: {
                            this: 'that',
                        },
                    }),
                    outObject: {
                        type: 'Unknown error',
                        message: 'error in unknown format',
                        errorDump: { this: 'that' },
                    },
                    outDisplay: {
                        type: 'Unknown error',
                        message: 'error in unknown format',
                        advice: [defaultAdvice],
                        errorDump: JSON.stringify({ this: 'that' }, null, 1),
                    },
                },
            ];

        const dataToClass = {
            type: 'type',
            message: 'message',
            advice: 'advice',
            detail: 'detail_text',
            stacktrace: 'stacktrace_code',
            errorDump: 'error_dump_code',
        };
        cssBaseClass = ErrorDisplay.cssBaseClass;

        testErrors.forEach((test) => {
            const node = document.createElement('div');
            const errorDisplayInstance = ErrorDisplay.make({
                model: test.in,
            });

            it(`should normalise an error of type ${test.desc}`, () => {
                const rawObject = test.in.getRawObject();
                const output = ErrorDisplay.normaliseErrorObject(rawObject);
                const expected = test.outObject || test.out;
                Object.keys(dataToClass)
                    .sort()
                    .forEach((datum) => {
                        if (expected[datum]) {
                            expect(expected[datum]).toEqual(output[datum]);
                        } else {
                            expect(output[datum]).not.toBeDefined();
                        }
                    });
            });

            it(`should present an error of type ${test.desc}`, async () => {
                const expected = test.outDisplay || test.out;
                await errorDisplayInstance.start({ node: node });
                Object.keys(dataToClass)
                    .sort()
                    .forEach((datum) => {
                        const matchingElements = node.getElementsByClassName(
                            `${cssBaseClass}__${dataToClass[datum]}`
                        );
                        if (expected[datum]) {
                            const content = matchingElements[0];
                            if (
                                Object.prototype.toString.call(expected[datum]).slice(8, -1) ===
                                'Array'
                            ) {
                                expected[datum].forEach((item) => {
                                    expect(content.innerHTML).toContain(item);
                                });
                            } else {
                                expect(content.innerHTML).toContain(expected[datum]);
                            }
                        } else {
                            expect(matchingElements.length).toBe(0);
                        }
                    });
            });
        });
    });
});
