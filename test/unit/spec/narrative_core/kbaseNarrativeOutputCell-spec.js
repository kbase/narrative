define([
    'jquery',
    'kbaseNarrativeOutputCell',
    'base/js/namespace',
    'narrativeMocks',
    'narrativeConfig',
    'testUtil',
], ($, Widget, Jupyter, Mocks, Config, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeOutputCell widget', () => {
        const testWidget = 'kbaseDefaultNarrativeOutput',
            testUpas = {
                test: '3/4/5',
                testList: ['1/2/3', '6/7/8'],
            },
            serialUpas = {
                test: '[3]/4/5',
                testList: ['[1]/2/3', '[6]/7/8'],
            },
            deserialUpas = {
                test: '10/4/5',
                testList: ['10/2/3', '10/7/8'],
            },
            testData = { foo: 'bar', baz: [1, 2, 3] },
            cellId = 'a-cell-id';
        let $container, $target, myWidget;

        const validateUpas = function (source, comparison) {
            Object.keys(comparison).forEach((upaKey) => {
                if (typeof comparison[upaKey] === 'string') {
                    expect(source[upaKey]).toEqual(comparison[upaKey]);
                } else {
                    // it better be a list
                    comparison[upaKey].forEach((upa) => {
                        expect(source[upaKey].indexOf(upa)).toBeGreaterThan(-1);
                    });
                }
            });
        };

        beforeEach(() => {
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
            };

            Config.config.workspaceId = 10;
            $target = $('<div>');
            $container = $('<div id="notebook-container">').append($target);
            $('body').append($container);
            myWidget = new Widget($target, {
                widget: testWidget,
                data: testData,
                type: 'viewer',
                upas: testUpas,
            });
            myWidget.cell = {};
            myWidget.metadata = myWidget.initMetadata();

            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                statusCode: 503,
                statusText: 'HTTP/1.1 503 Service Offline',
                response: { error: '...' },
            });
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            $container.remove();
            TestUtil.clearRuntime();
        });

        it('Should load properly with a dummy UPA', () => {
            expect(myWidget).not.toBeNull();
        });

        it('Should serialize UPA info properly', () => {
            myWidget.handleUpas();
            const serialized = myWidget.cell.metadata.kbase.dataCell.upas;
            validateUpas(serialUpas, serialized);
        });

        // skip until we get better notebook support.
        xit('Should attach a widget using a pre-existing cell id', () => {
            const $newDiv = $('<div id="' + cellId + '">');
            $('#notebook-container').append($newDiv);
            const newWidget = new Widget($newDiv, {
                widget: testWidget,
                data: testData,
                type: 'viewer',
                upas: testUpas,
                cellId: cellId,
            });
            expect(newWidget.cell).toBeTruthy();
        });

        it('Should deserialize a pre-existing UPA properly', () => {
            myWidget.cell.metadata = {
                kbase: {
                    dataCell: {
                        upas: serialUpas,
                    },
                },
            };
            myWidget.metadata = myWidget.initMetadata();
            myWidget.handleUpas();
            validateUpas(deserialUpas, myWidget.options.upas);
        });

        it("inViewport should return true by default, if it's missing parameters", () => {
            expect(myWidget.inViewport()).toBe(true);
        });

        it('Should render properly', async () => {
            await myWidget.render();
            // exercise the header button a bit
            expect($target.find('.btn.kb-data-obj')).not.toBeNull();
            $target.find('.btn.kb-data-obj').click();
            expect(myWidget.headerShown).toBeTruthy();
            $target.find('.btn.kb-data-obj').click();
            expect(myWidget.headerShown).toBeFalsy();
        });

        // FIXME: this test consistently times out
        xit("Should render an error properly when its viewer doesn't exist", () => {
            const $nuTarget = $('<div>');
            $('#notebook-container').append($nuTarget);
            const w = new Widget($nuTarget, {
                widget: 'NotAWidget',
                data: testData,
                type: 'viewer',
                upas: testUpas,
            });
            return w.render().then(() => {
                expect(w.options.title).toEqual('App Error');
            });
        });

        it('Should update its UPAs properly with a version change request', async () => {
            await myWidget.render();
            myWidget.displayVersionChange('test', 4);
            expect(myWidget.cell.metadata.kbase.dataCell.upas.test).toEqual('[3]/4/4');
        });

        it('Should handle UPAs correctly when forcing to overwrite existing metadata', () => {
            myWidget.metadata = myWidget.initMetadata();
            myWidget.handleUpas();
            myWidget.options.upas = deserialUpas;
            myWidget.handleUpas(true);
            expect(myWidget.cell.metadata.kbase.dataCell.upas.test).toEqual('[10]/4/5');
            expect(myWidget.cell.metadata.kbase.dataCell.upas.testList).toEqual([
                '[10]/2/3',
                '[10]/7/8',
            ]);
        });
    });
});
