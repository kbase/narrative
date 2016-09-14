/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'common/events',
    'base/js/namespace',
    'common/utils',
    'util/bootstrapDialog',
    'kbase/js/widgets/appWidgets/infoPanel'
], function ($, html, Events, Jupyter, utils, BootstrapDialog, AppInfoPanel) {
    'use strict';

    var t = html.tag,
        div = t('div'), a = t('a'),
        button = t('button'), p = t('p'),
        span = t('span'), ul = t('ul'), li = t('li');

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
            cell;

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

        function doToggleMinMaxCell() {
            cell.element.trigger('toggleMinMax.cell');
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
                    $('<button type="button" class="btn btn-primary">Close</button>').click(function () {
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
            infoPanel.start({node: dialog.getBody()});

            dialog.getElement().on('hidden.bs.modal', function () {
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
                id: events.addEvent({type: 'click', handler: doToggleCellSettings})
            }, [
                span({class: 'fa fa-cog', style: 'font-size: 14pt'})
            ]);
        }

        function renderIcon(icon) {
            return span({
                class: 'fa fa-' + icon.type + ' fa-sm',
                style: {color: icon.color || '#000'}
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
                    {
                        name: 'toggle-collapse',
                        label: toggleMinMax === 'maximized' ? 'Collapse' : 'Expand',
                        icon: {
                            type: toggleIcon + '-square-o',
                            color: 'orange'
                        },
                        id: events.addEvent({type: 'click', handler: doToggleMinMaxCell})
                    }
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
                    id: events.addEvent({type: 'click', handler: doToggleCodeView})
                });
            }
            
            menuItems.push({
                type: 'separator'
            });
            menuItems.push({
                name: 'delete-cell',
                label: 'Delete cell',
                icon: {
                    type: 'times',
                    color: 'red'
                },
                id: events.addEvent({type: 'click', handler: doDeleteCell})
            });


            return span({class: 'dropdown'}, [
                button({
                    class: 'btn btn-xs btn-default dropdown-toggle',
                    type: 'button',
                    id: dropdownId,
                    dataToggle: 'dropdown',
                    ariaHaspopup: 'true',
                    ariaExpanded: 'true'
                }, [span({class: 'fa fa-ellipsis-h fa-lg'})]),
                ul({class: 'dropdown-menu dropdown-menu-right', ariaLabelledby: dropdownId}, [
                    menuItems.map(function (item) {
                        switch (item.type) {
                            case 'separator':
                                return li({
                                    role: 'separator',
                                    class: 'divider'
                                });
                            default:
                                return li(button({
                                    class: 'btn btn-default',
                                    id: item.id
                                }, [
                                    span({style: {
                                            display: 'inline-block',
                                            width: '25px',
                                            textAlign: 'left',
                                            marginRight: '4px'
                                        }}, renderIcon(item.icon)),
                                    span(item.label)]));
                        }
                    }).join('')
                ])
            ]);
        }

        function buildIcon(cell) {
            if (cell && cell.getIcon) {
                return cell.getIcon();
            }
            return span({class: 'fa fa-file fa-2x', style: {
                    verticalAlign: 'top',
                    xlineHeight: '56px'
                }
            });
        }

        function render(cell) {
            var events = Events.make({node: container}),
                buttons = Jupyter.narrative.readonly ? [] : [
                div({class: 'buttons pull-right'}, [
                    span({class: 'kb-func-timestamp'}),
                    span({class: 'fa fa-circle-o-notch fa-spin', style: {color: 'rgb(42, 121, 191)', display: 'none'}}),
                    span({class: 'fa fa-exclamation-triangle', style: {color: 'rgb(255, 0, 0)', display: 'none'}}),                   
                    button({
                        type: 'button',
                        class: 'btn btn-default btn-xs',
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: true,
                        dataOriginalTitle: 'Move Cell Up',
                        id: events.addEvent({type: 'click', handler: doMoveCellUp})
                    }, [
                        span({class: 'fa fa-arrow-up fa-lg'})
                    ]),
                    button({
                        type: 'button',
                        class: 'btn btn-default btn-xs',
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: true,
                        dataOriginalTitle: 'Move Cell Down',
                        id: events.addEvent({type: 'click', handler: doMoveCellDown})
                    }, [
                        span({class: 'fa fa-arrow-down fa-lg', style: 'xfont-size: 18px'})
                    ]),
                    renderOptions(cell, events)
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
//                    button({
//                        type: 'button',
//                        class: 'btn btn-default btn-xs',
//                        dataToggle: 'tooltip',
//                        dataPlacement: 'left',
//                        title: true,
//                        dataOriginalTitle: toggleMinMax === 'maximized' ? 'Collapse Cell' : 'Expand Cell',
//                        id: events.addEvent({type: 'click', handler: doToggleMinMaxCell})
//                    }, [
//                        span({class: 'fa fa-' + toggleIcon + '-square-o', style: {fontSize: '14pt', color: 'orange'}})
//                    ])

                ])
            ],
                content = div({class: 'kb-cell-toolbar container-fluid'}, [
                    div({class: 'row', style: {height: '56px'}}, [
                        div({class: 'col-sm-8 title-container'}, [
                            div({class: 'title', style: {display: 'inline-block', height: '56px'}}, [
                                div({dataElement: 'icon', class: 'icon', style: {position: 'relative', top: '0', left: '0', display: 'inline-block', height: '56px', lineHeight: '56px'}}, [
                                    buildIcon(cell)
                                ]),
                                div({style: {display: 'inline-block'}}, [
                                    div({dataElement: 'title', class: 'title', style: {lineHeight: '20px'}}, [getCellTitle(cell)]),
                                    div({dataElement: 'subtitle', class: 'subtitle', style: {lineHeight: '20px'}}, [getCellSubtitle(cell)]),
                                    div({dataElement: 'info-link', class: 'info-link'}, [getCellInfoLink(cell, events)])
                                ])
                            ])
                        ]),
                        div({class: 'col-sm-4 buttons-container'}, buttons)
                    ])
                ]);
            if (Jupyter.narrative.readonly) {
                $(content).find('.buttons-container').hide();
            }

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
            } catch (ex) {
                console.error('ERROR in cell toolbar callback', ex);
            }
        }

        return {
            register_callback: callback
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});