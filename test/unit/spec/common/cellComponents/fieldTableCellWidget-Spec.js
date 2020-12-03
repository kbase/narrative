/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*global beforeAll, afterAll*/
/*jslint white: true*/

define([
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/props',
    'common/spec',
    'json!../../../../data/testAppObj.json',
], function(
    fieldCellWidget,
    ParamResolver,
    Props,
    Spec,
    TestAppObject
) {
    'use strict';

    describe('The Field Table Cell Widget module', function() {
        it('loads', function() {
            expect(fieldCellWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(fieldCellWidget.make).toBeDefined();
        });

    });

    describe('The Field Table Cell Widget instance', function() {
        let node, parameterSpec, paramResolver, inputControlFacotry, appSpec, closeParameters, mockFieldWidget;

        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(function () {
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            parameterSpec = {
                data: {
                    constraints: {
                        required: false,
                        options: undefined,
                        min_length: 1,
                        max_length: 10000
                    },
                    defaultValue: '',
                    nullValue: '',
                    sequence: false,
                    type: 'string'
                },
                id: 'fastq_fwd_staging_file_name',
                multipleItems: false,
                original: {
                    advanced: 0,
                    allow_multiple: 0,
                    default_values: [''],
                    description: 'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                    disabled: 0,
                    dynamic_dropdown_options: {
                        data_source: 'ftp_staging',
                        multiselection: 0,
                        query_on_empty_input: 1,
                        result_array_index: 0,
                        service_params: null
                    },
                    field_type: 'dynamic_dropdown',
                    id: 'fastq_fwd_staging_file_name',
                    optional: 1,
                    short_hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                    ui_class: 'parameter',
                    ui_name: 'Forward/Left FASTA/FASTQ File Path'
                },
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

            paramResolver = ParamResolver.make();

            inputControlFacotry = paramResolver.loadInputControl(parameterSpec);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => {},
            });

            appSpec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            closeParameters = [
                'fastq_fwd_staging_file_name',
                'fastq_rev_staging_file_name',
                'sra_staging_file_name',
                'name'
            ];

            return mockFieldWidget = fieldCellWidget.make({
                inputControlFactory: inputControlFacotry,
                showHint: true,
                useRowHighight: true,
                initialValue: '',
                appSpec: appSpec,
                parameterSpec: parameterSpec,
                workspaceId: 56236,
                referenceType: 'name',
                paramsChannelName: 'Test Channel',
                closeParameters: closeParameters
            });
        });

        it('has a factory which can be invoked', function() {
            expect(mockFieldWidget).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockFieldWidget.start).toBeDefined();
            expect(mockFieldWidget.stop).toBeDefined();
            expect(mockFieldWidget.bus).toBeDefined();
        });

        it('has a method start which returns the correct object', () => {
            return mockFieldWidget.start({
                node: node
            }).then(() => {
                expect(node.innerHTML).toContain('kb-field-cell__cell_label');
                expect(node.innerHTML).toContain('kb-field-cell__input_control');
            });
        });

        it('has a method stop which returns null', () => {
            return mockFieldWidget.start({
                node: node
            }).then(() => {
                mockFieldWidget.stop().then((result) =>{
                    expect(result).toBeNull();
                });
            });
        });
    });
});
