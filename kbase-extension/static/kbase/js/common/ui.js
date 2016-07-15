/*global define*/
/*jslint white:true,browser:true*/

define([
    // please use jquery with discretion.
    'jquery',
    'bluebird',
    'kb_common/html',
    'base/js/namespace',
    './runtime',
    './events'
], function ($, Promise, html, Jupyter, Runtime, Events) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), h4 = t('h4'),
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

        function confirmDialog(prompt, yesLabel, noLabel) {
            return window.confirm(prompt);
        }

        function renderConfirmDialog(title, content, yesLabel, noLabel) {
           var dialog =
                div({class: 'modal fade', tabindex: '-1', role: 'dialog'}, [
                    div({class: 'modal-dialog'}, [
                        div({class: 'modal-content'}, [
                            div({class: 'modal-header'}, [
                                button({type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: noLabel}, [
                                    span({ariaHidden: 'true'}, '&times;')
                                ]),
                                span({class: 'modal-title'}, title)
                            ]),
                            div({class: 'modal-body'}, [
                                content
                            ]),
                            div({class: 'modal-footer'}, [
                                button({type: 'button', class: 'btn btn-default', dataDismiss: 'modal', dataElement: 'no'}, noLabel),
                                button({type: 'button', class: 'btn btn-primary', dataElement: 'yes'}, yesLabel)
                            ])
                        ])
                    ])
                ]);
            return dialog;
        }
        function showConfirmDialog(title, content, yesLabel, noLabel) {
            var dialog = renderConfirmDialog(title, content, yesLabel, noLabel),
                dialogId = html.genId(),
                confirmNode = document.createElement('div'),
                kbaseNode, modalNode, modalDialogNode;

            confirmNode.id = dialogId;
            confirmNode.innerHTML = dialog;
            
            // top level element for kbase usage
            kbaseNode = document.querySelector('[data-element="kbase"]');
            if (!kbaseNode) {
                kbaseNode = document.createElement('div');
                kbaseNode.setAttribute('data-element', 'kbase');
                document.body.appendChild(kbaseNode);
            }
            
            // a node uponwhich to place Bootstrap modals.
            modalNode = kbaseNode.querySelector('[data-element="modal"]');
            if (!modalNode) {
                modalNode = document.createElement('div');
                modalNode.setAttribute('data-element', 'modal');
                kbaseNode.appendChild(modalNode);
            }

            modalNode.appendChild(confirmNode);
            
            modalDialogNode = modalNode.querySelector('.modal');
            $(modalDialogNode).modal('show');
            return new Promise(function (resolve) {
                modalDialogNode.querySelector('[data-element="yes"]').addEventListener('click', function (e) {
                    $(modalDialogNode).modal('hide');
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(true);
                });
                modalDialogNode.querySelector('[data-element="no"]').addEventListener('click', function (e) {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(false);
                });
                modalDialogNode.addEventListener('hide.bs.modal', function (e) {
                    resolve(false);
                });
            });

        }
        
        function renderInfoDialog(title, content, okLabel) {
           var dialog =
                div({class: 'modal fade', tabindex: '-1', role: 'dialog'}, [
                    div({class: 'modal-dialog'}, [
                        div({class: 'modal-content'}, [
                            div({class: 'modal-header'}, [
                                button({type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: okLabel}, [
                                    span({ariaHidden: 'true'}, '&times;')
                                ]),
                                span({class: 'modal-title'}, title)
                            ]),
                            div({class: 'modal-body'}, [
                                content
                            ]),
                            div({class: 'modal-footer'}, [
                                button({type: 'button', class: 'btn btn-default', dataDismiss: 'modal', dataElement: 'ok'}, okLabel)
                            ])
                        ])
                    ])
                ]);
            return dialog;
        }
        function showInfoDialog(arg) {
            var dialog = renderInfoDialog(arg.title, arg.body, arg.okLabel || 'OK'),
                dialogId = html.genId(),
                confirmNode = document.createElement('div'),
                kbaseNode, modalNode, modalDialogNode;

            confirmNode.id = dialogId;
            confirmNode.innerHTML = dialog;
            
            // top level element for kbase usage
            kbaseNode = document.querySelector('[data-element="kbase"]');
            if (!kbaseNode) {
                kbaseNode = document.createElement('div');
                kbaseNode.setAttribute('data-element', 'kbase');
                document.body.appendChild(kbaseNode);
            }
            
            // a node uponwhich to place Bootstrap modals.
            modalNode = kbaseNode.querySelector('[data-element="modal"]');
            if (!modalNode) {
                modalNode = document.createElement('div');
                modalNode.setAttribute('data-element', 'modal');
                kbaseNode.appendChild(modalNode);
            }

            modalNode.appendChild(confirmNode);
            
            modalDialogNode = modalNode.querySelector('.modal');
            $(modalDialogNode).modal('show');
            return new Promise(function (resolve) {
                modalDialogNode.querySelector('[data-element="ok"]').addEventListener('click', function () {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(false);
                });
                modalDialogNode.addEventListener('hide.bs.modal', function () {
                    resolve(false);
                });
            });

        }
        
        function renderDialog(title, content, cancelLabel, buttons) {
           var dialog =
                div({class: 'modal fade', tabindex: '-1', role: 'dialog'}, [
                    div({class: 'modal-dialog'}, [
                        div({class: 'modal-content'}, [
                            div({class: 'modal-header'}, [
                                button({type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: cancelLabel}, [
                                    span({ariaHidden: 'true'}, '&times;')
                                ]),
                                span({class: 'modal-title kb-title'}, title)
                            ]),
                            div({class: 'modal-body'}, [
                                content
                            ]),
                            div({class: 'modal-footer'}, [
                                button({
                                    type: 'button', 
                                    class: 'btn btn-default', 
                                    dataDismiss: 'modal', 
                                    dataElement: 'cancel'
                                }, cancelLabel)
                            ].concat(buttons.map(function (btn) {
                                return button({
                                    type: 'button', 
                                    class: 'btn btn-'+ btn.icon, 
                                    dataElement: btn.action
                                }, btn.label);
                            })))
                        ])
                    ])
                ]);
            return dialog;
        }
        function showDialog(args) {
            var dialog = renderDialog(args.title, args.body, args.cancelLabel || 'Cancel', args.buttons),
                dialogId = html.genId(),
                confirmNode = document.createElement('div'),
                kbaseNode, modalNode, modalDialogNode;

            confirmNode.id = dialogId;
            confirmNode.innerHTML = dialog;
            
            // top level element for kbase usage
            kbaseNode = document.querySelector('[data-element="kbase"]');
            if (!kbaseNode) {
                kbaseNode = document.createElement('div');
                kbaseNode.setAttribute('data-element', 'kbase');
                document.body.appendChild(kbaseNode);
            }
            
            // a node uponwhich to place Bootstrap modals.
            modalNode = kbaseNode.querySelector('[data-element="modal"]');
            if (!modalNode) {
                modalNode = document.createElement('div');
                modalNode.setAttribute('data-element', 'modal');
                kbaseNode.appendChild(modalNode);
            }

            modalNode.appendChild(confirmNode);
            
            modalDialogNode = modalNode.querySelector('.modal');
            $(modalDialogNode).modal('show');
            return new Promise(function (resolve, reject) {
                modalDialogNode.querySelector('[data-element="cancel"]').addEventListener('click', function (e) {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve({
                        action: 'cancel'
                    });
                });
                args.buttons.forEach(function (btn) {
                    modalDialogNode.querySelector('[data-element="'+btn.action+'"]').addEventListener('click', function (e) {
                        try {
                            var result = btn.handler(e);
                            if (result) {
                                $(modalDialogNode).modal('hide');
                                confirmNode.parentElement.removeChild(confirmNode);
                                resolve({
                                    action: btn.action,
                                    result: result
                                });
                            }
                        } catch (ex) {
                            reject(ex);
                        }
                    });
                });

                modalDialogNode.addEventListener('hide.bs.modal', function (e) {
                    resolve({
                        action: 'cancel'
                    });
                });
            });

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

        function buildButton(arg) {
            var klass = arg.type || 'default',
                events = arg.events;
            return button({
                type: 'button',
                class: ['btn', 'btn-' + klass].join(' '),
                dataButton: arg.name,
                id: addButtonClickEvent(events, arg.eventType || name)
            }, arg.label);
        }

        function enableButton(name) {
            getButton(name).classList.remove('hidden');
            getButton(name).classList.remove('disabled');
        }

        function disableButton(name) {
            getButton(name).classList.remove('hidden');
            getButton(name).classList.add('disabled');
        }
        function hideButton(name) {
            getButton(name).classList.remove('disabled');
            getButton(name).classList.add('hidden');
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
            if (args.classes) {
                classes = classes.concat(args.classes);
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
            if (args.classes) {
                classes = classes.concat(args.classes);
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
        
        function buildButtonToolbar(arg) {
            return div({
                class: ['btn-toolbar'].concat(arg.classes || [])
            }, [
               div({
                   class: 'btn-group'
               }, arg.buttons)
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
        
        function getUserSetting(settingKey, defaultValue) {
            var settings = Jupyter.notebook.metadata.kbase.userSettings,
                setting;
            if (!settings) {
                return defaultValue;
            }
            setting = settings[settingKey];
            if (setting === undefined) {
                return defaultValue;
            }
            return setting;
        }

        function ifAdvanced(fun) {
            var isAdvanced = getUserSetting('advanced', runtime.config('features.advanced')) ;
            if (isAdvanced) {
                return fun();
            }
        }

        function ifDeveloper(fun) {
            var isDeveloper = getUserSetting('developer', runtime.config('features.developer'));
            if (isDeveloper) {
                return fun();
            }
        }
        
        function isAdvanced() {
            var isAdvanced = getUserSetting('advanced', runtime.config('features.advanced')) ;
            if (isAdvanced) {
                return true;
            }
            return false;
        }

        function isDeveloper(fun) {
            var isDeveloper = getUserSetting('developer', runtime.config('features.developer'));
            if (isDeveloper) {
                return true;
            }
            return false;
        }
        
        function buildIcon(arg) {
            var klasses = ['fa'];
            klasses.push('fa-' + arg.name);
            if (arg.rotate) {
                klasses.push('fa-rotate-' + String(arg.rotate));
            }
            if (arg.flip) {
                klasses.push('fa-flip-' + arg.flip);
            }
            if (arg.size) {
                if (typeof arg.size === 'number') {
                    klasses.push('fa-' + String(arg.size) + 'x');
                } else {
                    klasses.push('fa-' + arg.size)
                }
            }
            return span({
                class: klasses.join(' ')
            });
        }

        return {
            getElement: getElement,
            getButton: getButton,
            // setButton: setButton,
            getNode: getNode,
            makeButton: makeButton,
            buildButton: buildButton,
            enableButton: enableButton,
            disableButton: disableButton,
            hideButton: hideButton,
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
            ifDeveloper: ifDeveloper,
            isAdvanced: isAdvanced,
            isDeveloper: isDeveloper,
            showConfirmDialog: showConfirmDialog,
            showInfoDialog: showInfoDialog,
            showDialog: showDialog,
            buildButtonToolbar: buildButtonToolbar,
            buildIcon: buildIcon
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
