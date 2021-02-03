define(['bluebird', 'uuid', 'common/ui', 'common/html'], (Promise, Uuid, UI, html) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        pre = t('pre'),
        ul = t('ul'),
        li = t('li'),
        span = t('span'),
        cssBaseClass = 'kb-error-display',
        defaultAdvice = 'If the app fails consistently, please contact us at ' +
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
        const errorObject = Object.assign(
            defaultError(),
            inputErrorObject
        );

        const uniqueID = html.genId();
        const elements = [
            div({
                class: `${cssBaseClass}__summary`,
            },
                [
                    span({
                        class: `${cssBaseClass}__type`,
                    }, [errorObject.type]),
                    ': ',
                    span({
                        class: `${cssBaseClass}__message`,
                    }, [errorObject.message]),
                ]
            ),

            div({
                class: `${cssBaseClass}__advice`,
            }, [errorObject.advice]),

            errorObject.detail
            ?   div({
                class: `${cssBaseClass}__detail_container`,
            }, [
                div({
                    class: `${cssBaseClass}__detail_title`,
                }, ['Details']),
                div({
                    class: `${cssBaseClass}__detail_text`,
                }, [errorObject.detail]),
            ])
            : '',

            errorObject.stacktrace
            ?   div({
                class: `${cssBaseClass}__stacktrace_container`,
            }, [
                div({
                    class: `${cssBaseClass}__stacktrace_title collapsed`,
                    role: 'button',
                    dataToggle: "collapse",
                    dataTarget: '#' + uniqueID,
                    ariaExpanded: "false",
                    ariaControls: uniqueID,

                }, [
                    span({}, ['Error stacktrace']),
                ]),
                pre({
                    class: `${cssBaseClass}__stacktrace_code collapse`,
                    id: uniqueID,
                }, [errorObject.stacktrace]),
            ])
            : ''

        ];
        return elements.join('\n');
    }

    function convertUnknownError(rawError) {
        rawError.errorDisplayId = new Uuid(4).format();
        console.error(rawError);
        rawError.message = `Unknown error: check console for error with errorDisplayId ${rawError.errorDisplayId}.`;
        return rawError;
    }

    function convertJobError(rawError) {
        const errorObj = {
            location: 'job execution',
        };

        if (rawError.error) {
            // Classic KBase RPC error message
            errorObj.type = rawError.name;
            errorObj.message = rawError.message;
            errorObj.stacktrace = rawError.error;
            errorObj.detail = null;
        } else if (rawError.name) {
            errorObj.type = rawError.name;
            errorObj.message =  'Error code: ' + String(rawError.code);
            errorObj.detail = 'This error occurred during execution of the app job.';
        }

        if (!errorObj.message) {
            rawError.location = 'job execution';
            return convertUnknownError(rawError);
        }

        return errorObj;
    }

    function convertInternalError(rawError) {
        return Object.assign(
            defaultError(),
            {
                location: 'app cell',
                type: rawError.title,
                message: rawError.message,
                advice: ul(
                    {   class: `${cssBaseClass}__advice_list`,
                    },
                    rawError.advice.map((adv) => {
                        return li({
                            class: `${cssBaseClass}__advice_list_item`,
                        },
                            adv
                        );
                    })
                ),
                detail: rawError.detail,
            }
        );
    }

    function factory(config) {
        // unless config is an object with a 'model' attribute,
        // which has functions 'getItem' and 'hasItem',
        // throw an error
        if (!(config
            && typeof config === 'object'
            && Object.prototype.hasOwnProperty.call(config, 'model')
            && Object.prototype.hasOwnProperty.call(config.model, 'getItem')
            && Object.prototype.hasOwnProperty.call(config.model, 'hasItem'))) {
            throw new Error(`Invalid input for the ErrorDisplay module: ${ JSON.stringify(config) }`);
        }

        const { model } = config;
        let container;

        function start(arg) {
            return Promise.try(() => {
                container = arg.node;
                container.classList.add(`${cssBaseClass}__container`);
                let errorObject;

                if (model.hasItem('exec.jobState.error')) {
                    errorObject = convertJobError(model.getItem('exec.jobState.error'));
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
