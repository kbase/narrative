define(['domPurify', 'common/format', 'common/html', 'util/string'], (
    DOMPurify,
    format,
    html,
    string
) => {
    // Note - would destructure in the arguments, but that would require a change to eslint rules.
    const { sanitize } = DOMPurify;

    const cssBaseClass = 'kb-info-tab',
        div = html.tag('div'),
        span = html.tag('span'),
        ul = html.tag('ul'),
        li = html.tag('li'),
        a = html.tag('a');

    function paramsList(appSpec) {
        if (!appSpec.parameters.length) {
            return div(
                {
                    class: `${cssBaseClass}__list--params`,
                },
                'No parameters specified'
            );
        }

        const parameterArray = appSpec.parameters.map((param) => {
            const textOptions = param.text_options;
            let types = null;
            if (
                textOptions &&
                Array.isArray(textOptions.valid_ws_types) &&
                textOptions.valid_ws_types.indexOf('*') === -1
            ) {
                const typesArray = textOptions.valid_ws_types.map((type) => {
                    return a(
                        {
                            class: `${cssBaseClass}__link--kb-type`,
                            href: `/#spec/type/${type}`,
                            target: '_blank',
                            title: `KBase type ${type}`,
                        },
                        type
                    );
                });
                if (typesArray.length) {
                    types = string.arrayToEnglish(typesArray);
                }
            }

            return li(
                {
                    class: `${cssBaseClass}__list_item--params`,
                },
                span(
                    {
                        class: `${cssBaseClass}__param--id`,
                    },
                    param.id
                ) +
                    span(
                        {
                            class: `${cssBaseClass}__param--ui-name`,
                        },
                        param.ui_name
                    ) +
                    (types ? ': ' + types : '')
            );
        });

        return ul(
            {
                class: `${cssBaseClass}__list--params`,
            },
            parameterArray
        );
    }

    function authorList(appSpec) {
        // AUTHORS/OWNERS
        const authors = appSpec.full_info.authors;
        if (!authors) {
            return undefined;
        }
        return string.arrayToEnglish(
            authors.map((author) => {
                return a(
                    {
                        class: `${cssBaseClass}__link--author`,
                        href: `/#people/${author}`,
                        target: '_blank',
                    },
                    author
                );
            })
        );
    }

    function factory(config) {
        const model = config.model;
        let containerNode;

        function start(arg) {
            let appSpec = model.getItem('app.spec'); // for plain app cell
            if (!appSpec && arg.currentApp) {
                appSpec = model.getItem(`app.specs.${arg.currentApp}`); // for bulk cells
            }

            containerNode = arg.node;
            const appTag = appSpec.full_info.tag || model.getItem('app.tag');
            const fullInfo = appSpec.full_info;
            const appRef = [fullInfo.id, appTag].filter((v) => !!v).join('/');
            const parameterList = paramsList(appSpec);
            const authors = authorList(appSpec);

            // run count and average runtime
            const execStats = model.getItem('executionStats');
            let runtimeInfo;
            if (execStats && execStats.total_exec_time && execStats.number_of_calls > 0) {
                const avgRuntime = format.niceDuration(
                    1000 * (execStats.total_exec_time / execStats.number_of_calls)
                );
                runtimeInfo = div(
                    {
                        class: `${cssBaseClass}__runstats`,
                    },
                    `This app has been run ${execStats.number_of_calls} times` +
                        ` and its average execution time is ${avgRuntime}.`
                );
            }

            /**
             * A self-executing function which, given a string which purports to be an app description, is
             * sanitized and repaired, if necessary.
             *
             * @param {string} descriptionText The description value for an app.
             *
             * @returns {string} The sanitized and possibly fixed description
             */
            const description = ((descriptionText) => {
                if (!descriptionText) {
                    return 'No description specified';
                }

                /**
                 * "Fixes" the given node by recursively visiting it and all its children and applying fixes.
                 *
                 * At present, the fixes include:
                 * - for the app info description:
                 *  - replace the old data upload/download guide link with the current one
                 *  - ensure that all KBase doc links open in a new window/tab
                 *
                 * @param {Node} node A DOM node
                 * @returns {string} the input node, with fixes applied.
                 */
                const fix = (node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'A') {
                            // Fix the broken link for the Upload/Download Guide
                            if (
                                node
                                    .getAttribute('href')
                                    .match(/http[:]\/\/kbase.us\/data-upload-download-guide/)
                            ) {
                                node.setAttribute(
                                    'href',
                                    'https://docs.kbase.us/data/upload-download-guide'
                                );
                            }
                            // Ensure all docs links open into a new window (or tab).
                            if (node.getAttribute('href').match(/https:\/\/docs.kbase.us/)) {
                                node.setAttribute('target', '_blank');
                            }
                        }
                    }

                    if (node.hasChildNodes()) {
                        for (const child of node.childNodes) {
                            fix(child);
                        }
                    }
                    return node;
                };

                try {
                    const node = document.createElement('div');
                    node.innerHTML = sanitize(descriptionText);
                    // After sanitization and fixing, we want the raw html string back.
                    return fix(node).innerHTML;
                } catch (ex) {
                    console.error(
                        'Error in app description - probably invalid HTML',
                        ex.message,
                        ex
                    );
                    return '<div class="alert alert-danger">Error in app description</div>';
                }
            })(fullInfo.description);

            containerNode.innerHTML = div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div(
                        {
                            class: `${cssBaseClass}__title`,
                        },
                        [
                            span(
                                {
                                    class: `${cssBaseClass}__name`,
                                },
                                fullInfo.name
                            ),
                            span(
                                {
                                    class: `${cssBaseClass}__version`,
                                    title: `App version v${fullInfo.ver}`,
                                },
                                `v${fullInfo.ver}`
                            ),
                            appTag
                                ? span(
                                      {
                                          class: `${cssBaseClass}__tag label label-primary`,
                                          title: `${appTag} version of the app`,
                                      },
                                      appTag
                                  )
                                : '',
                        ]
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__authors`,
                        },
                        authors ? `by ${authors}` : 'No authors specified'
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__description`,
                        },
                        description
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__link--docs`,
                        },
                        a(
                            {
                                href: `/#appcatalog/app/${appRef}`,
                                target: '_blank',
                            },
                            'View full documentation'
                        )
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__list_title--params`,
                        },
                        'Parameters'
                    ),
                    parameterList,
                    runtimeInfo,
                ]
            );
            return Promise.resolve(containerNode);
        }

        function stop() {
            containerNode.innerHTML = '';
            return Promise.resolve();
        }

        return {
            hide: () => {
                /* no op */
            },
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
        cssBaseClass,
    };
});
