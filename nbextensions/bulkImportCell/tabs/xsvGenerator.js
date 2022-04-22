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
        ul = html.tag('ul'),
        li = html.tag('li'),
        cssBaseClass = 'kb-xsv-gen';

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
            ['model', 'typesToFiles'].forEach((prop) => {
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
            const confirmed = await UI.showConfirmDialog({
                title: 'Create CSV Template',
                body,
                okLabel: 'Create Template',
            });
            // return if the user clicks 'cancel'
            if (!confirmed) {
                return;
            }

            // TODO:
            // validate the form params
            const formValues = {
                output_directory: 'some_string',
                output_file_type: 'CSV',
                types: ['sra_reads'],
            };
            // generate the request params to send to the staging service
            // send the request
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
            this.id = html.genId();

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
                    // TODO: add form in here!
                    p('Import types'),
                    p('Output file type'),
                    p('Destination directory'),
                    div({
                        id: this.id,
                    }),
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

            const s_have = Object.keys(resp.files_created).length === 1 ? ' has' : 's have';
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
                        Object.values(resp.files_created)
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
