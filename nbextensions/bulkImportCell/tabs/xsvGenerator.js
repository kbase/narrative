define(['StagingServiceClient', 'common/html', 'common/runtime', 'common/ui', 'util/string'], (
    StagingServiceClient,
    html,
    Runtime,
    UI,
    String
) => {
    'use strict';
    const div = html.tag('div'),
        p = html.tag('p'),
        aTag = html.tag('a'),
        ul = html.tag('ul'),
        li = html.tag('li'),
        select = html.tag('select'),
        option = html.tag('option'),
        input = html.tag('input'),
        label = html.tag('label'),
        fieldset = html.tag('fieldset'),
        cssBaseClass = 'kb-xsv-gen';

    const DOCS_LINK = 'https://docs.kbase.us/data/upload-download-guide/csv';

    const formConfig = {
        layout: [
            'types', // multiple choice
            'output_file_type', // CSV / TSV / EXCEL
            'output_directory', // file path
        ],
        specs: {
            types: {
                original: {
                    advanced: 0,
                    allow_multiple: 1,
                    default_values: [
                        '', // current type
                    ],
                    description: 'File types to generate templates for',
                    disabled: 0,
                    dropdown_options: {
                        multiselection: 1,
                        options: [
                            // map file type to display name
                        ],
                    },
                    field_type: 'dropdown',
                    id: 'types',
                    optional: 0,
                    short_hint: 'File types to generate templates for',
                    ui_class: 'parameter',
                    ui_name: 'Import types(s)',
                },
                _position: 1,
            },
            output_file_type: {
                original: {
                    advanced: 0,
                    allow_multiple: 0,
                    default_values: ['CSV'],
                    description: 'Format for the output file',
                    disabled: 0,
                    dropdown_options: {
                        multiselection: 1,
                        options: [
                            {
                                display: 'Comma-separated (CSV)',
                                value: 'CSV',
                            },
                            {
                                display: 'Tab-separated (TSV)',
                                value: 'TSV',
                            },
                            {
                                display: 'Excel (XLSX)',
                                value: 'EXCEL',
                            },
                        ],
                    },
                    field_type: 'dropdown',
                    id: 'output_file_type',
                    optional: 0,
                    short_hint: 'Format for the output file',
                    ui_class: 'parameter',
                    ui_name: 'Output file type',
                },
                _position: 1,
            },
            output_directory: {
                original: {
                    advanced: 0,
                    allow_multiple: 0,
                    default_values: [''],
                    description: 'Directory where template files will be created',
                    disabled: 0,
                    field_type: 'text',
                    id: 'output_directory',
                    optional: 0,
                    short_hint: 'Directory where template files will be created',
                    text_options: {
                        is_output_name: 1,
                        placeholder: 'bulk_import_templates',
                        regex_constraint: [],
                        valid_ws_types: [],
                    },
                    ui_class: 'output',
                    ui_name: 'Destination directory',
                },
                _position: 3,
            },
        },
    };

    /**
     * This widget allows the user to generate a downloadable template suitable for using
     * with the xSV bulk import interface.
     *
     * @param {object} options has keys:
     *     model: cell metadata
     *     typesToFiles: mapping of data types to app IDs
     * @returns
     */
    class XSVGenerator {
        /**
         *
         * @param {object} options configuration options, including
         *      model           object  cell metadata in one handy Props object
         *      typesToFiles    object  mapping of the data types to app IDs
         */
        constructor(options) {
            this._init(options);
        }

        _init(options) {
            ['model', 'typesToFiles', 'fileTypeMapping'].forEach((prop) => {
                if (!options || !options[prop]) {
                    throw new Error(`XSV Generator requires the param "${prop}" for instantiation`);
                }
                this[prop] = options[prop];
            });
            this.runtime = Runtime.make();
            this.cssBaseClass = cssBaseClass;
        }

        async run() {
            const body = this.renderLayout();
            const modalArgs = {
                title: 'Create CSV Template',
                body,
                okLabel: 'Generate template!',
                doThisFirst: (mdn) => {
                    const submit = mdn.querySelector('[data-element="ok"]');
                    // TODO: the form should monitor its state of validity and
                    // only allow the query to be submitted when the form is valid
                    submit.addEventListener('click', this.runRequest.bind(this));
                },
            };
            await UI.showConfirmDialog(modalArgs);
        }

        runRequest() {
            const form = document.querySelector('#' + this.id);
            const params = ['output_directory', 'output_file_type', 'types'];
            const formValues = {};

            // TODO: validate the form params
            params.forEach((param) => {
                const formEl = form.querySelector(`[name="${param}"]`);
                if (formEl) {
                    if (param === 'types') {
                        formValues[param] = Array.from(formEl.selectedOptions).map((x) => x.value);
                    } else {
                        formValues[param] = formEl.value;
                    }
                }
            });

            // generate the request params to send to the staging service
            // and send the request
            this.sendRequest(this.generateRequest(formValues)).then(
                // promise resolved
                (data) => {
                    // display the results
                    this.displayResult(data);
                },
                // promise rejected
                (jqXHR, _textStatus, errorThrown) => {
                    console.error(errorThrown);
                    let error;
                    if (jqXHR.responseJSON) {
                        error = jqXHR.responseJSON;
                    } else {
                        error = `${errorThrown} - ${jqXHR.responseText}`;
                    }
                    this.displayResult({ error });
                }
            );
        }

        /**
         * Generate the layout for the initial dialog box
         *
         * @returns {string} string of HTML to use as the body of the dialog box
         */
        renderLayout() {
            const state = this.model.getItem('state');
            let errorMessage;
            const hasErrors = Object.values(state.params).some((val) => val !== 'complete');
            if (hasErrors) {
                errorMessage =
                    'Please note that there are errors in the input parameters for the selected data types, and that data upload will fail if the template is used unaltered.';
            }
            return div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div(
                        {
                            class: `${cssBaseClass}__container--errors`,
                        },
                        errorMessage ? p(errorMessage) : null
                    ),
                    this.createForm(),
                    p(
                        {
                            class: `${cssBaseClass}__help`,
                        },
                        aTag(
                            {
                                href: DOCS_LINK,
                                target: '_blank',
                            },
                            'Help and documentation on using templates'
                        )
                    ),
                ]
            );
        }

        /**
         * Generate the appropriate form for creating template downloads
         *
         * @returns {string} HTML string containing the form
         */
        createForm() {
            this.id = html.genId();
            const typeArray = Object.keys(this.model.getItem('params'));
            const state = this.model.getItem('state');

            return div(
                {
                    id: this.id,
                },
                [
                    // input file types
                    fieldset([
                        p(
                            label(
                                {
                                    for: formConfig.specs.types.original.id,
                                },
                                formConfig.specs.types.original.ui_name +
                                    ' (select all appropriate)'
                            )
                        ),
                        select(
                            {
                                id: formConfig.specs.types.original.id,
                                name: formConfig.specs.types.original.id,
                                // er...
                                multiple: 'multiple',
                                required: 'required',
                            },
                            typeArray.sort().map((opt) => {
                                if (state.selectedFileType === opt) {
                                    return option(
                                        {
                                            value: opt,
                                            selected: 'selected',
                                        },
                                        this.fileTypeMapping[opt]
                                    );
                                }
                                return option(
                                    {
                                        value: opt,
                                    },
                                    this.fileTypeMapping[opt]
                                );
                            })
                        ),
                    ]),

                    // output_file_types
                    fieldset([
                        p(
                            label(
                                {
                                    for: formConfig.specs.output_file_type.original.id,
                                },
                                formConfig.specs.output_file_type.original.ui_name
                            )
                        ),
                        select(
                            {
                                id: formConfig.specs.output_file_type.original.id,
                                name: formConfig.specs.output_file_type.original.id,
                            },
                            formConfig.specs.output_file_type.original.dropdown_options.options.map(
                                (opt) => {
                                    if (
                                        formConfig.specs.output_file_type.original
                                            .default_values[0] === opt.value
                                    ) {
                                        return option(
                                            {
                                                value: opt.value,
                                                selected: 'selected',
                                            },
                                            opt.display
                                        );
                                    }
                                    return option(
                                        {
                                            value: opt.value,
                                        },
                                        opt.display
                                    );
                                }
                            )
                        ),
                    ]),

                    // output file directory
                    fieldset([
                        p(
                            `<label for="${formConfig.specs.output_directory.original.id}">${formConfig.specs.output_directory.original.ui_name}</label>`
                        ),
                        input(
                            {
                                id: formConfig.specs.output_directory.original.id,
                                type: 'text',
                                name: formConfig.specs.output_directory.original.id,
                                placeholder:
                                    formConfig.specs.output_directory.original.text_options
                                        .placeholder,
                                value: formConfig.specs.output_directory.original.text_options
                                    .placeholder,
                                minlength: 1,
                                required: true,
                            },
                            ''
                        ),
                    ]),
                ]
            );
        }

        /**
         *  Coerce the form and file upload params into the appropriate format
         *  for the staging service endpoint
         *
         * @param {object} formParams validated parameters from the form with keys
         *      output_file_type: format to output the file in
         *      output_directory: where to save the file
         *      types: validated array of input types to include in the request
         * @returns {object} output, suitable for sending to the staging service endpoint
         */
        generateRequest(formParams) {
            const { output_file_type, output_directory, types } = formParams;

            const params = this.model.getItem('params'),
                appSpecs = this.model.getItem('app.specs'),
                output = {
                    output_directory,
                    output_file_type,
                    types: {},
                };

            types.forEach((fileType) => {
                const appId = this.typesToFiles[fileType].appId;
                output.types[fileType] = {
                    order_and_display: appSpecs[appId].parameters.map((param) => {
                        return [param.id, param.ui_name];
                    }),
                    data: params[fileType].filePaths.map((element) => {
                        const datum = JSON.parse(JSON.stringify(element));
                        Object.keys(params[fileType].params).forEach((param) => {
                            datum[param] = params[fileType].params[param];
                        });
                        return datum;
                    }),
                };
            });
            return output;
        }

        /**
         * Send the request to the staging service client
         * @param {object} requestParams the body for the request
         * @returns jQuery.ajax
         */
        sendRequest(requestParams) {
            if (!this.stagingServiceClient) {
                this.stagingServiceClient = new StagingServiceClient({
                    root: this.runtime.config('services.staging_api_url.url'),
                    token: this.runtime.authToken(),
                });
            }
            return this.stagingServiceClient.write_bulk_specification({
                data: requestParams,
                dataType: 'json',
                headers: { 'Content-Type': 'application/json' },
            });
        }

        /**
         *  Display the results of the query to generate the template
         *
         * @param {object} resp response from the staging service endpoint
         */
        displayResult(resp) {
            if (resp.error || !resp.files_created || !Object.keys(resp.files_created).length) {
                const errorString = resp.error
                    ? String.escape(resp.error)
                    : 'No files were created.';

                return UI.showInfoDialog({
                    title: 'Template Generation Error',
                    body: div(
                        {
                            class: `${cssBaseClass}__result--error`,
                        },
                        [
                            p('Template generation failed with the following error:'),
                            p(errorString),
                            p('Oh shit!'),
                        ]
                    ),
                    okLabel: 'OK',
                    bsClass: 'danger',
                });
            }

            const newFiles = new Set(Object.values(resp.files_created));
            const s_have = newFiles.size === 1 ? ' has' : 's have';
            const body = div(
                {
                    class: `${cssBaseClass}__result--success`,
                },
                [
                    p(
                        {
                            class: `${cssBaseClass}__result_text`,
                        },
                        `The following file${s_have} been added to the staging area:`
                    ),
                    ul(
                        {
                            class: `${cssBaseClass}__file_list`,
                        },
                        Array.from(newFiles)
                            .sort()
                            .map((file) => {
                                return li(
                                    {
                                        class: `${cssBaseClass}__file_list_item`,
                                    },
                                    String.escape(file)
                                );
                            })
                    ),
                ]
            );

            return UI.showInfoDialog({
                title: 'Template Generation Successful!',
                body,
                bsClass: 'success',
            });
        }
    }

    return XSVGenerator;
});
