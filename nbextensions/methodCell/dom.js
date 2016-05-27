/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html'
], function (html) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'),
        button = t('button');

    function factory(config) {
        var container = config.node,
            bus = config.bus;


        function getElement(names) {
            if (typeof names === 'string') {
                names = names.split('.');
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function getButton(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            var selector = names.map(function (name) {
                return '[data-button="' + name + '"]';
            }).join(' '),
                buttonNode = container.querySelector(selector);
            if (!buttonNode) {
                throw new Error('Button ' + names.join('/') + ' not found');
            }
            return buttonNode;
        }

        function getNode(names) {
            if (!(names instanceof Array)) {
                names = [names];
            }
            var selector = names.map(function (dataSelector) {
                return '[data-' + dataSelector.type + '="' + dataSelector.name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function confirmDialog(prompt) {
            return window.confirm(prompt);
        }

        function addButtonClickEvent(events, eventName) {
            return events.addEvent({
                type: 'click',
                handler: function () {
                    bus.send({type: eventName});
                }
            });
        }

        function makeButton(label, name, options) {
            var klass = options.type || 'default',
                events = options.events;
            return button({
                type: 'button',
                class: ['btn', 'btn-' + klass].join(' '),
                dataButton: name,
                id: addButtonClickEvent(events, name)
            }, label);
        }

        function enableButton(name) {
            getButton(name).classList.remove('disabled');
        }

        function disableButton(name) {
            getButton(name).classList.add('disabled');
        }

        function setButtonLabel(name, label) {
            getButton(name).innerHTML = label;
        }

        function ensureOriginalDisplayStyle(el) {
            if (el.getAttribute('data-original-display-style') === null) {
                el.setAttribute('data-original-display-style', el.style.display);
            }
        }

        function hideElement(name) {
            var el = getElement(name);
            ensureOriginalDisplayStyle(el);
            el.style.display = 'none';
        }

        function showElement(name) {
            var el = getElement(name),
                original = el.getAttribute('data-original-display-style');
            el.style.display = original;
        }

        function makePanel(title, elementName) {
            return  div({class: 'panel panel-primary'}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, title)
                ]),
                div({class: 'panel-body'}, [
                    div({dataElement: elementName, class: 'container-fluid'})
                ])
            ]);
        }

        function buildPanel(args) {
            var style = {}, type = args.type || 'primary';
            if (args.hidden) {
                style.display = 'none';
            }
            return  div({class: 'panel panel-' + type, dataElement: args.name, style: style}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, args.title)
                ]),
                div({class: 'panel-body'}, [
                    args.body
                ])
            ]);
        }

        function makeCollapsiblePanel(title, elementName) {
            var collapseId = html.genId();

            return div({class: 'panel panel-default'}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, span({
                        class: 'collapsed',
                        dataToggle: 'collapse',
                        dataTarget: '#' + collapseId,
                        style: {cursor: 'pointer'}
                    },
                        title
                        ))
                ]),
                div({id: collapseId, class: 'panel-collapse collapse'},
                    div({class: 'panel-body'}, [
                        div({dataElement: elementName, class: 'container-fluid'})
                    ])
                    )
            ]);
        }

        function buildCollapsiblePanel(args) {
            var collapseId = html.genId(),
                style = {}, type = args.type || 'primary';
            if (args.hidden) {
                style.display = 'none';
            }

            return div({class: 'panel panel-' + type, dataElement: args.name, style: style}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, span({
                        class: 'collapsed',
                        dataToggle: 'collapse',
                        dataTarget: '#' + collapseId,
                        style: {cursor: 'pointer'}
                    },
                        args.title
                        ))
                ]),
                div({id: collapseId, class: 'panel-collapse collapse'},
                    div({class: 'panel-body'}, [
                        args.body
                    ])
                    )
            ]);
        }

        function createNode(markup) {
            var node = document.createElement('div');
            node.innerHTML = markup;
            return node.firstChild;
        }

        function setContent(path, content) {
            var node = getElement(path);
            if (node) {
                node.innerHTML = content;
            }
        }
        
        function na() {
            return span({style: {fontStyle: 'italic', color: 'orange'}}, 'NA');
        }

        return {
            getElement: getElement,
            getButton: getButton,
            getNode: getNode,
            makeButton: makeButton,
            enableButton: enableButton,
            disableButton: disableButton,
            setButtonLabel: setButtonLabel,
            confirmDialog: confirmDialog,
            hideElement: hideElement,
            showElement: showElement,
            makePanel: makePanel,
            buildPanel: buildPanel,
            makeCollapsiblePanel: makeCollapsiblePanel,
            buildCollapsiblePanel: buildCollapsiblePanel,
            createNode: createNode,
            setContent: setContent,
            na: na
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});