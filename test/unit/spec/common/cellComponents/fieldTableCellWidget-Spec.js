define([
    'base/js/namespace',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'widgets/appWidgets2/validators/constants',
    'common/props',
    'common/spec',
    'testUtil',
    '/test/data/testBulkImportObj',
], (
    Jupyter,
    FieldCellWidget,
    ParamResolver,
    Constants,
    Props,
    Spec,
    TestUtil,
    TestBulkImportObject
) => {
    'use strict';

    describe('The Field Table Cell Widget module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(FieldCellWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(FieldCellWidget.make).toBeDefined();
        });
    });

    describe('The Field Table Cell Widget instance', () => {
        let container;
        const baseClass = 'kb-field-cell',
            cellClass = `${baseClass}__rowCell`,
            messagePanelClass = `${baseClass}__message_panel`,
            duplicatePanelClass = `${messagePanelClass}__duplicate`,
            cellErrorClass = `${baseClass}__error_message`;

        const parameterSpec = {
            data: {
                constraints: {
                    required: true,
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
                text_options: {
                    is_output_name: 0,
                    placeholder: '',
                },
                field_type: 'text',
                id: 'fastq_fwd_staging_file_name',
                optional: 1,
                short_hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                ui_class: 'parameter',
                ui_name: 'Forward/Left FASTA/FASTQ File Path',
            },
            ui: {
                advanced: false,
                class: 'parameter',
                control: 'text',
                description:
                    'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                hint: 'Short read file containing a paired end library in FASTA/FASTQ format',
                label: 'Forward/Left FASTA/FASTQ File Path',
                type: 'text',
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

        beforeEach(async function () {
            container = document.createElement('div');
            this.node = document.createElement('div');
            container.appendChild(this.node);

            const model = Props.make({
                data: TestBulkImportObject,
                onUpdate: () => {},
            });

            const appSpec = Spec.make({
                appSpec: model.getItem([
                    'app',
                    'specs',
                    'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                ]),
            });

            const paramResolver = ParamResolver.make();

            await paramResolver.loadInputControl(parameterSpec).then((inputControlFactory) => {
                return (this.fieldCellWidgetInstance = FieldCellWidget.make({
                    inputControlFactory: inputControlFactory,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: 'x',
                    appSpec: appSpec,
                    parameterSpec: parameterSpec,
                    workspaceId: 56236,
                    referenceType: 'name',
                    paramsChannelName: 'Test Channel',
                    closeParameters: closeParameters,
                }));
            });
        });

        afterEach(async function () {
            if (this.fieldCellWidgetInstance) {
                await this.fieldCellWidgetInstance.stop().catch((err) => {
                    console.warn(
                        'got an error when trying to stop, this is normal if stopped already (e.g. after final test run)',
                        err
                    );
                });
            }
            container.remove();
            TestUtil.clearRuntime();
        });

        it('has a factory which can be invoked', function () {
            expect(this.fieldCellWidgetInstance).not.toBe(null);
        });

        it('has the required methods', function () {
            ['bus', 'start', 'stop', 'setDuplicateValue', 'clearDuplicateValue'].forEach((fn) => {
                expect(this.fieldCellWidgetInstance[fn]).toBeDefined();
            });
        });

        it('has a method start which returns the correct object', async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            expect(this.node.innerHTML).toContain('kb-field-cell__cell_label');
            expect(this.node.innerHTML).toContain('kb-field-cell__input_control');
        });

        it('has a method stop which returns null', async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            const result = await this.fieldCellWidgetInstance.stop();
            expect(result).toBeNull();
            this.fieldCellWidgetInstance = null;
        });

        [
            {
                rows: null,
                text: 'duplicate value found',
                label: 'without rows',
            },
            {
                rows: {
                    thisTab: [1],
                },
                text: 'duplicate value found on row 1',
                label: 'on one row',
            },
            {
                rows: {
                    thisTab: [1, 2],
                },
                text: 'duplicate values found on rows 1 and 2',
                label: 'on two rows',
            },
            {
                rows: {
                    thisTab: [1, 2, 3],
                },
                text: 'duplicate values found on rows 1, 2, and 3',
                label: 'on more than two rows',
            },
            {
                rows: {
                    thisTab: [1],
                    otherTabs: {
                        foobar: [1],
                    },
                },
                text: 'duplicate values found on row 1, and on tab "foobar" row 1',
                label: 'on a row and a tab',
            },
            {
                rows: {
                    otherTabs: {
                        foobar: [1],
                    },
                },
                text: 'duplicate value found on tab "foobar" row 1',
                label: 'on a tab',
            },
            {
                rows: {
                    otherTabs: {
                        foobar: [1],
                        baz: [1],
                    },
                },
                text: 'duplicate values found on tabs "foobar" row 1 and "baz" row 1',
                label: 'on two tabs',
            },
            {
                rows: {
                    otherTabs: {
                        a: [1],
                        b: [2],
                        c: [3],
                    },
                },
                text: 'duplicate values found on tabs "a" row 1, "b" row 2, and "c" row 3',
                label: 'on more than two tabs',
            },
        ].forEach((testCase) => {
            it(`can set its state to display an error for duplicate values ${testCase.label}`, async function () {
                await this.fieldCellWidgetInstance.start({
                    node: this.node,
                });
                // dupMsg is the div that holds the error itself
                const dupMsg = this.node.querySelector('.' + duplicatePanelClass);
                // container is the wrapper around everything in the cell - we want to
                // make sure it has the right error class applied at the right time
                const container = this.node.querySelector('.' + cellClass);

                expect(container.classList).not.toContain(cellErrorClass);
                expect(dupMsg.classList).toContain('hidden');
                this.fieldCellWidgetInstance.setDuplicateValue(testCase.rows);

                expect(container.classList).toContain(cellErrorClass);
                expect(dupMsg.classList).not.toContain('hidden');
                expect(dupMsg.innerHTML).toContain(testCase.text);
            });
        });

        it('can have its state cleared to remove the duplicate value error', async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            const dupMsg = this.node.querySelector('.' + duplicatePanelClass);
            const container = this.node.querySelector('.' + cellClass);

            expect(container.classList).not.toContain(cellErrorClass);
            expect(dupMsg.classList).toContain('hidden');

            this.fieldCellWidgetInstance.setDuplicateValue();
            expect(dupMsg.classList).not.toContain('hidden');
            expect(container.classList).toContain(cellErrorClass);

            this.fieldCellWidgetInstance.clearDuplicateValue();
            expect(container.classList).not.toContain(cellErrorClass);
            expect(dupMsg.classList).toContain('hidden');
        });

        [
            {
                validMsg: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'data is invalid',
                },
                label: Constants.DIAGNOSIS.INVALID,
            },
            {
                validMsg: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                },
                label: Constants.DIAGNOSIS.REQUIRED_MISSING,
            },
            {
                validMsg: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.SUSPECT,
                    shortMessage: 'value is sus',
                },
                label: Constants.DIAGNOSIS.SUSPECT,
            },
        ].forEach((testCase) => {
            it(`should show a response to validation message: ${testCase.label}`, async function () {
                await this.fieldCellWidgetInstance.start({
                    node: this.node,
                });

                const msg = testCase.validMsg;
                const msgPanel = this.node.querySelector('.' + messagePanelClass);
                expect(msgPanel.classList).toContain('hidden');
                await TestUtil.waitForElementChange(msgPanel, () => {
                    this.fieldCellWidgetInstance.bus.emit('validation', msg);
                });
                expect(msgPanel.classList).not.toContain('hidden');

                const msgText = msg.isValid ? msg.shortMessage : msg.errorMessage;
                expect(msgPanel.innerHTML).toContain(msgText);

                const container = this.node.querySelector('.' + cellClass);
                if (msg.isValid) {
                    expect(container.classList).not.toContain(cellErrorClass);
                } else {
                    expect(container.classList).toContain(cellErrorClass);
                }
            });
        });

        it('should not show a message with a valid input validation', async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            const msgPanel = this.node.querySelector('.' + messagePanelClass);
            const container = this.node.querySelector('.' + cellClass);

            expect(msgPanel.classList).toContain('hidden');
            expect(container.classList).not.toContain(cellErrorClass);
            await TestUtil.waitForElementChange(msgPanel, () => {
                this.fieldCellWidgetInstance.bus.emit('validation', { isValid: true });
            });
            expect(msgPanel.classList).toContain('hidden');
            expect(container.classList).not.toContain(cellErrorClass);
        });

        it('should not show an error if an invalid message does not contain an errorMessage field', async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            const msgPanel = this.node.querySelector('.' + messagePanelClass);
            const container = this.node.querySelector('.' + cellClass);
            await TestUtil.waitForElementChange(msgPanel, () => {
                this.fieldCellWidgetInstance.bus.emit('validation', {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                });
            });
            expect(msgPanel.classList).toContain('hidden');
            expect(container.classList).not.toContain(cellErrorClass);
        });

        it(`can show both validation and duplicate value errors, and remove them`, async function () {
            await this.fieldCellWidgetInstance.start({
                node: this.node,
            });
            const msgPanel = this.node.querySelector('.' + messagePanelClass);
            const dupPanel = this.node.querySelector('.' + duplicatePanelClass);
            const container = this.node.querySelector('.' + cellClass);
            expect(msgPanel.classList).toContain('hidden');
            expect(dupPanel.classList).toContain('hidden');
            expect(container.classList).not.toContain(cellErrorClass);

            this.fieldCellWidgetInstance.setDuplicateValue();
            expect(msgPanel.classList).toContain('hidden');
            expect(dupPanel.classList).not.toContain('hidden');
            expect(container.classList).toContain(cellErrorClass);

            await TestUtil.waitForElementChange(msgPanel, () => {
                this.fieldCellWidgetInstance.bus.emit('validation', {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'some invalid error',
                });
            });
            expect(msgPanel.classList).not.toContain('hidden');
            expect(dupPanel.classList).not.toContain('hidden');
            expect(container.classList).toContain(cellErrorClass);

            this.fieldCellWidgetInstance.clearDuplicateValue();
            expect(msgPanel.classList).not.toContain('hidden');
            expect(dupPanel.classList).toContain('hidden');
            expect(container.classList).toContain(cellErrorClass);

            await TestUtil.waitForElementChange(msgPanel, () => {
                this.fieldCellWidgetInstance.bus.emit('validation', { isValid: true });
            });
            expect(msgPanel.classList).toContain('hidden');
            expect(dupPanel.classList).toContain('hidden');
            expect(container.classList).not.toContain(cellErrorClass);
        });
    });
});
