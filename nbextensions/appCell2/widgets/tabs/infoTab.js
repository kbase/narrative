/*global define*/ // eslint-disable-line no-redeclare
define([
    'bluebird',
    'common/format',
    'common/utils',
], function(
    Promise,
    format,
    utils
) {
    'use strict';

    let toBoolean = utils.toBoolean;

    let DOMTagA = function(innerHTML, options) {
        let tag = document.createElement('a');
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

    let DOMTagLI = function (innerHTML) {
        let item = document.createElement('li');
        item.innerHTML = innerHTML;
        return item;
    };

    let appendChildren = function(node, children) {
        children.forEach(function(child) { node.appendChild(child); });
    };

    let listLinks = function(links) {
        let out = [];
        let separator = document.createTextNode(', ');
        let conjunction = document.createTextNode(' and ');
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
        let model = config.model;

        function start(arg) {
            let appSpec = model.getItem('app.spec');
            let appRef = [
                appSpec.info.id,
                model.getItem('app').tag
            ].filter(toBoolean).join('/');

            // DESCRIPTION
            let description = document.createTextNode(appSpec.info.subtitle);

            // AVERAGE RUNTIME
            let executionStats = model.getItem('executionStats');
            let avgRuntime = format.niceDuration(1000*(
                executionStats.total_exec_time/executionStats.number_of_calls
            ));
            let runtimeAvgListItem = DOMTagLI(
                `The average execution time for this app is ${avgRuntime}.`
            );

            // LIST OF PARAMETERS
            let parametersList = document.createElement('ul');
            appSpec.parameters.forEach(function(param) {
                let types = [];
                let textOptions = param.text_options;
                if(textOptions && Array.isArray(textOptions.valid_ws_types)) {
                    let typesArray = (textOptions.valid_ws_types
                        .map(function(type) {
                            let linkType = DOMTagA(type, {
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
                let li = document.createElement('li');
                li.appendChild(document.createTextNode(param.ui_name));
                if(types.length) {
                    li.appendChild(document.createTextNode(': '));
                }
                appendChildren(li, types);
                parametersList.appendChild(li);
            });
            let parametersListItem = document.createElement('li');
            parametersListItem.appendChild(document.createTextNode(
                'Parameters: '
            ));
            parametersListItem.appendChild(parametersList);

            // AUTHORS/OWNERS
            let authors = appSpec.info.authors;
            let authorsListItem = document.createTextNode('');
            if(authors.length) {
                let authorsArray = authors.map(function(author) {
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
            let versionListItem = DOMTagLI(`Version: ${appSpec.info.ver}`);

            // CATALOG LINK
            let linkCatalog = DOMTagA(
                'View in App Catalog',
                { href: '/#appcatalog/app/' + appRef, target: '_blank' }
            );
            let linkCatalogListItem = document.createElement('li');
            linkCatalogListItem.appendChild(linkCatalog);

            // Assemble list items
            let listItems = [
                runtimeAvgListItem,
                parametersListItem,
                authorsListItem,
                versionListItem,
                linkCatalogListItem,
            ];

            // Populate info tab
            arg.node.appendChild(description);
            let infoList = document.createElement('ul');
            appendChildren(infoList, listItems);
            arg.node.appendChild(infoList);
            return Promise.resolve(arg.node);
        }

        function stop() {
            return Promise.resolve();
        }

        return {
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

