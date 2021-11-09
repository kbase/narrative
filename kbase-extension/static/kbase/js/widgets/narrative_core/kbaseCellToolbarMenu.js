define([
    'jquery',
    'common/html',
    'common/events',
    'base/js/namespace',
    'common/cellUtils',
    'narrativeConfig',
    'common/jobs',
    'custom/custom',
], ($, html, Events, Jupyter, utils, Config, Jobs) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        a = t('a'),
        button = t('button'),
        span = t('span'),
        ul = t('ul'),
        li = t('li'),
        cssBaseClass = 'kb-cell-toolbar';

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

    function factory() {
        const readOnly = Jupyter.narrative.readonly;
        let container, cell;

        function doMoveCellUp() {
            Jupyter.notebook.move_cell_up();
        }

        function doMoveCellDown() {
            Jupyter.notebook.move_cell_down();
        }

        function doDeleteCell() {
            $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
        }

        function getCellTitle(_cell) {
            const title = getMeta(_cell, 'attributes', 'title'),
                showTitle = utils.getCellMeta(_cell, 'kbase.cellState.showTitle', true);

            return showTitle ? title : '';
        }

        function getCellSubtitle(_cell) {
            const subTitle = getMeta(_cell, 'attributes', 'subtitle'),
                showTitle = utils.getCellMeta(_cell, 'kbase.cellState.showTitle', true);

            return showTitle ? subTitle : '';
        }

        function doToggleMinMaxCell(e) {
            if (e.getModifierState) {
                const modifier = e.getModifierState('Alt');
                if (modifier) {
                    // TODO: implement global cell toggling
                }
            }
            cell.toggleMinMax();
        }

        function doToggleCodeView() {
            cell.element.trigger('toggleCodeArea.cell');
        }

        function isCodeShowing(_cell) {
            return _cell.isCodeShowing ? _cell.isCodeShowing() : null;
        }

        function renderIcon(icon) {
            return span({
                class: `${cssBaseClass}__icon--${icon.type} fa fa-${icon.type} fa-sm`,
            });
        }

        function buildIcon(_cell) {
            if (_cell && _cell.getIcon) {
                return _cell.getIcon();
            }
            return span({
                class: `${cssBaseClass}__icon--build_icon fa fa-thumbs-down fa-2x`,
            });
        }

        const buttonClasses = 'btn btn-default btn-xs';
        const buttonBase = {
            type: 'button',
            class: `${buttonClasses} ${cssBaseClass}__button`,
            dataToggle: 'tooltip',
            dataPlacement: 'left',
            title: true,
        };

        function renderOptions(_cell, events) {
            const dropdownId = html.genId(),
                menuItems = [];

            if (_cell.cell_type === 'code') {
                menuItems.push({
                    name: 'code-view',
                    label: isCodeShowing(_cell) ? 'Hide code' : 'Show code',
                    icon: {
                        type: 'terminal',
                    },
                    id: events.addEvent({ type: 'click', handler: doToggleCodeView }),
                });
            }

            if (_cell.showInfo) {
                menuItems.push({
                    name: 'info',
                    label: 'Info',
                    icon: {
                        type: 'info',
                    },
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            _cell.showInfo();
                        },
                    }),
                });
            }

            if (!readOnly) {
                if (_cell.toggleBatch && Config.get('features').batchAppMode) {
                    menuItems.push({
                        name: 'batch',
                        label: 'Toggle Batch',
                        icon: {
                            type: 'table',
                        },
                        id: events.addEvent({
                            type: 'click',
                            handler: () => {
                                _cell.toggleBatch();
                            },
                        }),
                    });
                }

                if (menuItems.length > 0) {
                    menuItems.push({
                        type: 'separator',
                    });
                }

                menuItems.push({
                    name: 'delete-cell',
                    label: 'Delete cell',
                    icon: {
                        type: 'times',
                    },
                    id: events.addEvent({ type: 'click', handler: doDeleteCell }),
                });
            }

            if (menuItems.length === 0) {
                return '';
            }

            return span({ class: 'dropdown' }, [
                button(
                    {
                        class: `${buttonClasses} ${cssBaseClass}__button dropdown-toggle`,
                        type: 'button',
                        id: dropdownId,
                        dataToggle: 'dropdown',
                        ariaHaspopup: 'true',
                        ariaExpanded: 'true',
                        ariaLabel: 'cell options',
                        dataElement: 'cell-dropdown',
                    },
                    [span({ class: 'fa fa-ellipsis-h fa-lg' })]
                ),
                ul(
                    {
                        class: 'dropdown-menu dropdown-menu-right',
                        ariaLabelledby: dropdownId,
                    },
                    [
                        menuItems
                            .map((item) => {
                                if (item.type === 'separator') {
                                    return li({
                                        role: 'separator',
                                        class: 'divider',
                                    });
                                }
                                return li(
                                    button(
                                        {
                                            class: `${cssBaseClass}__dropdown_item btn btn-default`,
                                            type: 'button',
                                            id: item.id,
                                            title: item.label,
                                            dataElement: item.name,
                                        },
                                        [
                                            span(
                                                {
                                                    class: `${cssBaseClass}__dropdown_item_icon`,
                                                },
                                                renderIcon(item.icon)
                                            ),
                                            span(item.label),
                                        ]
                                    )
                                );
                            })
                            .join(''),
                    ]
                ),
            ]);
        }

        function render(_cell) {
            // The cell metadata 'kbase.cellState.toggleMinMax' is the
            // canonical indicator of whether a cell is collapsed or not.
            const cellCollapsed =
                utils.getCellMeta(_cell, 'kbase.cellState.toggleMinMax', 'maximized') !==
                'maximized';
            let collapsedCellJobStatus = '';

            if (cellCollapsed) {
                if (utils.getCellMeta(_cell, 'kbase.appCell.fsm')) {
                    const fsmMode = utils.getCellMeta(
                            _cell,
                            'kbase.appCell.fsm.currentState.mode',
                            ''
                        ),
                        fsmStage = utils.getCellMeta(
                            _cell,
                            'kbase.appCell.fsm.currentState.stage',
                            ''
                        );
                    collapsedCellJobStatus = Jobs.createJobStatusFromFsm(fsmMode, fsmStage);
                } else if (utils.getCellMeta(_cell, 'kbase.bulkImportCell.state.state')) {
                    const currentState = utils.getCellMeta(
                        _cell,
                        'kbase.bulkImportCell.state.state'
                    );
                    collapsedCellJobStatus = Jobs.createJobStatusFromBulkCellFsm(currentState);
                }
            }

            const events = Events.make({ node: container }),
                title = getCellTitle(_cell),
                subtitle = getCellSubtitle(_cell),
                buttons = [
                    div(
                        {
                            class: `${cssBaseClass}__buttons-container`,
                        },
                        [
                            // indicates the job status when the cell is collapsed
                            collapsedCellJobStatus,
                            // options dropdown
                            renderOptions(_cell, events),
                            readOnly
                                ? null
                                : button(
                                      Object.assign({}, buttonBase, {
                                          dataOriginalTitle: 'Move Cell Up',
                                          dataElement: 'cell-move-up',
                                          'aria-label': 'Move cell up',
                                          id: events.addEvent({
                                              type: 'click',
                                              handler: doMoveCellUp,
                                          }),
                                      }),
                                      [span({ class: 'fa fa-arrow-up fa-lg' })]
                                  ),
                            readOnly
                                ? null
                                : button(
                                      Object.assign({}, buttonBase, {
                                          dataOriginalTitle: 'Move Cell Down',
                                          dataElement: 'cell-move-down',
                                          'aria-label': 'Move cell down',
                                          id: events.addEvent({
                                              type: 'click',
                                              handler: doMoveCellDown,
                                          }),
                                      }),
                                      [span({ class: 'fa fa-arrow-down fa-lg' })]
                                  ),
                            (function () {
                                const toggleMinMax = utils.getCellMeta(
                                        _cell,
                                        'kbase.cellState.toggleMinMax',
                                        'maximized'
                                    ),
                                    toggleIcon = toggleMinMax === 'maximized' ? 'minus' : 'plus';

                                return button(
                                    Object.assign({}, buttonBase, {
                                        dataElement: 'cell-toggle-expansion',
                                        'aria-label': 'Expand or Collapse Cell',
                                        dataOriginalTitle:
                                            toggleMinMax === 'maximized'
                                                ? 'Collapse Cell'
                                                : 'Expand Cell',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: doToggleMinMaxCell,
                                        }),
                                    }),
                                    [
                                        span({
                                            class: `${cssBaseClass}__icon--${toggleIcon} fa fa-${toggleIcon}-square-o fa-lg`,
                                        }),
                                    ]
                                );
                            })(),
                        ]
                    ),
                ],
                content = div(
                    {
                        class: `${cssBaseClass}__container`,
                    },
                    [
                        div(
                            {
                                dataElement: 'icon',
                                class: `${cssBaseClass}__app_icon`,
                            },
                            [buildIcon(_cell)]
                        ),
                        div(
                            {
                                class: `${cssBaseClass}__title-container`,
                            },
                            [
                                div(
                                    {
                                        dataElement: 'title',
                                        class: `${cssBaseClass}__title`,
                                        title: title,
                                    },
                                    [getOutdatedWarning(_cell), title]
                                ),
                                div(
                                    {
                                        dataElement: 'subtitle',
                                        class: `${cssBaseClass}__subtitle`,
                                        title: subtitle,
                                    },
                                    subtitle
                                ),
                            ]
                        ),
                        buttons,
                    ]
                );
            return {
                events: events,
                content: content,
            };
        }

        function getOutdatedWarning(_cell) {
            if (utils.getCellMeta(_cell, 'kbase.appCell.outdated', false)) {
                return a(
                    {
                        tabindex: '0',
                        type: 'button',
                        class: `${buttonClasses} ${cssBaseClass}__button ${cssBaseClass}__icon--outdated`,
                        dataContainer: 'body',
                        container: 'body',
                        dataToggle: 'popover',
                        dataPlacement: 'bottom',
                        dataTrigger: 'focus',
                        role: 'button',
                        title: 'New version available',
                        dataContent:
                            'This app has a newer version available! ' +
                            "There's probably nothing wrong with this version, " +
                            'but the new one may include new features. Add a new "' +
                            utils.getCellMeta(_cell, 'kbase.appCell.newAppName') +
                            '" app cell for the update.',
                        style: { color: '#f79b22' },
                    },
                    [span({ class: 'fa fa-exclamation-triangle fa-lg' })]
                );
            }
            return '';
        }

        function callback(toolbarDiv, parentCell) {
            try {
                container = toolbarDiv[0];
                cell = parentCell;
                const rendered = render(parentCell);
                container.innerHTML = rendered.content;
                $(container).find('button').tooltip();
                $(container).find('[data-toggle="popover"]').popover();
                rendered.events.attachEvents();

                // try this...
                container.addEventListener('dblclick', (e) => {
                    doToggleMinMaxCell(e);
                });
            } catch (ex) {
                console.error('ERROR in cell toolbar callback', ex);
            }
        }

        return {
            register_callback: callback,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
