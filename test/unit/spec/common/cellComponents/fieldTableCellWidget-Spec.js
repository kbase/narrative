define([
    'base/js/namespace',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/props',
    'common/spec',
    '/test/data/testAppObj',
], (Jupyter, FieldCellWidget, ParamResolver, Props, Spec, TestAppObject) => {
    'use strict';

    describe('The Field Table Cell Widget module', () => {
        it('loads', () => {
            expect(FieldCellWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(FieldCellWidget.make).toBeDefined();
        });
    });

    describe('The Field Table Cell Widget instance', () => {
        let node, fieldCellWidgetInstance;

        const parameterSpec = {
            data: {
                constraints: {
                    required: false,
                    options: undefined,
                    min_length: 1,
                    max_length: 10000,
                },
                defaultValue: '',
                nullValue: '',
                sequence: false,
                type: 'string',
            },
            id: 'fastq_fwd_staging_file_name',
            multipleItems: false,
            original: {
                advanced: 0,
                allow_multiple: 0,
                default_values: [''],
                description:
                    'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                disabled: 0,
                dynamic_dropdown_options: {
                    data_source: 'ftp_staging',
                    multiselection: 0,
                    query_on_empty_input: 1,
                    result_array_index: 0,
                    service_params: null,
                },
                field_type: 'dynamic_dropdown',
                id: 'fastq_fwd_staging_file_name',
                optional: 1,
                short_hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                ui_class: 'parameter',
                ui_name: 'Forward/Left FASTA/FASTQ File Path',
            },
            ui: {
                advanced: false,
                class: 'parameter',
                control: 'dynamic_dropdown',
                description:
                    'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                label: 'Forward/Left FASTA/FASTQ File Path',
                type: 'dynamic_dropdown',
            },
        };

        const closeParameters = [
            'fastq_fwd_staging_file_name',
            'fastq_rev_staging_file_name',
            'sra_staging_file_name',
            'name',
        ];

        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(async () => {
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const appSpec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            const paramResolver = ParamResolver.make();

            await paramResolver.loadInputControl(parameterSpec).then((inputControlFactory) => {
                return (fieldCellWidgetInstance = FieldCellWidget.make({
                    inputControlFactory: inputControlFactory,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: '',
                    appSpec: appSpec,
                    parameterSpec: parameterSpec,
                    workspaceId: 56236,
                    referenceType: 'name',
                    paramsChannelName: 'Test Channel',
                    closeParameters: closeParameters,
                }));
            });
        });

        afterEach(async () => {
            await fieldCellWidgetInstance.stop().catch((err) => {
                console.warn(
                    'got an error when trying to stop, this is normal if stopped already (e.g. after final test run)',
                    err
                );
            });

            node = null;
            document.body.innnerHTML = '';
            fieldCellWidgetInstance = null;
        });

        it('has a factory which can be invoked', () => {
            expect(fieldCellWidgetInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(fieldCellWidgetInstance[fn]).toBeDefined();
                expect(fieldCellWidgetInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('has a method start which returns the correct object', () => {
            return fieldCellWidgetInstance
                .start({
                    node: node,
                })
                .then(() => {
                    expect(node.innerHTML).toContain('kb-field-cell__cell_label');
                    expect(node.innerHTML).toContain('kb-field-cell__input_control');
                });
        });

        it('has a method stop which returns null', () => {
            return fieldCellWidgetInstance
                .start({
                    node: node,
                })
                .then(() => {
                    fieldCellWidgetInstance.stop().then((result) => {
                        expect(result).toBeNull();
                    });
                });
        });
    });
});
