define(['bluebird', 'uuid', 'common/html'], (Promise, Uuid, html) => {
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

    function defaultError() {
        return {
            location: 'unknown',
            type: 'unknown',
            message: 'An unknown error was detected.',
            advice: defaultAdvice,
            detail: null,
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
                [errorObject.advice]
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
                                  dataTarget: `#${uniqueID}`,
                                  ariaExpanded: 'false',
                                  ariaControls: uniqueID,
                              },
                              [span({}, ['Error stacktrace'])]
                          ),
                          pre(
                              {
                                  class: `${cssBaseClass}__stacktrace_code collapse`,
                                  id: uniqueID,
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
        rawError.errorDisplayId = new Uuid(4).format();
        console.error(rawError);
        rawError.message = `Unknown error: check console for error with errorDisplayId ${rawError.errorDisplayId}.`;
        return rawError;
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
                errorObj.detail = null;
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

    function convertInternalError(rawError) {
        return Object.assign(defaultError(), {
            location: 'app cell',
            type: rawError.title,
            message: rawError.message,
            advice: ul(
                { class: `${cssBaseClass}__advice_list` },
                rawError.advice.map((adv) => {
                    return li(
                        {
                            class: `${cssBaseClass}__advice_list_item`,
                        },
                        adv
                    );
                })
            ),
            detail: rawError.detail,
        });
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
                container = arg.node;
                container.classList.add(`${cssBaseClass}__container`);
                let errorObject;

                if (
                    model.hasItem('exec.jobState.error') ||
                    model.hasItem('exec.jobState.errormsg')
                ) {
                    errorObject = convertJobError(model.getItem('exec.jobState'));
                } else if (model.hasItem('internalError')) {
                    errorObject = convertInternalError(model.getItem('internalError'));
                } else {
                    // unknown error format
                    errorObject = convertUnknownError(model.getRawObject());
                }

                container.innerHTML = renderErrorLayout(errorObject);
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
    };
});
