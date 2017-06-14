define([
    // please use jquery with discretion.
    'jquery',
    'bluebird',
    'kb_common/html',
    'base/js/namespace',
    './runtime',
    './events',
    'google-code-prettify/prettify',
    'css!google-code-prettify/prettify.css',
    'bootstrap'
], function (
    $,
    Promise,
    html,
    Jupyter,
    Runtime,
    Events,
    PR
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        ol = t('ol'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        button = t('button'),
        pre = t('pre'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        i = t('i');

    // "static" methods
    function na() {
        return span({ style: { fontStyle: 'italic', color: 'orange' } }, 'NA');
    }

    function renderInfoDialog(title, content, okLabel, type) {
        var extraClass = '';
        if (type) {
            extraClass = ' bg-' + type;
        }
        return div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' + extraClass }, [
                        button({ type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: okLabel }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        content
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({ type: 'button', class: 'btn btn-default', dataDismiss: 'modal', dataElement: 'ok' }, okLabel)
                    ])
                ])
            ])
        ]);
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

        // a node upon which to place Bootstrap modals.
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

    function buildError(error) {
        return table({
            class: 'table table-striped'
        }, [
            tr([
                th('Name'),
                td(error.name)
            ]),
            tr([
                th('Code'),
                td(error.code)
            ]),
            tr([
                th('Message'),
                td(error.message)
            ]),
            tr([
                th('Detail'),
                td(error.detail)
            ]),
            tr([
                th('Reference'),
                td(error.reference)
            ])
        ]);
    }

    function showErrorDialog(arg) {
        var body = buildError(arg.error);

        var dialog = renderInfoDialog(arg.title, body, 'OK', 'danger'),
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

        // a node upon which to place Bootstrap modals.
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

    function renderDialog(title, content, cancelLabel, buttons, options) {
        var style = {};
        if (options && options.width) {
            style.width = options.width;
        }
        return div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog', style: style }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({ type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: cancelLabel }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title kb-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        content
                    ]),
                    div({ class: 'modal-footer' }, buttons.map(function (btn) {
                        return button({
                            type: 'button',
                            class: 'btn btn-' + (btn.type || 'default'),
                            dataElement: btn.action
                        }, btn.label);
                    }).concat([
                        button({
                            type: 'button',
                            class: 'btn btn-default',
                            dataDismiss: 'modal',
                            dataElement: 'cancel'
                        }, cancelLabel)
                    ]))
                ])
            ])
        ]);
    }

    function showDialog(args) {
        args.buttons = args.buttons || [];
        var dialog = renderDialog(args.title, args.body, args.cancelLabel || 'Cancel', args.buttons, args.options),
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

        // a node upon which to place Bootstrap modals.
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
                modalDialogNode.querySelector('[data-element="' + btn.action + '"]').addEventListener('click', function (e) {
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
            if (names.length === 0) {
                return container;
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function qsa(node, selector) {
            return Array.prototype.slice.call(node.querySelectorAll(selector, 0));
        }

        function getElements(names) {
            if (typeof names === 'string') {
                names = names.split('.');
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            return qsa(container, selector);
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

        /*
         * Generic version of getElement
         * Returns a node which is accessible by the path.
         * Each path element is an object with 
         * type = data-TYPE
         * name = value of the data-TYPE attribute
         */
        function getNode(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            var selector = names.map(function (dataSelector) {
                return '[data-' + dataSelector.type + '="' + dataSelector.name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        /*
         * a node spec is a list of path segment specs, which are each a simple
         * object where the keys are the suffix to a data- attribute and the v
         * values are the values. Each segment is an array of these, which are 
         * concatenated
         */
        function findNode(nodePath) {
            var selector = nodePath.map(function (pathElement) {
                return Object.keys(pathElement).map(function (dataKey) {
                    var dataValue = pathElement[dataKey];
                    return '[data-' + dataKey + '="' + dataValue + '"]';
                }).join('');
            }).join(' ');

            return container.querySelector(selector);
        }

        function confirmDialog(prompt, yesLabel, noLabel) {
            return window.confirm(prompt);
        }

        function renderConfirmDialog(arg) {
            var yesLabel = arg.yesLabel || 'Yes',
                noLabel = arg.noLabel || 'No';
            var dialog =
                div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
                    div({ class: 'modal-dialog' }, [
                        div({ class: 'modal-content' }, [
                            div({ class: 'modal-header' }, [
                                button({ type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: noLabel }, [
                                    span({ ariaHidden: 'true' }, '&times;')
                                ]),
                                span({ class: 'modal-title' }, arg.title)
                            ]),
                            div({ class: 'modal-body' }, [
                                arg.body
                            ]),
                            div({ class: 'modal-footer' }, [
                                button({ type: 'button', class: 'btn btn-default', dataDismiss: 'modal', dataElement: 'no' }, noLabel),
                                button({ type: 'button', class: 'btn btn-primary', dataElement: 'yes' }, yesLabel)
                            ])
                        ])
                    ])
                ]);
            return dialog;
        }

        function showConfirmDialog(arg) {
            var dialog = renderConfirmDialog(arg),
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
                modalDialogNode.querySelector('[data-element="yes"]').addEventListener('click', function () {
                    $(modalDialogNode).modal('hide');
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(true);
                });
                modalDialogNode.addEventListener('keyup', function (e) {
                    if (e.keyCode === 13) {
                        $(modalDialogNode).modal('hide');
                        confirmNode.parentElement.removeChild(confirmNode);
                        resolve(true);
                    }
                });
                modalDialogNode.querySelector('[data-element="no"]').addEventListener('click', function () {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(false);
                });
                modalDialogNode.addEventListener('hide.bs.modal', function () {
                    resolve(false);
                });
            });
        }

        function addButtonClickEvent(events, eventName, data) {
            return events.addEvent({
                type: 'click',
                handler: function (e) {
                    bus.send({
                        event: e,
                        button: e.target,
                        data: data
                    }, {
                        key: {
                            type: eventName
                        }
                    });
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
                buttonClasses = ['btn', 'btn-' + klass],
                events = arg.events,
                icon,
                title = arg.title || arg.tip || arg.label,
                attribs;;

            if (arg.icon) {
                if (!arg.icon.classes) {
                    arg.icon.classes = [];
                }
                icon = buildIcon(arg.icon);
            }

            if (arg.hidden) {
                buttonClasses.push('hidden');
            }

            if (arg.classes) {
                buttonClasses = buttonClasses.concat(arg.classes);
            }
            if (!arg.event) {
                arg.event = {};
            }

            attribs = {
                type: 'button',
                class: buttonClasses.join(' '),
                title: title,
                dataButton: arg.name,
                id: addButtonClickEvent(events, arg.event.type || arg.name, arg.event.data),
                style: arg.style
            };

            if (arg.features) {
                arg.features.forEach(function (feature) {
                    attribs['data-feature-' + feature] = true;
                });
            }

            return button(attribs, [icon, span({ style: { verticalAlign: 'middle' } }, arg.label)].join('&nbsp;'));
        }

        function enableButton(name) {
            var button = getButton(name);
            button.classList.remove('hidden');
            button.classList.remove('disabled');
            button.removeAttribute('disabled');
        }

        function disableButton(name) {
            var button = getButton(name);
            button.classList.remove('hidden');
            button.classList.add('disabled');
            button.setAttribute('disabled', true);
        }

        function activateButton(name) {
            getButton(name).classList.add('active');
        }

        function deactivateButton(name) {
            getButton(name).classList.remove('active');
        }

        function hideButton(name) {
            getButton(name).classList.add('hidden');
        }

        function showButton(name) {
            getButton(name).classList.remove('hidden');
        }

        function setButtonLabel(name, label) {
            getButton(name).innerHTML = label;
        }

        function hideElement(name) {
            var el = getElement(name);
            if (!el) {
                return;
            }
            el.classList.add('hidden');
        }

        function showElement(name) {
            var el = getElement(name);
            if (!el) {
                return;
            }
            el.classList.remove('hidden');
        }

        function makePanel(title, elementName) {
            return div({ class: 'panel panel-primary' }, [
                div({ class: 'panel-heading' }, [
                    div({ class: 'panel-title' }, title)
                ]),
                div({ class: 'panel-body' }, [
                    div({ dataElement: elementName, class: 'container-fluid' })
                ])
            ]);
        }

        function buildPanel(args) {
            var type = args.type || 'primary',
                classes = ['panel', 'panel-' + type],
                icon;
            if (args.hidden) {
                classes.push('hidden');
            }
            if (args.classes) {
                classes = classes.concat(args.classes);
            }
            if (args.icon) {
                icon = [' ', buildIcon(args.icon)];
            }
            return div({
                class: classes.join(' '),
                dataElement: args.name
            }, [
                (function () {
                    if (args.title) {
                        return div({ class: 'panel-heading' }, [
                            div({ class: 'panel-title', dataElement: 'title' }, [args.title, icon])
                        ]);
                    }
                }()),
                div({
                    class: 'panel-body',
                    dataElement: 'body'
                }, [
                    args.body
                ])
            ]);
        }

        function makeCollapsiblePanel(title, elementName) {
            var collapseId = html.genId();

            return div({ class: 'panel panel-default' }, [
                div({ class: 'panel-heading' }, [
                    div({ class: 'panel-title' }, span({
                            class: 'collapsed',
                            dataToggle: 'collapse',
                            dataTarget: '#' + collapseId,
                            style: { cursor: 'pointer' }
                        },
                        title
                    ))
                ]),
                div({ id: collapseId, class: 'panel-collapse collapse' },
                    div({ class: 'panel-body' }, [
                        div({ dataElement: elementName, class: 'container-fluid' })
                    ])
                )
            ]);
        }

        function buildCollapsiblePanel(args) {
            var panelId = args.id || html.genId(),
                collapseId = html.genId(),
                type = args.type || 'primary',
                classes = ['panel', 'panel-' + type],
                collapseClasses = ['panel-collapse collapse'],
                toggleClasses = [],
                icon;

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
            if (args.icon) {
                icon = [' ', buildIcon(args.icon)];
            }
            return div({ 
                id: panelId,
                class: classes.join(' '), 
                dataElement: args.name 
            }, [
                div({ class: 'panel-heading' }, [
                    div({ class: 'panel-title' }, span({
                        dataElement: 'title',
                        class: toggleClasses.join(' '),
                        dataToggle: 'collapse',
                        dataTarget: '#' + collapseId,
                        style: { cursor: 'pointer' }
                    }, [args.title, icon]))
                ]),
                div({ id: collapseId, class: collapseClasses.join(' ') },
                    div({ class: 'panel-body', dataElement: 'body' }, [
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
            $(collapseTarget).collapse('hide');
        }

        function expandPanel(path) {
            var node = getElement(path);
            if (!node) {
                return;
            }
            var collapseToggle = node.querySelector('[data-toggle="collapse"]'),
                targetSelector = collapseToggle.getAttribute('data-target'),
                collapseTarget = node.querySelector(targetSelector);
            $(collapseTarget).collapse('show');
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
            var node = getElements(path);
            node.forEach(function (node) {
                node.innerHTML = content;
            });
        }

        function enableTooltips(path) {
            var node = getElement(path);
            if (!node) {
                return;
            }
            qsa(node, '[data-toggle="tooltip"]').forEach(function (node) {
                $(node).tooltip();
            });
        }

        function addClass(path, klass) {
            var node = getElement(path);
            if (node) {
                if (!node.classList.contains(klass)) {
                    node.classList.add(klass);
                }
            }
        }

        function removeClass(path, klass) {
            var node = getElement(path);
            if (node) {
                node.classList.remove(klass);
            }
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
            var isAdvanced = getUserSetting('advanced', runtime.config('features.advanced'));
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
            var isAdvanced = getUserSetting('advanced', runtime.config('features.advanced'));
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
            var klasses = ['fa'],
                style = { verticalAlign: 'middle' };
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
                    klasses.push('fa-' + arg.size);
                }
            }
            if (arg.classes) {
                arg.classes.forEach(function (klass) {
                    klasses.push(klass);
                });
            }
            if (arg.style) {
                Object.keys(arg.style).forEach(function (key) {
                    style[key] = arg.style[key];
                });
            }
            if (arg.color) {
                style.color = arg.color;
            }

            return span({
                dataElement: 'icon',
                style: style,
                class: klasses.join(' ')
            });
        }

        function reverse(arr) {
            var newArray = [],
                i, len = arr.length;
            for (i = len - 1; i >= 0; i -= 1) {
                newArray.push(arr[i]);
            }
            return newArray;
        }

        function updateTab(tabId, tabName, updates) {
            var node = document.getElementById(tabId);
            if (!node) {
                return;
            }

            // Update tab label
            var tabTab = findNode([{
                element: 'tab',
                name: tabName
            }]);

            // Update tab label 
            if (updates.label) {
                var labelNode = tabTab.querySelector('[data-element="label"]');
                if (labelNode) {
                    labelNode.innerHTML = updates.label;
                }
            }

            // update the tab icon
            if (updates.icon) {
                var iconNode = tabTab.querySelector('[data-element="icon"]');
                if (iconNode) {
                    // remove any icons.
                    var classList = iconNode.classList;
                    for (var i = classList.length; classList > 0; classList -= 1) {
                        if (classList.item[i].substring(0, 3) === 'fa-') {
                            classList.remove(classList.item[i]);
                        }
                    }
                    iconNode.classList.add('fa-' + updates.icon);
                }
            }

            // update tab color
            if (updates.color) {
                tabTab.style.color = updates.color;
            }

            // switch to tab
            if (updates.select) {

            }

        }

        function buildTabs(arg) {
            var tabsId = arg.id,
                tabsAttribs = {},
                tabClasses = ['nav', 'nav-tabs'],
                tabStyle = {},
                activeIndex, tabTabs,
                tabs = arg.tabs.filter(function (tab) {
                    return (tab ? true : false);
                }),
                events = [],
                content,
                selectInitialTab = false,
                tabMap = {},
                panelClasses = ['tab-pane'];

            if (arg.fade) {
                panelClasses.push('fade');
            }

            if (typeof arg.initialTab === 'number') {
                selectInitialTab = true;
            }

            if (tabsId) {
                tabsAttribs.id = tabsId;
            }

            tabs.forEach(function (tab) {
                tab.panelId = html.genId();
                tab.tabId = html.genId();
                if (tab.name) {
                    tabMap[tab.name] = tab.tabId;
                }
                if (tab.events) {
                    tab.events.forEach(function (event) {
                        events.push({
                            id: tab.tabId,
                            jquery: true,
                            type: event.type + '.bs.tab',
                            handler: event.handler
                        });
                    });
                }
            });
            if (arg.alignRight) {
                tabTabs = reverse(tabs);
                tabStyle.float = 'right';
                if (selectInitialTab) {
                    activeIndex = tabs.length - 1 - arg.initialTab;
                }
            } else {
                tabTabs = tabs;
                if (selectInitialTab) {
                    activeIndex = arg.initialTab;
                }
            }
            content = div(tabsAttribs, [
                ul({ class: tabClasses.join(' '), role: 'tablist' },
                    tabTabs.map(function (tab, index) {
                        var tabAttribs = {
                                role: 'presentation'
                            },
                            linkAttribs = {
                                href: '#' + tab.panelId,
                                dataElement: 'tab',
                                ariaControls: tab.panelId,
                                role: 'tab',
                                id: tab.tabId,
                                dataPanelId: tab.panelId,
                                dataToggle: 'tab'
                            },
                            icon, label = span({ dataElement: 'label' }, tab.label);
                        if (tab.icon) {
                            icon = buildIcon({ name: tab.icon });
                        } else {
                            icon = '';
                        }

                        if (tab.name) {
                            linkAttribs.dataName = tab.name;
                        }
                        if (selectInitialTab) {
                            if (index === activeIndex) {
                                tabAttribs.class = 'active';
                            }
                        }
                        tabAttribs.style = tabStyle;
                        return li(tabAttribs, a(linkAttribs, [icon, label].join(' ')));
                    })),
                div({ class: 'tab-content' },
                    tabs.map(function (tab, index) {
                        var attribs = {
                            role: 'tabpanel',
                            class: panelClasses.join(' '),
                            id: tab.panelId,
                            style: arg.style || {}
                        };
                        if (tab.name) {
                            attribs.dataName = tab.name;
                        }
                        if (index === 0) {
                            attribs.class += ' active';
                        }
                        return div(attribs, tab.content);
                    }))
            ]);
            return {
                content: content,
                events: events,
                map: tabMap
            };
        }

        // TURN THIS INTO A MINI WIDGET!
        function jsonBlockWidget() {
            function factory(cfg) {
                var config = cfg || {},
                    indent = config.indent || 3,
                    fontSize = config.fontSize || 0.8;

                function render(obj) {
                    var specText = JSON.stringify(obj, false, indent),
                        fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    return pre({
                        class: 'prettyprint lang-json',
                        style: {
                            fontSize: String(fontSize * 100) + '%'
                        }
                    }, fixedText);
                }

                function start(arg) {
                    return Promise.try(function () {
                        arg.node.innerHTML = render(arg.obj);
                        PR.prettyPrint(null, arg.node);
                    });
                }

                function stop() {
                    return Promise.resolve;
                }

                return {
                    start: start,
                    stop: stop
                };
            }
            return {
                make: function (config) {
                    return factory(config);
                }
            };
        }

        function buildGridTable(arg) {
            return arg.table.map(function (row) {
                return div({ class: 'row', style: arg.row.style }, arg.cols.map(function (col, index) {
                    return div({ class: 'col-md-' + String(col.width), style: col.style }, row[index]);
                }));
            });
        }

        function camelToHyphen(s) {
            return s.replace(/[A-Z]/g, function (m) {
                return '-' + m.toLowerCase();
            });
        }

        function updateFromViewModel(viewModel, path) {
            if (!path) {
                path = [];
            }
            var node = getElement(path);
            if (!node) {
                return;
            }
            if (typeof viewModel === 'string') {
                setContent(path, viewModel);
            } else if (typeof viewModel === 'number') {
                setContent(path, String(viewModel));
            } else if (viewModel === null) {
                setContent(path, '');
            } else {
                Object.keys(viewModel).forEach(function (key) {
                    var value = viewModel[key];
                    if (key === '_attrib') {
                        Object.keys(value).forEach(function (attribKey) {
                            var attribValue = value[attribKey];
                            // console.log('attrib?', attribKey, attribValue);
                            switch (attribKey) {
                            case 'hidden':
                                // console.log('HIDING?', attribKey, node, attribValue);
                                if (attribValue) {
                                    node.classList.add('hidden');
                                } else {
                                    node.classList.remove('hidden');
                                }
                                break;
                            case 'style':
                                Object.keys(attribValue).forEach(function (key) {
                                    node.style[camelToHyphen(key)] = attribValue[key];
                                });
                            }
                        });
                    } else {
                        updateFromViewModel(value, path.concat(key));
                    }
                });
            }
        }

        function buildPresentableJson(data) {
            switch (typeof data) {
            case 'string':
                return data;
            case 'number':
                return String(data);
            case 'boolean':
                return String(data);
            case 'object':
                if (data === null) {
                    return 'NULL';
                }
                if (data instanceof Array) {
                    return table({ class: 'table table-striped' },
                        data.map(function (datum, index) {
                            return tr([
                                th(String(index)),
                                td(buildPresentableJson(datum))
                            ]);
                        }).join('\n')
                    );
                }
                return table({ class: 'table table-striped' },
                    Object.keys(data).map(function (key) {
                        return tr([th(key), td(buildPresentableJson(data[key]))]);
                    }).join('\n')
                );
            default:
                return 'Not representable: ' + (typeof data);
            }
        }

        function buildError(err) {
            return div({}, [
                buildPanel({
                    title: 'Message',
                    body: err.message,
                    classes: [
                        'kb-panel-light'
                    ]
                }),
                err.fileName ? buildPanel({
                    title: 'File',
                    body: err.fileName,
                    classes: [
                        'kb-panel-light'
                    ]
                }) : '',
                err.lineNumber ? buildPanel({
                    title: 'Line number',
                    body: err.lineNumber,
                    classes: [
                        'kb-panel-light'
                    ]
                }) : '',
                err.columnNumber ? buildPanel({
                    title: 'Column number',
                    body: err.columnNumber,
                    classes: [
                        'kb-panel-light'
                    ]
                }) : ''
            ]);
        }

        function htmlEncode(str) {
            return str
                .replace(/&/, '&amp;')
                .replace(/'/, '&#039;')
                .replace(/"/, '&quot;')
                .replace(/</, '&lt;')
                .replace(/>/, '&gt;');
        }

        function buildErrorStacktrace(err) {
            return div([
                ol({}, err.stack.split(/\n/)
                    .map(function (item) {
                        return li({
                            style: {
                                marginTop: '6px'
                            }
                        }, [
                            htmlEncode(item)
                        ]);
                    }))
            ]);
        }

        function buildErrorTabs(arg) {
            return html.makeTabs({
                tabs: [{
                        label: 'Summary',
                        name: 'summary',
                        content: div({
                            style: {
                                marginTop: '10px'
                            }
                        }, [
                            arg.preamble,
                            p(arg.error.message)
                        ])
                    },
                    {
                        label: 'Details',
                        name: 'details',
                        content: div({
                            style: {
                                marginTop: '10px'
                            }
                        }, [
                            buildError(arg.error)
                        ])
                    },
                    {
                        label: 'Stack Trace',
                        name: 'stacktrace',
                        content: div({
                            style: {
                                marginTop: '10px'
                            }
                        }, [
                            buildPanel({
                                title: 'Javascript Stack Trace',
                                body: buildErrorStacktrace(arg.error),
                                classes: [
                                    'kb-panel-light'
                                ]
                            })
                        ])
                    }
                ]
            });
        }

        function loading(arg) {
            var prompt;
            if (arg.message) {
                prompt = arg.message + '... &nbsp &nbsp';
            }
            var sizeClass;
            if (arg.size) {
                sizeClass = 'fa-' + arg.size;
            }
            var style = {};
            if (arg.color) {
                style.color = arg.color;
            }
            return span([
                prompt,
                i({
                    class: ['fa', 'fa-spinner', 'fa-pulse', sizeClass, 'fa-fw', 'margin-bottom'].join(' '),
                    style: style
                })
            ]);
        }

        return Object.freeze({
            getElement: getElement,
            getElements: getElements,
            getButton: getButton,
            // setButton: setButton,
            getNode: getNode,
            makeButton: makeButton,
            buildButton: buildButton,
            enableButton: enableButton,
            disableButton: disableButton,
            activateButton: activateButton,
            deactivateButton: deactivateButton,
            hideButton: hideButton,
            showButton: showButton,
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
            buildIcon: buildIcon,
            addClass: addClass,
            removeClass: removeClass,
            buildTabs: buildTabs,
            jsonBlockWidget: jsonBlockWidget(),
            enableTooltips: enableTooltips,
            updateTab: updateTab,
            buildGridTable: buildGridTable,
            updateFromViewModel: updateFromViewModel,
            buildPresentableJson: buildPresentableJson,
            buildErrorTabs: buildErrorTabs,
            htmlEncode: htmlEncode,
            loading: loading
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
        // "static" methods
        na: na,
        showInfoDialog: showInfoDialog,
        showDialog: showDialog,
        showErrorDialog: showErrorDialog
    };
});