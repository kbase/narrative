/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'common/events',
    'base/js/namespace',
    'common/utils',
    'common/runtime',
    'common/ui'
], function ($, html, Events, Jupyter, utils, Runtime, UI) {
    'use strict';

    var t = html.tag,
        div = t('div'), a = t('a'),
        button = t('button'), p = t('p'),
        span = t('span');

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
            ui;

//        function attachEvent(event, fun) {
//            var id = html.genId(),
//                selector = '#' + id + ', ' + '#' + id + ' *';
//            container.addEventListener(event, function (e) {
//                if (e.target.matches(selector)) {
//                    fun(e);
//                }
//            }, true);
//            return id;
//        }

        function doMoveCellUp(e) {
            Jupyter.notebook.move_cell_up();
        }
        function doMoveCellDown(e) {
            Jupyter.notebook.move_cell_down();
        }
        function doInsertCellAbove(e) {
            Jupyter.narrative.insertAndSelectCellAbove('markdown');
        }
        function doInsertCellBelow(e) {
            Jupyter.narrative.insertAndSelectCellBelow('markdown');
        }
        function doToggleCellType(e) {
            if (this.options.cell.cell_type === "markdown") {
                Jupyter.notebook.to_code();
            } else {
                Jupyter.notebook.to_markdown();
            }
        }
        function doToggleCell(e) {
            // Tell the associated cell to toggle.
            // the toolbar should be re-rendered when the cell metadata changes,
            // so it will naturally pick up the toggle state...
            $(e.target).trigger('toggle.cell');
        }

        function renderToggleState() {
            var toggleState = utils.getMeta(cell, 'cellState', 'toggleState'),
                toggleIcon = container.querySelector('[data-button="toggle"] > span'),
                openIcon = 'fa-chevron-down',
                closedIcon = 'fa-chevron-right';

            switch (toggleState) {
                case 'open':
                    toggleIcon.classList.remove(closedIcon);
                    toggleIcon.classList.add(openIcon);
                    break;
                case 'closed':
                    toggleIcon.classList.remove(openIcon);
                    toggleIcon.classList.add(closedIcon);
                    break;
                default:
                    toggleIcon.classList.remove(closedIcon);
                    toggleIcon.classList.add(openIcon);
                    // console.warn('INVALID TOGGLE STATE, ASSUMING OPEN', toggleState);
            }
        }

        function doDeleteCell() {
            //if (window.confirm('Delete cell?')) {
            //    $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
            //} 
            var content = div([
                p([
                    'Deleting this cell will not remove any output cells or data objects it may have created. ', 
                    'Any input parameters or other configuration of this cell will be lost.'
                ]),
                p([
                    'Note: It is not possible to "undo" the deletion of a cell, ', 
                    'but if the cell has not been saved you can refresh the page ',
                    'to load it from a previous state.'
                ]),
                p('Continue to delete this cell?')
            ]);
            ui.showConfirmDialog('Confirm Cell Deletion', content, 'Yes', 'No')
                .then(function (answer) {
                    if (answer) {
                        $(cell.element).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
                    } else {
                        // alert('Ok, will not delete the cell.');
                    }
                });
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

        function doToggleMinMaxCell() {
            cell.element.trigger('toggleMinMax.cell');
        }

        function doToggleCodeView() {
            cell.element.trigger('toggleCodeArea.cell');
            // $(cell.element).find('.input_area').toggle();
        }
        
        function doToggleCellSettings() {
            cell.element.trigger('toggleCellSettings.cell');
        }

        function renderToggleCodeView(events) {
            var runtime = Runtime.make();
            // Only render if actually a code cell and in dev mode.
            // TODO: add cell extension to toggle code view, since this may 
            // depend on cell state (or subtype)
            if (cell.cell_type !== 'code') {
                return;
            }
            if (!ui.isDeveloper()) {
                return;
            }

            return button({
                type: 'button',
                class: 'btn btn-default btn-xs',
                dataToggle: 'tooltip',
                dataPlacement: 'left',
                title: true,
                dataOriginalTitle: 'Toggle Code',
                id: events.addEvent({type: 'click', handler: doToggleCodeView})
            }, [
                span({class: 'fa fa-terminal', style: 'font-size: 14pt'})
            ]);
        }
        
        function renderToggleCellSettings(events) {
            // Only kbase cells have cell settings.
            if (!cell.metadata || !cell.metadata.kbase || !cell.metadata.kbase.type) {
                return
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

        function render() {
            var events = Events.make({node: container}),
                toggleMinMax = utils.getCellMeta(cell, 'kbase.cellState.toggleMinMax', 'maximized'),
                toggleIcon = (toggleMinMax === 'maximized' ? 'minus' : 'plus'),
                content = div({class: 'kb-cell-toolbar container-fluid'}, [
                    div({class: 'row'}, [
                        div({class: 'col-sm-8 title-container'}, [
                            div({class: 'title', style: {display: 'inline-block'}}, [
                                div({dataElement: 'title', class: 'title'}, [getCellTitle(cell)]),
                                div({dataElement: 'subtitle', class: 'subtitle'}, [getCellSubtitle(cell)])
                            ])
                        ]),
                        div({class: 'col-sm-4 buttons-container'}, [
                            div({class: 'buttons pull-right'}, [
                                span({class: 'kb-func-timestamp'}),
                                span({class: 'fa fa-circle-o-notch fa-spin', style: {color: 'rgb(42, 121, 191)', display: 'none'}}),
                                span({class: 'fa fa-exclamation-triangle', style: {color: 'rgb(255, 0, 0)', display: 'none'}}),
//                                span({class: 'dropdown'}, [
//                                    button({
//                                        type: 'button',
//                                        class: 'btn btn-default btn-xs',
//                                        dataToggle: 'dropdown',
//                                        ariaHaspopup: 'true'
//                                    }, [
//                                        span({class: 'fa fa-cog', style: {fontSize: '14pt'}})
//                                    ]),
                                // TODO: spacing on menu items is .. funky .. need a gap between the icon and the text. Rather the
                                // icon should take up a fixed width so that the menu item text aligns left.
//                                    ul({class: 'dropdown-menu dropdown-menu-right'}, [
//                                        // li(a({id: attachEvent('click', doViewJobSubmission)}, [span({class: 'fa fa-code'}), ' View Job Submission'])),
//                                        li(a({id: events.addEvent({type: 'click', handler: doInsertCellAbove})}, [span({class: 'fa fa-caret-square-o-up'}), ' Insert Cell Above'])),
//                                        li(a({id: events.addEvent({type: 'click', handler: doInsertCellBelow})}, [span({class: 'fa fa-caret-square-o-down'}), ' Insert Cell Below'])),
//                                        li(a({id: events.addEvent({type: 'click', handler: doDeleteCell})}, [span({class: 'fa fa-trash-o'}), ' Delete Cell']))
//                                            // li(a({id: addEvent('click', doToggleCellType)}, [span({class: 'fa fa-terminal'}), ' Toggle Cell Type']))
//                                    ])
//                                ]),
                                renderToggleCodeView(events),
                                renderToggleCellSettings(events),
                                
                                button({
                                    type: 'button',
                                    class: 'btn btn-default btn-xs',
                                    dataToggle: 'tooltip',
                                    dataPlacement: 'left',
                                    title: true,
                                    dataOriginalTitle: 'Move Cell Up',
                                    id: events.addEvent({type: 'click', handler: doMoveCellUp})
                                }, [
                                    span({class: 'fa fa-arrow-up', style: 'font-size: 14pt'})
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
                                    span({class: 'fa fa-arrow-down', style: 'font-size: 14pt'})
                                ]),
//                                button({
//                                    type: 'button',
//                                    class: 'btn btn-default btn-xs',
//                                    dataToggle: 'tooltip',
//                                    dataPlacement: 'left',
//                                    title: true,
//                                    dataOriginalTitle: 'Delete Cell',
//                                    id: attachEvent('click', doDeleteCell)
//                                }, [
//                                    span({class: 'fa fa-trash-o', style: 'font-size: 14pt'})
//                                ]),
                                button({
                                    type: 'button',
                                    class: 'btn btn-default btn-xs',
                                    dataToggle: 'tooltip',
                                    dataPlacement: 'left',
                                    title: true,
                                    dataOriginalTitle: 'Delete Cell',
                                    id: events.addEvent({type: 'click', handler: doDeleteCell})
                                }, [
                                    span({class: 'fa fa-times-circle', style: {fontSize: '14pt', color: 'red'}})
                                ]),
                                button({
                                    type: 'button',
                                    class: 'btn btn-default btn-xs',
                                    dataToggle: 'tooltip',
                                    dataPlacement: 'left',
                                    title: true,
                                    dataOriginalTitle: 'Minify Cell',
                                    id: events.addEvent({type: 'click', handler: doToggleMinMaxCell})
                                }, [
                                    span({class: 'fa fa-' + toggleIcon + '-square-o', style: {fontSize: '14pt', color: 'orange'}})
                                ])

                            ])
                        ])
                    ])
                ]);
            return {
                events: events,
                content: content
            };
        }

        function callback(toolbarDiv, parentCell) {
            try {
                container = toolbarDiv[0];
                ui = UI.make({node: container});
                cell = parentCell;
                var rendered = render();
                container.innerHTML = rendered.content;
                $(container).find('button').tooltip();
                rendered.events.attachEvents();

//                $(container).on('minimized.toolbar', function () {
//
//                });
//                $(container).on('maximized.toolbar', function () {
//
//                });

                // renderToggleState();
            } catch (ex) {
                console.error('ERROR in cell toolbar callback', ex);
            }
        }

        //function info(toolbarDiv, cell) {
        //    var id = cell.cell_id,
        //        content = span({style: {fontStyle: 'italic'}}, id);
        //    $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
        // }

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