/*global define*/ // eslint-disable-line no-redeclare
define([
    'common/format',
    'common/utils',
], function(
    format,
    utils
) {
    'use strict';

    const toBoolean = utils.toBoolean;

    const DOMTagA = function(innerHTML, options) {
        const tag = document.createElement('a');
        if(options) {
            if(options.class) {
                tag.classList = options.class.split(' ');
            }
            tag.href = options.href;
            tag.target = options.target;
        }
        tag.innerHTML = innerHTML;
        return tag;
    };

    const DOMTagLI = function (innerHTML) {
        const item = document.createElement('li');
        item.innerHTML = innerHTML;
        return item;
    };

    const appendChildren = function(node, children) {
        children.forEach(function(child) { node.appendChild(child); });
    };

    const listLinks = function(links) {
        const out = [];
        const separator = document.createTextNode(', ');
        const conjunction = document.createTextNode(' and ');
        links.forEach(function(link, ix) {
            out.push(link);
            if(ix < links.length - 2) {
                out.push(separator.cloneNode());
            } else if (ix === links.length - 2) {
                out.push(conjunction);
            }
        });
        return out;
    };

    function factory(config) {
        const model = config.model;

        function start(arg) {
            const appSpec = model.getItem('app.spec');
            const appRef = [
                appSpec.info.id,
                model.getItem('app').tag
            ].filter(toBoolean).join('/');

            const methodFullInfo = appSpec.full_info;

            // DESCRIPTION
            const description = document.createElement('div');
            description.innerHTML = methodFullInfo.description;

            // RUN COUNT AND AVERAGE RUNTIME
            const execStats = model.getItem('executionStats');
            let avgRuntime;
            if( execStats
                && execStats.total_exec_time
                && execStats.number_of_calls > 0
            ) {
                avgRuntime = format.niceDuration(1000*(
                    execStats.total_exec_time/execStats.number_of_calls
                ));
            }
            let runtimeAvgListItem = document.createTextNode('');
            if(avgRuntime) {
                runtimeAvgListItem = DOMTagLI(''
                    + `This app has been run ${execStats.number_of_calls}`
                    + ` times and its average execution time is ${avgRuntime}.`
                );
            }

            // LIST OF PARAMETERS
            const parametersList = document.createElement('ul');
            appSpec.parameters.forEach(function(param) {
                const textOptions = param.text_options;
                let types = [];
                if(textOptions && Array.isArray(textOptions.valid_ws_types)) {
                    const typesArray = (textOptions.valid_ws_types
                        .map(function(type) {
                            const linkType = DOMTagA(type, {
                                class: 'cm-em',
                                href: '/#spec/type/' + type,
                                target: '_blank'
                            });
                            return linkType;
                        })
                    );
                    if(typesArray.length) {
                        types = listLinks(typesArray);
                    }
                }
                const li = document.createElement('li');
                const paramUIName = document.createElement('span');
                paramUIName.innerHTML = param.ui_name;
                li.appendChild(paramUIName);
                if(types.length) {
                    li.appendChild(document.createTextNode(': '));
                }
                appendChildren(li, types);
                parametersList.appendChild(li);
            });
            const parametersListItem = document.createElement('li');
            parametersListItem.appendChild(document.createTextNode(
                'Parameters: '
            ));
            parametersListItem.appendChild(parametersList);

            // AUTHORS/OWNERS
            const authors = appSpec.info.authors;
            let authorsListItem = document.createTextNode('');
            if(authors.length) {
                const authorsArray = authors.map(function(author) {
                    return DOMTagA(author, {
                        href: '/#people/' + author,
                        target: '_blank'
                    });
                });
                authorsListItem = document.createElement('li');
                authorsListItem.appendChild(document.createTextNode(
                    'Authors: '
                ));
                appendChildren(authorsListItem, listLinks(authorsArray));
            }

            // VERSION
            const versionListItem = DOMTagLI(`Version: ${appSpec.info.ver}`);

            // CATALOG LINK
            const linkCatalog = DOMTagA(
                'View Full Documentation',
                { href: '/#appcatalog/app/' + appRef, target: '_blank' }
            );
            const linkCatalogListItem = document.createElement('li');
            linkCatalogListItem.appendChild(linkCatalog);

            // Assemble list items
            const listItems = [
                runtimeAvgListItem,
                parametersListItem,
                authorsListItem,
                versionListItem,
                linkCatalogListItem,
            ];

            // Populate info tab
            arg.node.appendChild(description);
            const infoList = document.createElement('ul');
            appendChildren(infoList, listItems);
            arg.node.appendChild(infoList);
            return Promise.resolve(arg.node);
        }

        function stop() {
            return Promise.resolve();
        }

        return {
            hide: () => {},
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});

