define(['bluebird', 'common/html'], (Promise, html) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        pre = t('pre'),
        ul = t('ul'),
        li = t('li'),
        span = t('span'),
        cssBaseClass = 'kb-error-display',
        defaultAdvice =
            'If the app fails consistently, please contact us at ' +
            '<a href="https://www.kbase.us/support">https://www.kbase.us/support</a>.';

    /**
     * Ingests the raw object from the model supplied when initialising the module, or
     * passed in directly. Note that jobState objects containing errors should be passed in
     * in the form `{ jobState: <jobStateObject> }` so that the function knows it is a
     * jobState without going through the hassle of creating a proper object system.
     *
     * @param {object} rawObject
     * @returns {object} normalised error object
     */

    function normaliseErrorObject(rawObject) {
        if (rawObject.exec && rawObject.exec.jobState) {
            rawObject = { jobState: rawObject.exec.jobState };
        }

        let errorObject;
        if (rawObject.jobState && (rawObject.jobState.error || rawObject.jobState.errormsg)) {
            errorObject = convertJobError(rawObject.jobState);
        } else if (rawObject.internalError) {
            errorObject = convertInternalError(rawObject.internalError);
        }

        if (!errorObject) {
            // unknown error format
            return convertUnknownError(rawObject);
        }
        return errorObject;
    }

    function defaultError() {
        return {
            location: 'unknown',
            type: 'unknown',
            message: 'An unknown error was detected.',
            advice: [defaultAdvice],
        };
    }

    function renderErrorLayout(inputErrorObject) {
        const errorObject = Object.assign(defaultError(), inputErrorObject);

        const uniqueID = html.genId();
        const elements = [
            div(
                {
                    class: `${cssBaseClass}__summary`,
                },
                [
                    span(
                        {
                            class: `${cssBaseClass}__type`,
                        },
                        [errorObject.type]
                    ),
                    ': ',
                    span(
                        {
                            class: `${cssBaseClass}__message`,
                        },
                        [errorObject.message]
                    ),
                ]
            ),

            div(
                {
                    class: `${cssBaseClass}__advice`,
                },
                ul(
                    { class: `${cssBaseClass}__advice_list` },
                    errorObject.advice.map((adv) => {
                        return li(
                            {
                                class: `${cssBaseClass}__advice_list_item`,
                            },
                            adv
                        );
                    })
                )
            ),

            errorObject.detail
                ? div(
                      {
                          class: `${cssBaseClass}__detail_container`,
                      },
                      [
                          div(
                              {
                                  class: `${cssBaseClass}__detail_title`,
                              },
                              ['Details']
                          ),
                          div(
                              {
                                  class: `${cssBaseClass}__detail_text`,
                              },
                              [errorObject.detail]
                          ),
                      ]
                  )
                : '',

            errorObject.errorDump
                ? div(
                      {
                          class: `${cssBaseClass}__error_dump_container`,
                      },
                      [
                          div(
                              {
                                  class: `${cssBaseClass}__error_dump_title collapsed`,
                                  role: 'button',
                                  dataToggle: 'collapse',
                                  dataTarget: `#${uniqueID}__dump`,
                                  ariaExpanded: 'false',
                                  ariaControls: `${uniqueID}__dump`,
                              },
                              [span({}, ['Raw error JSON'])]
                          ),
                          pre(
                              {
                                  class: `${cssBaseClass}__error_dump_code collapse`,
                                  id: `${uniqueID}__dump`,
                              },
                              [JSON.stringify(errorObject.errorDump, null, 1)]
                          ),
                      ]
                  )
                : '',

            errorObject.stacktrace
                ? div(
                      {
                          class: `${cssBaseClass}__stacktrace_container`,
                      },
                      [
                          div(
                              {
                                  class: `${cssBaseClass}__stacktrace_title collapsed`,
                                  role: 'button',
                                  dataToggle: 'collapse',
                                  dataTarget: `#${uniqueID}__trace`,
                                  ariaExpanded: 'false',
                                  ariaControls: `${uniqueID}__trace`,
                              },
                              [span({}, ['Error stacktrace'])]
                          ),
                          pre(
                              {
                                  class: `${cssBaseClass}__stacktrace_code collapse`,
                                  id: `${uniqueID}__trace`,
                              },
                              [errorObject.stacktrace]
                          ),
                      ]
                  )
                : '',
        ];
        return elements.join('\n');
    }

    function convertUnknownError(rawError) {
        return {
            type: 'Unknown error',
            message: 'error in unknown format',
            errorDump: rawError,
        };
    }

    function convertInternalError(rawError) {
        return Object.assign(defaultError(), {
            location: 'app cell',
            type: rawError.title,
            message: rawError.message,
            advice: rawError.advice,
            detail: rawError.detail,
        });
    }

    /**
     * Convert job execution errors for display in the UI. The errors are part of the jobState
     * object, and can be in several formats; see inline docs for info.
     *
     * @param   {object} jobState
     * @returns {object} normalised error object for the UI
     */
    function convertJobError(jobState) {
        const errorObj = {
            location: 'job execution',
            detail: 'This error occurred during execution of the app job.',
        };

        if (jobState.error) {
            if (jobState.error.error) {
                /** KBase RPC error message, in the format
                 * jobState.error = {
                 *      name: <error type>,
                 *      message: <error message>,
                 *      error: <stacktrace>
                 * }
                 */
                errorObj.type = jobState.error.name;
                errorObj.message = jobState.error.message;
                errorObj.stacktrace = jobState.error.error;
                delete errorObj.detail;
            } else if (jobState.error.name) {
                /**
                 * jobState.error = {
                 *      name: <error type>,
                 *      code: <error code>,
                 * }
                 */
                errorObj.type = jobState.error.name;
                errorObj.message = 'Error code: ' + String(jobState.error.code);
            }

            if (!errorObj.message) {
                jobState.error.location = 'job execution';

                return convertUnknownError(jobState.error);
            }
        } else if (jobState.errormsg) {
            /**
             * Error with no separate 'error' object; keys are part of the jobState object:
             *
             * jobState.error_code = <error code>
             * jobState.errormsg = <error message>
             */
            errorObj.message = jobState.errormsg;
            errorObj.type = 'Error code ' + String(jobState.error_code);
        }

        return errorObj;
    }

    function factory(config) {
        // unless config is an object with a 'model' attribute,
        // which has functions 'getItem' and 'hasItem',
        // throw an error
        if (
            !(
                config &&
                typeof config === 'object' &&
                Object.prototype.hasOwnProperty.call(config, 'model') &&
                Object.prototype.hasOwnProperty.call(config.model, 'getItem') &&
                Object.prototype.hasOwnProperty.call(config.model, 'hasItem')
            )
        ) {
            throw new Error(`Invalid input for the ErrorDisplay module: ${JSON.stringify(config)}`);
        }

        const { model } = config;
        let container;

        function start(arg) {
            return Promise.try(() => {
                const rawObject = model.getRawObject();
                container = arg.node;
                container.classList.add(`${cssBaseClass}__container`);
                container.innerHTML = renderErrorLayout(normaliseErrorObject(rawObject));
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
        defaultAdvice: defaultAdvice,
        cssBaseClass: cssBaseClass,
        normaliseErrorObject: normaliseErrorObject,
    };
});
