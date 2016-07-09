/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    './runtime'
], function (html, Runtime) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'),
        button = t('button');        

    function factory(config) {
        var container = config.node,
            bus = config.bus,
            runtime = Runtime.make();

        /*
         * Just a wrapper around querySelector
         */
        function getElement(names) {
            if (typeof names === 'string') {
                names = names.split('.');
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function getButton(name) {
            if (typeof name !== 'string') {
                // names = names.split('.');
                // TODO: support a path of elements up to the button.
                throw new Error('Currently only a single string supported to get a button');
            }
            var selector = '[data-button="' + name + '"]',
                buttonNode = container.querySelector(selector);
            
            if (!buttonNode) {
                throw new Error('Button ' + name + ' not found');
            }
            return buttonNode;
        }

        function getNode(names) {
            if (typeof names === 'string') {
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
                handler: function (e) {
                    bus.send({event: e}, {key: {type: eventName}});
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
        
        // Hmm, something like this, but need to think it through more.
//        function setButton(name, options) {            
//            var buttonNode = getButton(name);
//            if (options.label) {
//                buttonNode.innerHTML = options.label;
//            }
//            if (options.classes) {
//                // who no classList.empty()?
//                options.className = null;
//                options.classes.forEach(function (klass) {
//                    buttonNode.classList.add(klass);
//                });
//            }
//                
//        }

        function ensureOriginalDisplayStyle(el) {
            if (el.getAttribute('data-original-display-style') === null) {
                el.setAttribute('data-original-display-style', el.style.display);
            }
        }

        function hideElement(name) {
            var el = getElement(name);
            if (!el) {
                return;
            }
            //ensureOriginalDisplayStyle(el);
            //el.style.display = 'none';
            el.classList.add('hidden');
        }

        function showElement(name) {
            var el = getElement(name),
                original;
            if (!el) {
                return;
            }
            //original = el.getAttribute('data-original-display-style');
            //el.style.display = original;
            el.classList.remove('hidden');
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
            var type = args.type || 'primary',
                classes = ['panel', 'panel-' + type];
            if (args.hidden) {
                classes.push('hidden');
                // style.display = 'none';
            }
            return  div({class: classes.join(' '), dataElement: args.name}, [
                (function () { 
                    if (args.title) {
                        return div({class: 'panel-heading'}, [
                            div({class: 'panel-title'}, args.title)
                        ]);
                    }                    
                }()),
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
                type = args.type || 'primary',                
                classes = ['panel', 'panel-' + type],
                collapseClasses = ['panel-collapse collapse'],
                toggleClasses = [];
            if (args.hidden) {
                classes.push('hidden');
                // style.display = 'none';
            }
            if (!args.collapsed) {
                collapseClasses.push('in');
            } else {
                toggleClasses.push('collapsed');
            }

            return div({class: classes.join(' '), dataElement: args.name}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, span({
                        class: toggleClasses.join(' '),
                        dataToggle: 'collapse',
                        dataTarget: '#' + collapseId,
                        style: {cursor: 'pointer'}
                    },
                        args.title
                        ))
                ]),
                div({id: collapseId, class: collapseClasses.join(' ')},
                    div({class: 'panel-body'}, [
                        args.body
                    ])
                    )
            ]);
        }
        
        function collapsePanel(path) {
            var node = getElement(path);
            if (!node) {
                return;
            }
            var collapseToggle = node.querySelector('[data-toggle="collapse"]'),
                targetSelector = collapseToggle.getAttribute('data-target'),
                collapseTarget = node.querySelector(targetSelector);
            
            collapseToggle.classList.add('collapsed');
            collapseToggle.setAttribute('aria-expanded', 'false');
            collapseTarget.classList.remove('in');
            collapseTarget.setAttribute('aria-expanded', 'false');
        }
        function expandPanel(path) {
            var node = getElement(path);
            if (!node) {
                return;
            }
            var collapseToggle = node.querySelector('[data-toggle="collapse"]'),
                targetSelector = collapseToggle.getAttribute('data-target'),
                collapseTarget = node.querySelector(targetSelector);
            
            collapseToggle.classList.remove('collapsed');
            collapseToggle.setAttribute('aria-expanded', 'true');
            collapseTarget.classList.add('in');
            collapseTarget.setAttribute('aria-expanded', 'true');
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
        
        function ifAdvanced(fun) {
            if (runtime.config('features.advanced')) {
                return fun();
            }
        }

        function ifDeveloper(fun) {
            if (runtime.config('features.advanced')) {
                return fun();
            }
        }


        return {
            getElement: getElement,
            getButton: getButton,
            // setButton: setButton,
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
            collapsePanel: collapsePanel,
            expandPanel: expandPanel,
            createNode: createNode,
            setContent: setContent,
            na: na,
            ifAdvanced: ifAdvanced,
            ifDeveloper: ifDeveloper
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
