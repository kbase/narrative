/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'common/events',
    'base/js/namespace',
    'common/utils',
    'util/bootstrapDialog',
    'kbase/js/widgets/appInfoPanel',
    'custom/custom'
], function(
    $,
    html,
    Events,
    Jupyter,
    utils,
    BootstrapDialog,
    AppInfoPanel
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        a = t('a'),
        button = t('button'),
        p = t('p'),
        span = t('span'),
        ul = t('ul'),
        li = t('li');

    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (name === undefined) {
            return cell.metadata.kbase[group];
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }

    function factory(config) {
        var container,
            cell,
            readOnly = Jupyter.narrative.readonly;

        function doMoveCellUp() {
            Jupyter.notebook.move_cell_up();
        }

        function doMoveCellDown() {
            Jupyter.notebook.move_cell_down();
        }

        function doDeleteCell() {
            $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
        }

        function getCellTitle(cell) {
            var title = getMeta(cell, 'attributes', 'title'),
                showTitle = utils.getCellMeta(cell, 'kbase.cellState.showTitle', true);

            if (showTitle) {
                return title;
            }
            return '';
        }

        function getCellSubtitle(cell) {
            var subTitle = getMeta(cell, 'attributes', 'subtitle'),
                showTitle = utils.getCellMeta(cell, 'kbase.cellState.showTitle', true),
                showSubtitle = utils.getCellMeta(cell, 'kbase.cellState.showSubtitle', true);

            if (showTitle) {
                return subTitle;
            }
            return '';
        }

        function getCellInfoLink(cell, events) {
            var url = utils.getCellMeta(cell, 'kbase.attributes.info.url'),
                label = utils.getCellMeta(cell, 'kbase.attributes.info.label');

            if (url) {
                return a({
                        href: url,
                        target: '_blank',
                        id: events.addEvent({
                            type: 'click',
                            handler: doShowInfoModal
                        })
                    },
                    label || 'ref');
            }
            return '';
        }

        function doToggleMinMaxCell(e) {
            if (e.getModifierState) {
                var modifier = e.getModifierState('Alt');
                if (modifier) {
                    console.log('I want to toggle all cells!');
                }
            }
            cell.toggleMinMax();
            // cell.element.trigger('toggleMinMax.cell');
        }

        function doToggleCodeView() {
            cell.element.trigger('toggleCodeArea.cell');
        }

        function isCodeShowing(cell) {
            if (cell.isCodeShowing) {
                return cell.isCodeShowing();
            }
            return null;
        }

        function doShowInfoModal(e) {
            e.preventDefault();
            var version = utils.getCellMeta(cell, 'kbase.appCell.app.version'),
                authors = utils.getCellMeta(cell, 'kbase.appCell.app.spec.info.authors'),
                title = getMeta(cell, 'attributes', 'title') + ' v' + version,
                appStoreUrl = utils.getCellMeta(cell, 'kbase.attributes.info.url'),
                tag = utils.getCellMeta(cell, 'kbase.appCell.app.tag'),
                module = utils.getCellMeta(cell, 'kbase.appCell.app.spec.info.module_name');
            var dialog = new BootstrapDialog({
                title: title,
                body: $('<div class="container"></div>'),
                buttons: [
                    $('<a href="' + appStoreUrl + '" target="_blank" type="button" class="btn btn-default">View on App Store</a>'),
                    $('<button type="button" class="btn btn-primary">Close</button>').click(function() {
                        dialog.hide();
                    })
                ],
                enterToTrigger: true,
                closeButton: true
            });

            var infoPanel = AppInfoPanel.make({
                appId: utils.getCellMeta(cell, 'kbase.appCell.app.id'),
                appVersion: version,
                appAuthors: authors,
                appModule: module,
                tag: tag
            });
            infoPanel.start({ node: dialog.getBody() });

            dialog.getElement().on('hidden.bs.modal', function() {
                dialog.destroy();
            });
            dialog.show();
        }

        function doToggleCellSettings() {
            cell.element.trigger('toggleCellSettings.cell');
        }

        function renderToggleCellSettings(events) {
            // Only kbase cells have cell settings.
            if (!cell.metadata || !cell.metadata.kbase || !cell.metadata.kbase.type) {
                return;
            }

            return button({
                type: 'button',
                class: 'btn btn-default btn-xs',
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: true,
                dataOriginalTitle: 'Cell Settings',
                id: events.addEvent({ type: 'click', handler: doToggleCellSettings })
            }, [
                span({ class: 'fa fa-cog', style: 'font-size: 14pt' })
            ]);
        }

        function renderIcon(icon) {
            return span({
                class: 'fa fa-' + icon.type + ' fa-sm',
                style: { color: icon.color || '#000' }
            });
        }

        function isKBaseCell(cell) {
            if (!cell.metadata || !cell.metadata.kbase || !cell.metadata.kbase.type) {
                return false;
            }
            return true;
        }

        function doHelp() {
            alert('help here...');
        }

        function renderOptions(cell, events) {
            var toggleMinMax = utils.getCellMeta(cell, 'kbase.cellState.toggleMinMax', 'maximized'),
                toggleIcon = (toggleMinMax === 'maximized' ? 'minus' : 'plus'),
                dropdownId = html.genId(),
                menuItems = [
                    // we can always dream.
                    //                    {
                    //                        name: 'help',
                    //                        label: 'Help',
                    //                        icon: {
                    //                            type: 'question',
                    //                            color: 'black'
                    //                        },
                    //                        id: events.addEvent({type: 'click', handler: doHelp})
                    //                    },
                    // {
                    //     name: 'toggle-collapse',
                    //     label: toggleMinMax === 'maximized' ? 'Collapse' : 'Expand',
                    //     icon: {
                    //         type: toggleIcon + '-square-o',
                    //         color: 'orange'
                    //     },
                    //     id: events.addEvent({ type: 'click', handler: doToggleMinMaxCell })
                    // }
                ];

            // we can always dream
            //            if (isKBaseCell(cell)) {
            //                menuItems.push({
            //                    name: 'settings',
            //                    label: 'Settings',
            //                    icon: {
            //                        type: 'gear',
            //                        color: 'black'
            //                    }
            //                });
            //            }

            if (cell.cell_type === 'code') {
                menuItems.push({
                    name: 'code-view',
                    label: isCodeShowing(cell) ? 'Hide code' : 'Show code',
                    icon: {
                        type: 'terminal',
                        color: 'black'
                    },
                    id: events.addEvent({ type: 'click', handler: doToggleCodeView })
                });
            }

            if (cell.showInfo) {
                menuItems.push({
                    name: 'info',
                    label: 'Info',
                    icon: {
                        type: 'info',
                        color: 'orange'
                    },
                    id: events.addEvent({
                        type: 'click',
                        handler: function() {
                            cell.showInfo();
                        }
                    })
                });
            }

            if (!readOnly) {
                if (menuItems.length > 0) {
                    menuItems.push({
                        type: 'separator'
                    });
                }
                menuItems.push({
                    name: 'delete-cell',
                    label: 'Delete cell',
                    icon: {
                        type: 'times',
                        color: 'red'
                    },
                    id: events.addEvent({ type: 'click', handler: doDeleteCell })
                });
            }

            if (menuItems.length === 0) {
                return '';
            }

            return span({ class: 'dropdown' }, [
                button({
                    class: 'btn btn-xs btn-default dropdown-toggle',
                    type: 'button',
                    id: dropdownId,
                    dataToggle: 'dropdown',
                    ariaHaspopup: 'true',
                    ariaExpanded: 'true'
                }, [span({ class: 'fa fa-ellipsis-h fa-lg' })]),
                ul({
                    class: 'dropdown-menu dropdown-menu-right',
                    ariaLabelledby: dropdownId
                }, [
                    menuItems.map(function(item) {
                        switch (item.type) {
                            case 'separator':
                                return li({
                                    role: 'separator',
                                    class: 'divider'
                                });
                            default:
                                return li(button({
                                    class: 'btn btn-default',
                                    type: 'button',
                                    style: {
                                        width: '100%',
                                        textAlign: 'left'
                                    },
                                    id: item.id
                                }, [
                                    span({
                                        style: {
                                            display: 'inline-block',
                                            width: '25px',
                                            marginRight: '4px'
                                        }
                                    }, renderIcon(item.icon)),
                                    span(item.label)
                                ]));
                        }
                    }).join('')
                ])
            ]);
        }

        function buildIcon(cell) {
            if (cell && cell.getIcon) {
                return cell.getIcon();
            }
            return span({
                class: 'fa fa-thumbs-down fa-2x',
                style: {
                    verticalAlign: 'top',
                }
            });
        }

        function render(cell) {
            var events = Events.make({ node: container }),
                buttons = [
                    div({ class: 'buttons pull-right' }, [
                        span({ class: 'kb-func-timestamp' }),
                        span({ class: 'fa fa-circle-o-notch fa-spin', style: { color: 'rgb(42, 121, 191)', display: 'none' } }),
                        span({ class: 'fa fa-exclamation-triangle', style: { color: 'rgb(255, 0, 0)', display: 'none' } }),

                        (readOnly ? null : button({
                            type: 'button',
                            class: 'btn btn-default btn-xs',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: true,
                            dataOriginalTitle: 'Move Cell Up',
                            id: events.addEvent({ type: 'click', handler: doMoveCellUp })
                        }, [
                            span({ class: 'fa fa-arrow-up fa-lg' })
                        ])),
                        (readOnly ? null : button({
                            type: 'button',
                            class: 'btn btn-default btn-xs',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: true,
                            dataOriginalTitle: 'Move Cell Down',
                            id: events.addEvent({ type: 'click', handler: doMoveCellDown })
                        }, [
                            span({ class: 'fa fa-arrow-down fa-lg', style: 'xfont-size: 18px' })
                        ])),
                        renderOptions(cell, events),
                        //                    button({
                        //                        type: 'button',
                        //                        class: 'btn btn-default btn-xs',
                        //                        dataToggle: 'tooltip',
                        //                        dataPlacement: 'left',
                        //                        title: true,
                        //                        dataOriginalTitle: 'Delete Cell',
                        //                        id: events.addEvent({type: 'click', handler: doDeleteCell})
                        //                    }, [
                        //                        span({class: 'fa fa-times-circle', style: {fontSize: '14pt', color: 'red'}})
                        //                    ]),
                        // enable the following
                        // function to add the min / max button
                        (function() {
                            var toggleMinMax = utils.getCellMeta(cell, 'kbase.cellState.toggleMinMax', 'maximized'),
                                toggleIcon = (toggleMinMax === 'maximized' ? 'minus' : 'plus'),
                                color = (toggleMinMax === 'maximized' ? '#000' : 'rgba(255,137,0,1)');
                            return button({
                                type: 'button',
                                class: 'btn btn-default btn-xs',
                                dataToggle: 'tooltip',
                                dataPlacement: 'left',
                                title: true,
                                dataOriginalTitle: toggleMinMax === 'maximized' ? 'Collapse Cell' : 'Expand Cell',
                                id: events.addEvent({ type: 'click', handler: doToggleMinMaxCell })
                            }, [
                                span({
                                    class: 'fa fa-' + toggleIcon + '-square-o fa-lg',
                                    style: {
                                        color: color
                                    }
                                })
                            ]);
                        }())
                    ])
                ],
                message = div({
                    class: 'pull-right messsage',
                    style: {
                        fontStyle: 'italic'
                    }
                }, [
                    div([
                        utils.getCellMeta(cell, 'kbase.cellState.message')
                    ])
                ]),
                content = div({ class: 'kb-cell-toolbar container-fluid' }, [
                    div({ class: 'row', style: { height: '56px' } }, [
                        div({ class: 'col-sm-9 title-container' }, [
                            div({ class: 'title', style: { display: 'flex', height: '56px' } }, [
                                div({
                                    dataElement: 'icon',
                                    class: 'icon',
                                    style: {
                                        xposition: 'relative',
                                        xtop: '0',
                                        xleft: '0',
                                        xdisplay: 'inline-block',
                                        flexShrink: '0',
                                        width: '56px',
                                        height: '56px',
                                        lineHeight: '56px'
                                    }
                                }, [
                                    buildIcon(cell)
                                ]),
                                div({ style: { flexGrow: '1' } }, [
                                    div({ dataElement: 'title', class: 'title', style: { lineHeight: '20px', height: '20px', marginTop: '8px', overflow: 'hidden' } }, [getCellTitle(cell)]),
                                    div({ dataElement: 'subtitle', class: 'subtitle', style: { lineHeight: '20px', height: '20px', overflow: 'hidden' } }, [getCellSubtitle(cell)])
                                    // div({dataElement: 'info-link', class: 'info-link'}, [getCellInfoLink(cell, events)])
                                ])
                            ])
                        ]),
                        div({ class: 'col-sm-3 buttons-container' }, [
                            buttons,
                            message
                        ])
                    ])
                ]);
            // if (Jupyter.narrative.readonly) {
            //     $(content).find('.buttons-container').hide();
            // }

            return {
                events: events,
                content: content
            };
        }

        function callback(toolbarDiv, parentCell) {
            try {
                container = toolbarDiv[0];
                cell = parentCell;
                var rendered = render(parentCell);
                container.innerHTML = rendered.content;
                $(container).find('button').tooltip();
                rendered.events.attachEvents();

                // try this...
                container.addEventListener('dblclick', function(e) {
                    doToggleMinMaxCell(e);
                });
            } catch (ex) {
                console.error('ERROR in cell toolbar callback', ex);
            }
        }

        return {
            register_callback: callback
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
