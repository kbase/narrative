define([
    'jquery',
    'kbaseNarrativeOutputCell',
    'base/js/namespace',
    'kbaseNarrative',
    'common/runtime',
    'narrativeConfig',
], ($, Widget, Jupyter, Narrative, Runtime, Config) => {
    'use strict';
    describe('The kbaseNarrativeOutputCell widget', () => {
        let currentWsId = 10,
            testWidget = 'kbaseDefaultNarrativeOutput',
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
            $target = $('<div>'),
            cellId = 'a-cell-id',
            myWidget = null;

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
            Config.config.workspaceId = 10;
            Jupyter.narrative = new Narrative();
            $('body').append($('<div id="notebook-container">').append($target));
            myWidget = new Widget($target, {
                widget: testWidget,
                data: testData,
                type: 'viewer',
                upas: testUpas,
            });
            myWidget.cell = {};
            myWidget.metadata = myWidget.initMetadata();
        });

        afterEach(() => {
            $('body').empty();
            $target = $('<div>');
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

        it('Should do lazy rendering if the option is enabled', () => {});

        it("inViewport should return true by default, if it's missing parameters", () => {
            expect(myWidget.inViewport()).toBe(true);
        });

        it('Should render properly', () => {
            return myWidget.render().then(() => {
                // exercise the header button a bit
                expect($target.find('.btn.kb-data-obj')).not.toBeNull();
                $target.find('.btn.kb-data-obj').click();
                expect(myWidget.headerShown).toBeTruthy();
                $target.find('.btn.kb-data-obj').click();
                expect(myWidget.headerShown).toBeFalsy();
            });
        });

        xit("Should render an error properly when its viewer doesn't exist", () => {
            // mocking window.require doesn't seem to have the expected effect.
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

        it('Should update its UPAs properly with a version change request', () => {
            return myWidget.render().then(() => {
                myWidget.displayVersionChange('test', 4);
                expect(myWidget.cell.metadata.kbase.dataCell.upas.test).toEqual('[3]/4/4');
            });
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
