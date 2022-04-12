define(['widgets/appWidgets2/input/subdataInput', 'testUtil'], (SubdataInput, TestUtil) => {
    'use strict';

    describe('Test subobject data input widget', () => {
        const testConfig = {
            parameterSpec: {
                data: {
                    defaultValue: '',
                    nullValue: '',
                    constraints: {
                        required: false,
                    },
                },
                original: {
                    text_subdata_options: {},
                },
            },
            channelName: 'foo',
        };

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(SubdataInput).not.toBeNull();
        });

        it('should instantiate an object with start and stop functions', () => {
            const widget = SubdataInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });
    });
});
