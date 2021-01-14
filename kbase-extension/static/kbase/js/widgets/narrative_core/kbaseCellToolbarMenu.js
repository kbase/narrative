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
    'narrativeConfig',
    'custom/custom'
], function (
    $,
    html,
    Events,
    Jupyter,
    utils,
    BootstrapDialog,
    AppInfoPanel,
    Config
) {
    'use strict';

    const t = html.tag,
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
            const cellIndex = Jupyter.notebook.find_cell_index(cell);
            Jupyter.notebook.move_cell_up(cellIndex);
        }

        function doMoveCellDown() {
            const cellIndex = Jupyter.notebook.find_cell_index(cell);
            Jupyter.notebook.move_cell_down(cellIndex);
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
            const dropdownId = html.genId();
            const menuItems = [];

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
                        handler: function () {
                            cell.showInfo();
                        }
                    })
                });
            }

            if (cell.toggleBatch && Config.get('features').batchAppMode) {
                menuItems.push({
                    name: 'batch',
                    label: 'Toggle Batch',
                    icon: {
                        type: 'table',
                        color: 'black'
                    },
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            cell.toggleBatch();
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
                    id: events.addEvent({type: 'click', handler: doDeleteCell})
                });
            }

            if (menuItems.length === 0) {
                return '';
            }

            return span({class: 'dropdown'}, [
                button({
                    class: 'btn btn-xs btn-default dropdown-toggle',
                    type: 'button',
                    id: dropdownId,
                    dataToggle: 'dropdown',
                    ariaHaspopup: 'true',
                    ariaExpanded: 'true',
                    'aria-label': 'cell options',
                    'data-test': 'cell-dropdown'
                }, [span({class: 'fa fa-ellipsis-h fa-lg'})]),
                ul({
                    class: 'dropdown-menu dropdown-menu-right',
                    ariaLabelledby: dropdownId
                }, [
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

        function minimizedStatus(mode, stage) {
            if (mode === 'error' || mode === 'internal-error') {
                return '<span style="color: red">Error</span>';
            }
            if (mode === 'canceled' || mode === 'canceling') {
                return '<span style="color: orange">Canceled</span>';
            }
            if (mode === 'processing' && stage === 'running') {
                return 'Running';
            }
            if (mode === 'processing' && stage === 'queued') {
                return 'Queued';
            }
            if (mode === 'success') {
                return '<span style="color: green">Success</span>';
            }
            return '';
        }

        function render(cell) {
            /*
            The cell metadata 'kbase.cellState.toggleMinMax' is the
            canonical indicator of whether a cell is collapsed or not.
            */
            const cellCollapsed = utils.getCellMeta(
                cell, 'kbase.cellState.toggleMinMax', 'maximized'
            ) !== 'maximized';
            const fsmMode = utils.getCellMeta(
                cell, 'kbase.appCell.fsm.currentState.mode', ''
            );
            const fsmStage = utils.getCellMeta(
                cell, 'kbase.appCell.fsm.currentState.stage', ''
            );
            const appStatePretty = minimizedStatus(fsmMode, fsmStage);
            const collapsedCellStatus = cellCollapsed ? appStatePretty : '';

            var events = Events.make({node: container}),
                buttons = [
                    div({class: 'buttons pull-right'}, [
                        renderOptions(cell, events),
                        span({
                            class: 'fa fa-circle-o-notch fa-spin',
                            style: {color: 'rgb(42, 121, 191)', display: 'none'}
                        }),
                        span({class: 'fa fa-exclamation-triangle', style: {color: 'rgb(255, 0, 0)', display: 'none'}}),
                        (readOnly ? null : button({
                            type: 'button',
                            class: 'btn btn-default btn-xs',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: true,
                            dataOriginalTitle: 'Move Cell Up',
                            'data-test': 'cell-move-up',
                            'aria-label': 'Move cell up',
                            id: events.addEvent({type: 'click', handler: doMoveCellUp})
                        }, [
                            span({class: 'fa fa-arrow-up fa-lg'})
                        ])),
                        (readOnly ? null : button({
                            type: 'button',
                            class: 'btn btn-default btn-xs',
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: true,
                            dataOriginalTitle: 'Move Cell Down',
                            'data-test': 'cell-move-down',
                            'aria-label': 'Move cell down',
                            id: events.addEvent({type: 'click', handler: doMoveCellDown})
                        }, [
                            span({class: 'fa fa-arrow-down fa-lg'})
                        ])),

                        (function () {
                            const toggleMinMax = utils.getCellMeta(cell, 'kbase.cellState.toggleMinMax', 'maximized'),
                                toggleIcon = (toggleMinMax === 'maximized' ? 'minus' : 'plus'),
                                classModifier = (toggleMinMax === 'maximized' ? '-maximized' : '-minimized');
                            return button({
                                type: 'button',
                                class: `btn btn-default btn-xs kb-btn-expander ${classModifier}`,
                                dataToggle: 'tooltip',
                                dataPlacement: 'left',
                                title: true,
                                'data-test': 'cell-toggle-expansion',
                                'aria-label': 'Expand or Collapse Cell',
                                dataOriginalTitle: toggleMinMax === 'maximized' ? 'Collapse Cell' : 'Expand Cell',
                                id: events.addEvent({type: 'click', handler: doToggleMinMaxCell})
                            }, [
                                span({
                                    class: 'fa fa-' + toggleIcon + '-square-o fa-lg'
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
                content = div({class: 'kb-cell-toolbar'}, [
                    div({
                        class: '', style: {
                            display: 'flex',
                            flexDirection: 'row',
                            height: '56px',
                            justifyContent: 'space-between',
                        }
                    }, [
                        div({
                            class: 'title-container',
                            style: {flexGrow: '1'}
                        }, [
                            div({
                                class: 'title', style: {
                                    display: 'flex', height: '56px'
                                }
                            }, [
                                div({
                                    dataElement: 'icon',
                                    class: 'icon',
                                    style: {
                                        flexShrink: '0',
                                        width: '56px',
                                        height: '56px',
                                        lineHeight: '56px'
                                    }
                                }, [
                                    buildIcon(cell)
                                ]),
                                div({style: {flexGrow: '1'}}, [
                                    div({
                                        dataElement: 'title',
                                        class: 'title',
                                        style: {
                                            lineHeight: '20px',
                                            height: '20px',
                                            marginTop: '8px',
                                            overflow: 'hidden'
                                        }
                                    }, [
                                        getOutdatedWarning(cell),
                                        getCellTitle(cell),
                                    ]),
                                    div({
                                        dataElement: 'subtitle',
                                        class: 'subtitle',
                                        style: {
                                            lineHeight: '20px',
                                            height: '20px',
                                            overflow: 'hidden'
                                        }
                                    }, [getCellSubtitle(cell)])
                                ]),
                                div(
                                    {
                                        style: {
                                            margin: '0px 0px 0px auto',
                                            minWidth: '65px'
                                        }
                                    },
                                    [collapsedCellStatus]
                                )
                            ])
                        ]),
                        div({
                            class: 'buttons-container',
                            style: {minWidth: '110px'}
                        }, [
                            buttons,
                            message
                        ])
                    ])
                ]);
            return {
                events: events,
                content: content
            };
        }

        function getOutdatedWarning(cell) {
            if (utils.getCellMeta(cell, 'kbase.appCell.outdated', false)) {
                return a({
                    tabindex: '0',
                    type: 'button',
                    class: 'btn btn-default btn-xs',
                    dataContainer: 'body',
                    container: 'body',
                    dataToggle: 'popover',
                    dataPlacement: 'bottom',
                    dataTrigger: 'focus',
                    role: 'button',
                    title: 'New version available',
                    dataContent: 'This app has a newer version available! ' +
                        'There\'s probably nothing wrong with this version, ' +
                        'but the new one may include new features. Add a new "' +
                        utils.getCellMeta(cell, 'kbase.appCell.newAppName') +
                        '" app cell for the update.',
                    style: {color: '#f79b22'}
                }, [
                    span({class: 'fa fa-exclamation-triangle fa-lg'})
                ]);
            } else {
                return '';
            }
        }

        function callback(toolbarDiv, parentCell) {
            try {
                container = toolbarDiv[0];
                cell = parentCell;
                var rendered = render(parentCell);
                container.innerHTML = rendered.content;
                $(container).find('button').tooltip();
                $(container).find('[data-toggle="popover"]').popover();
                rendered.events.attachEvents();

                // try this...
                container.addEventListener('dblclick', function (e) {
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
        make: function (config) {
            return factory(config);
        }
    };
});
