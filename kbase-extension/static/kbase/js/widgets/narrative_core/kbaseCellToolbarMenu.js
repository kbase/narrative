define([
    'jquery',
    'common/html',
    'common/events',
    'base/js/namespace',
    'common/cellUtils',
    'narrativeConfig',
    'common/jobs',
    'common/runtime',
    'util/icon',

    'custom/custom',
], ($, html, Events, Jupyter, utils, Config, Jobs, Runtime, icon) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        ul = t('ul'),
        li = t('li'),
        cssBaseClass = 'kb-cell-toolbar';

    const runtime = Runtime.make();

    function factory() {
        const readOnly = Jupyter.narrative.readonly;
        let container, cell;

        function doMoveCellToTop(cell) {
            const { cellIndex, isFirst } = getCellStats(cell);
            if (isFirst) {
                console.warn('Already the first element!');
                return;
            }
            selectCell(cell);
            const moveCount = cellIndex;
            for (let i = 0; i < moveCount; i += 1) {
                Jupyter.notebook.move_selection_up();
            }
        }

        function doMoveCellToBottom(cell) {
            const { cellIndex, cellCount, isLast } = getCellStats(cell);
            if (isLast) {
                console.warn('Already the last element!');
                return;
            }
            selectCell(cell);
            const moveCount = cellCount - cellIndex - 1;
            for (let i = 0; i < moveCount; i += 1) {
                Jupyter.notebook.move_selection_down();
            }
        }

        function doDeleteCell() {
            $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
        }

        function getCellTitle(_cell) {
            const title = utils.getMeta(_cell, 'attributes', 'title'),
                showTitle = utils.getCellMeta(_cell, 'kbase.cellState.showTitle', true);

            return showTitle ? title : '';
        }

        function getCellSubtitle(_cell) {
            const subTitle = utils.getMeta(_cell, 'attributes', 'subtitle'),
                showTitle = utils.getCellMeta(_cell, 'kbase.cellState.showTitle', true);

            return showTitle ? subTitle : '';
        }

        function doToggleMinMaxCell(e) {
            const isMaximized = cell.getToggleMode() === 'maximized';
            if (e.getModifierState && e.getModifierState('Alt')) {
                for (const cell of Jupyter.notebook.get_cells()) {
                    if (isMaximized) {
                        if (cell.getToggleMode() === 'maximized') {
                            cell.toggleMinMax();
                        }
                    } else {
                        if (cell.getToggleMode() === 'minimized') {
                            cell.toggleMinMax();
                        }
                    }
                }
            } else {
                cell.toggleMinMax();
            }
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

        function renderDeveloperCodeViewToggleButton(events) {
            if (!runtime.isDeveloper()) {
                return '';
            }
            if (cell.cell_type === 'code') {
                const attribs = Object.assign({}, buttonBase, {
                    id: handleClick(events, doToggleCodeView),
                });
                if (isCodeShowing(cell)) {
                    attribs.title = 'Hide code';
                    attribs.class += ' active';
                } else {
                    attribs.title = 'Show code';
                }
                return button(attribs, span({ class: 'fa fa-terminal fa-lg' }));
            }
        }

        function renderDeveloperDeleteButton(events) {
            if (!runtime.isDeveloper() || readOnly) {
                return '';
            }
            const attribs = Object.assign({}, buttonBase, {
                title: 'Delete cell...',
                id: handleClick(events, doDeleteCell),
            });
            return button(attribs, span({ class: 'fa fa-trash fa-lg text-danger' }));
        }

        function doRunCell(cell) {
            cell.execute();
        }

        function renderDeveloperRunCellButton(events) {
            if (!runtime.isDeveloper() || readOnly || cell.cell_type !== 'code') {
                return '';
            }
            const attribs = Object.assign({}, buttonBase, {
                title: 'Run cell ',
                id: handleClick(events, () => doRunCell(cell)),
            });

            return button(attribs, span({ class: 'fa fa-repeat fa-lg ' }));
        }

        function getCellStats(cell) {
            const cellIndex = Jupyter.notebook.find_cell_index(cell);
            const cellCount = Jupyter.notebook.get_cells().length;
            const isFirst = cellIndex === 0;
            const isLast = cellIndex === cellCount - 1;
            return { cellIndex, cellCount, isFirst, isLast };
        }

        function selectCell(cell) {
            for (const other_cell of Jupyter.notebook.get_cells()) {
                other_cell.unselect();
            }
            cell.select();
        }

        function doMoveCellUp(cell) {
            const { isFirst } = getCellStats(cell);
            selectCell(cell);

            if (isFirst) {
                console.warn('Already the first cell!');
                return;
            }
            Jupyter.notebook.move_cell_up();
        }

        function renderMoveCellUp(cell, events) {
            if (readOnly) {
                return;
            }

            const attribs = Object.assign({}, buttonBase, {
                dataOriginalTitle: 'Move Cell Up',
                dataElement: 'cell-move-up',
                ariaLabel: 'Move cell up',
                id: handleClick(events, () => doMoveCellUp(cell)),
            });
            return button(attribs, [span({ class: 'fa fa-arrow-up fa-lg' })]);
        }

        function doMoveCellDown(cell) {
            const { isLast } = getCellStats(cell);
            selectCell(cell);

            if (isLast) {
                console.warn('Already the last cell!');
                return;
            }

            Jupyter.notebook.move_cell_down();
        }

        function renderMoveCellDown(cell, events) {
            if (readOnly) {
                return;
            }

            const attribs = Object.assign({}, buttonBase, {
                dataOriginalTitle: 'Move Cell Down',
                dataElement: 'cell-move-down',
                ariaLabel: 'Move cell down',
                id: handleClick(events, () => doMoveCellDown(cell)),
            });
            return button(attribs, [span({ class: 'fa fa-arrow-down fa-lg' })]);
        }

        function renderMoveToTop(cell, events) {
            if (!runtime.isDeveloper() || readOnly) {
                return;
            }
            const attribs = Object.assign({}, buttonBase, {
                dataOriginalTitle: 'Move Cell To Top',
                dataElement: 'cell-move-to-top',
                ariaLabel: 'Move cell to top',
                id: handleClick(events, () => doMoveCellToTop(cell)),
            });
            return button(attribs, [span({ class: 'fa fa-long-arrow-up fa-lg' })]);
        }

        function renderMoveToBottom(cell, events) {
            if (!runtime.isDeveloper() || readOnly) {
                return;
            }
            const attribs = Object.assign({}, buttonBase, {
                dataOriginalTitle: 'Move Cell To Bottom',
                dataElement: 'cell-move-to-bottom',
                ariaLabel: 'Move cell to bottom',
                id: handleClick(events, () => doMoveCellToBottom(cell)),
            });
            return button(attribs, [span({ class: 'fa fa-long-arrow-down fa-lg' })]);
        }

        function handleClick(events, handler) {
            const id = events.addEvent({ type: 'click', handler });
            events.addEvent({
                type: 'dblclick',
                id,
                handler: (e) => {
                    e.stopPropagation();
                },
            });
            return id;
        }

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
                    id: handleClick(events, doToggleCodeView),
                });
            }

            if (_cell.showInfo) {
                menuItems.push({
                    name: 'info',
                    label: 'Info',
                    icon: {
                        type: 'info',
                    },
                    id: handleClick(events, () => _cell.showInfo()),
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
                        id: handleClick(events, () => _cell.toggleBatch()),
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
                    id: handleClick(events, doDeleteCell),
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
                } else if (utils.getCellMeta(_cell, 'kbase.bulkImportCell.exec.jobs')) {
                    const currentJobs = utils.getCellMeta(
                        _cell,
                        'kbase.bulkImportCell.exec.jobs.byId'
                    );
                    collapsedCellJobStatus = Jobs.createCombinedJobStateSummary(currentJobs);
                }
            }

            const extraIcon = (() => {
                const extraIcon = utils.getCellMeta(
                    _cell,
                    'kbase.attributes.icon.params.extraIcon'
                );
                if (extraIcon) {
                    return div(
                        {
                            dataElement: 'icon',
                            class: `${cssBaseClass}__app_icon`,
                        },
                        [icon.makeGenericIcon(extraIcon.classSuffix)]
                    );
                } else {
                    return '';
                }
            })();

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
                            span(
                                {
                                    dataElement: 'job-status',
                                },
                                collapsedCellJobStatus
                            ),
                            renderDeveloperRunCellButton(events),
                            renderDeveloperCodeViewToggleButton(events),
                            renderDeveloperDeleteButton(events),

                            renderMoveToTop(_cell, events),
                            renderMoveToBottom(_cell, events),
                            // options dropdown
                            renderOptions(_cell, events),
                            renderMoveCellUp(_cell, events),
                            renderMoveCellDown(_cell, events),
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
                                        ariaLabel: 'Expand or Collapse Cell',
                                        dataOriginalTitle:
                                            toggleMinMax === 'maximized'
                                                ? 'Collapse Cell'
                                                : 'Expand Cell',
                                        id: handleClick(events, doToggleMinMaxCell),
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
                        extraIcon,
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
                events,
                content,
            };
        }

        function getOutdatedWarning(_cell) {
            if (utils.getCellMeta(_cell, 'kbase.appCell.outdated', false)) {
                return span(
                    {
                        tabindex: '0',
                        class: `${cssBaseClass}__icon--outdated`,
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
                    },
                    [span({ class: 'fa fa-exclamation-triangle' })]
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

                container.addEventListener('dblclick', (e) => {
                    // // Prevent a double click on another element from trigger a min/max
                    // // toggle. This can happen easily if one accidentally double-clicks
                    // // on an element, or uses a toggle control quickly.
                    // console.log('double trouble', e.target, e.currentTarget, container);
                    // if (e.target !== container) {
                    //     return;
                    // }
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
