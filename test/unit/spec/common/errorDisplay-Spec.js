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

        it('has expected functions', () => {
            const functions = ['make', 'defaultAdvice', 'cssBaseClass'];
            functions.forEach((f) => {
                expect(ErrorDisplay[f]).toBeDefined();
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
            expect(errorDisplayInstance.start).toBeDefined();
            expect(errorDisplayInstance.stop).toBeDefined();
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
                    out: {
                        type: 'Oh no',
                        message: 'Disaster',
                        detail: null,
                        advice: defaultAdvice,
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
                    out: {
                        type: 'Something awful',
                        message: 'Error code: 007',
                        detail: 'This error occurred during execution of the app job.',
                        advice: defaultAdvice,
                        stacktrace: null,
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
                    out: {
                        type: 'unknown',
                        message: 'Unknown error: check console for error with errorDisplayId ',
                        detail: null,
                        advice: defaultAdvice,
                        stacktrace: null,
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
                        advice: 'then this', // just part of the advice
                        detail: 'we have no stacktrace',
                        stacktrace: null,
                    },
                },
                {
                    desc: 'default error',
                    in: Props.make({
                        data: {
                            this: 'that',
                        },
                    }),
                    out: {
                        type: 'unknown',
                        message: 'Unknown error: check console for error with errorDisplayId ',
                        advice: defaultAdvice,
                        detail: null,
                        stacktrace: null,
                    },
                },
            ];

        const dataToClass = {
            type: 'type',
            message: 'message',
            advice: 'advice',
            detail: 'detail_text',
            stacktrace: 'stacktrace_code',
        };
        cssBaseClass = ErrorDisplay.cssBaseClass;

        testErrors.forEach((test) => {
            const node = document.createElement('div');
            const errorDisplayInstance = ErrorDisplay.make({
                model: test.in,
            });

            it(`should present an error of type ${test.desc}`, async () => {
                await errorDisplayInstance.start({ node: node });
                Object.keys(dataToClass)
                    .sort()
                    .forEach((datum) => {
                        const matchingElements = node.getElementsByClassName(
                            `${cssBaseClass}__${dataToClass[datum]}`
                        );
                        if (test.out[datum]) {
                            const content = matchingElements[0];
                            expect(content.innerHTML).toContain(test.out[datum]);
                        } else {
                            expect(matchingElements.length).toBe(0);
                        }
                    });
            });
        });
    });
});
