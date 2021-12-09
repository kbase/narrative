define(['common/format', 'common/html', 'util/string'], (format, html, string) => {
    'use strict';

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
            if (textOptions && Array.isArray(textOptions.valid_ws_types)) {
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
                span({}, param.ui_name) + (types ? ': ' + types : '')
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
            let avgRuntime, runtimeInfo;
            if (execStats && execStats.total_exec_time && execStats.number_of_calls > 0) {
                avgRuntime = format.niceDuration(
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

            const infoContainer = div(
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
                        fullInfo.description && fullInfo.description.length
                            ? fullInfo.description
                            : 'No description specified'
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
            containerNode.innerHTML = infoContainer;
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
