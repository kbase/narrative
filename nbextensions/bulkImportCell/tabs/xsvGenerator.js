define([
    'jquery',
    'bluebird',
    'StagingServiceClient',
    'common/cellComponents/paramsWidget',
    'common/html',
    'common/runtime',
    'common/props',
    'common/spec',
    'common/ui',
    'util/string',
], ($, Promise, StagingServiceClient, ParamsWidget, html, Runtime, Props, Spec, UI, String) => {
    'use strict';
    const div = html.tag('div'),
        p = html.tag('p'),
        aTag = html.tag('a'),
        ul = html.tag('ul'),
        li = html.tag('li'),
        fieldset = html.tag('fieldset'),
        cssBaseClass = 'kb-xsv-gen';

    const DOCS_LINK = 'https://docs.kbase.us/data/upload-download-guide/bulk';

    const xsvAppSpec = {
        parameters: [
            {
                advanced: 0,
                allow_multiple: 0,
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
            {
                advanced: 0,
                allow_multiple: 0,
                default_values: ['CSV'],
                description: 'Format for the output file',
                disabled: 0,
                dropdown_options: {
                    multiselection: 0,
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
            {
                advanced: 0,
                allow_multiple: 0,
                default_values: ['bulk_import_templates'],
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
        ],
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

        _setUpModel() {
            // fill in the options for the types
            const typeArray = Object.keys(this.model.getItem('params'));
            xsvAppSpec.parameters[0].dropdown_options.options = typeArray.sort().map((opt) => {
                return {
                    display: this.fileTypeMapping[opt],
                    value: opt,
                };
            });
            xsvAppSpec.parameters[0].default_values = typeArray;
            this.xsvAppSpec = xsvAppSpec;
            this.spec = Spec.make({ appSpec: this.xsvAppSpec });

            const internalModelContext = {
                app: {
                    spec: this.spec,
                },
                params: this.spec.makeDefaultedModel(),
                inputs: {
                    otherParamIds: this.xsvAppSpec.parameters.map((param) => {
                        return param.id;
                    }),
                },
            };

            // this is the model for the xsv template generator "app",
            // which will store the XSV form values and overall state
            this.internalModel = Props.make({
                data: internalModelContext,
            });
        }

        async run() {
            this._setUpModel();
            const body = this.renderLayout();
            this.startInputWidgets();
            const doThisFirst = function (mdn) {
                // attach the form widget to the UI modal
                mdn.querySelector('#' + this.id).appendChild(this.paramsNode);
                this.updateAppConfigState();
            };

            const modalArgs = {
                title: 'Create Import Specification Template',
                body,
                okLabel: 'Generate template!',
                doThisFirst: doThisFirst.bind(this),
                onConfirm: () => {
                    // generate the request params to send to the staging service
                    const formValues = this.internalModel.getItem(['params']);
                    return this.generateRequest(formValues);
                },
            };

            const resolution = await UI.showConfirmDialog(modalArgs);
            this.stopInputWidgets();
            if (resolution) {
                // if the "confirm" option was chosen, `resolution`
                // will be a data structure containing the request params
                this.runRequest(resolution);
            }
        }

        /**
         * Send the request to the staging service and display the result
         *
         * @param {object} requestParams - validated parameters
         */
        runRequest(requestParams) {
            this.sendRequest(requestParams).then(
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

            const typeArray = Object.keys(state.params);
            const multiFileInfo = p(
                'Choosing Excel as output file type will create a single file with ' +
                    'a page for each import type; CSV and TSV create one file per import type.'
            );

            const hasErrors = Object.values(state.params).some((val) => val !== 'complete');
            if (hasErrors) {
                errorMessage = div(
                    {
                        class: `${cssBaseClass}__container--errors alert alert-warning`,
                    },
                    p(
                        'Please note that there are errors in the input parameters for one or more ' +
                            'data types, and that data upload will fail if the template is used unaltered.'
                    )
                );
            }

            this.id = html.genId();
            return div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    errorMessage,
                    fieldset(
                        {
                            class: `${cssBaseClass}__paragraph--guide`,
                        },
                        [
                            p(
                                'Templates will be created in the specified destination directory in the staging area.'
                            ),
                            typeArray.length > 1 ? multiFileInfo : null,
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
                    ),
                    div({
                        id: this.id,
                    }),
                ]
            );
        }

        /**
         * This builds the parameters widget containing the inputs for the XSV form
         */
        startInputWidgets() {
            this.paramsNode = document.createElement('div');
            this.paramsBus = this.runtime
                .bus()
                .makeChannelBus({ description: 'Parent comm bus for parameters widget' });

            this.paramsBus.on('parameter-changed', (message) => {
                this.updateModelParameterValue(message);
            });

            this.paramsWidget = ParamsWidget.make({
                bus: this.paramsBus,
                workspaceId: this.runtime.workspaceId(),
                paramIds: this.internalModel.getItem(['inputs', 'otherParamIds']),
                initialParams: this.internalModel.getItem(['params']),
                initialDisplay: {},
            });

            return this.paramsWidget.start({
                node: this.paramsNode,
                parameters: this.spec.getSpec().parameters,
            });
        }

        stopInputWidgets() {
            if (this.paramsWidget) {
                return this.paramsWidget.stop();
            }
            return Promise.resolve();
        }

        /**
         * Updates the stored parameter value using the bus message passed by the input widget.
         *
         * This is followed by evaluating the state of all inputs to see if the form is valid
         * and ready for submission.
         *
         * @param {object} message - the bus message returned from the widget with a changed
         *  parameter value
         */
        updateModelParameterValue(message) {
            this.internalModel.setItem(['params', message.parameter], message.newValue);

            if (message.isError) {
                return;
            }

            return this.updateAppConfigState();
        }

        /**
         * Validates the current form values, updates the state of the form to either 'complete'
         * or 'incomplete', and sets the form submission button to disabled if the form is incomplete.
         */

        async updateAppConfigState() {
            const paramIds = this.internalModel.getItem(['inputs', 'otherParamIds']),
                paramValues = this.internalModel.getItem(['params']);
            const results = await this.spec.validateParams(paramIds, paramValues, {});
            const isValid = Object.values(results).every((param) => param.isValid);
            this.internalModel.setItem(['state', 'params'], isValid ? 'complete' : 'incomplete');
            const confirmButton = $(document.querySelector('#' + this.id)).nearest(
                '[data-element="ok"]'
            );
            confirmButton[0].disabled = !isValid;
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
                paramDisplay = this.model.getItem('paramDisplay'),
                appSpecs = this.model.getItem('app.specs'),
                output = {
                    output_directory,
                    output_file_type,
                    types: {},
                };

            types.forEach((fileType) => {
                const appId = this.typesToFiles[fileType].appId;
                const paramsToRemap = JSON.parse(JSON.stringify(params[fileType].params));
                output.types[fileType] = {
                    order_and_display: appSpecs[appId].parameters.map((param) => {
                        if (param.dropdown_options) {
                            if (paramsToRemap[param.id]) {
                                for (const opt of param.dropdown_options.options) {
                                    if (opt.value === paramsToRemap[param.id]) {
                                        paramsToRemap[param.id] = opt.display;
                                        break;
                                    }
                                }
                            }
                        } else if (paramDisplay[fileType]) {
                            // special display value from a dynamic dropdown
                            try {
                                const displayParam =
                                    paramDisplay[fileType].params[param.id][param.id];
                                paramsToRemap[param.id] = displayParam;
                            } catch (err) {
                                // ignore the error
                            }
                        }
                        return [param.id, param.ui_name];
                    }),
                    data: params[fileType].filePaths.map((element) => {
                        const datum = JSON.parse(JSON.stringify(element));
                        for (const param in paramsToRemap) {
                            datum[param] = paramsToRemap[param];
                        }
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
            if (!requestParams) {
                throw new Error('No request parameters specified!');
            }

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
                    p(
                        {
                            class: `${cssBaseClass}__result_text`,
                        },
                        'Import specification templates can be downloaded from the staging area and edited locally, and then re-uploaded and used for bulk import.'
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
