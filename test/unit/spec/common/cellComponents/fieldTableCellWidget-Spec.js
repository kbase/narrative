/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*jslint white: true*/

define([
    'common/cellComponents/fieldTableCellWidget',
    'kb_common/html',
], function(
    fieldCellWidget,
    html
) {
    'use strict';

    let fieldWidget,
        node;

    const t = html.tag,
        div = t('div');

    describe('The Field Table Cell Widget module', function() {
        it('loads', function() {
            expect(fieldCellWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(fieldCellWidget.make).toBeDefined();
        });

    });

    describe('The Field Table Cell Widget instance', function() {
        let fieldWidgetPromise,
            mockInputControlFactory = {
                make: function() {
                    return {
                        start: () => {},
                        stop: () => {}
                    };
                }
            };

        let parameterSpec = {
            ui: {
                advanced: false,
                class: 'parameter',
                control: 'dynamic_dropdown',
                description: 'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                label: 'Forward/Left FASTA/FASTQ File Path',
                type: 'dynamic_dropdown'
            }
        };

        const mockFieldWidget = fieldCellWidget.make({
            inputControlFactory: mockInputControlFactory,
            parameterSpec: parameterSpec
        });

        beforeEach(async function () {
            node = document.createElement('div');

            fieldWidgetPromise = mockFieldWidget.start({node});
            fieldWidget = await fieldWidgetPromise;
            return fieldWidget;
        });

        it('has a factory which can be invoked', function() {
            expect(mockFieldWidget).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockFieldWidget.start).toBeDefined();
            expect(mockFieldWidget.stop).toBeDefined();
        });

        it('has a method "start" which returns a Promise',
            function() {
                expect(fieldWidgetPromise instanceof Promise).toBeTrue();
            }
        );

        it('has a method "stop" which returns a Promise',
            function() {
                const result = mockFieldWidget.stop();
                expect(result instanceof Promise).toBeTrue();
            }
        );

        it('has method "bus" which returns an object', function() {
            expect(mockFieldWidget.bus).toBeDefined();
        });

        it('renders a table cell with a label and input', function() {

        });
    });
});
