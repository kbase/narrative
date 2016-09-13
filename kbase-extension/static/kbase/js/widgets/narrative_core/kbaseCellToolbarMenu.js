/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'common/events',
    'base/js/namespace',
    'common/utils',
    'common/runtime',
    'common/ui',
    'util/bootstrapDialog',
    'kbase/js/widgets/appWidgets/infoPanel'
], function ($, html, Events, Jupyter, utils, Runtime, UI, BootstrapDialog, AppInfoPanel) {
    'use strict';

    var t = html.tag,
        div = t('div'), a = t('a'),
        button = t('button'), p = t('p'), blockquote = t('blockquote'),
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
            // $(cell.element).find('.input_area').toggle();
        }

        function doToggleCellSettings() {
            cell.element.trigger('toggleCellSettings.cell');
        }

        function doShowInfoModal(e) {
            e.preventDefault();
            var version = utils.getCellMeta(cell, 'kbase.appCell.app.version'),
                authors = utils.getCellMeta(cell, 'kbase.appCell.app.spec.info.authors'),
                title = getMeta(cell, 'attributes', 'title') + ' v' + version,
                appStoreUrl = utils.getCellMeta(cell, 'kbase.attributes.info.url');
            var dialog = new BootstrapDialog({
                title: title,
                body: $('<div class="container"></div>'),
                buttons: [
                    $('<a href="' + appStoreUrl + '" target="_blank" type="button" class="btn btn-default">View on App Store</a>'),
                    $('<button type="button" class="btn btn-primary">Close</button>').click(function() { dialog.hide(); })
                ],
                enterToTrigger: true,
                closeButton: true
            });

            var infoPanel = AppInfoPanel.make({
                appId: utils.getCellMeta(cell, 'kbase.appCell.app.id'),
                appVersion: version,
                appAuthors: authors
            });
            infoPanel.start({node: dialog.getBody()});

            dialog.getElement().on('hidden.bs.modal', function () {
                dialog.destroy();
            });
            dialog.show();
        }

        function renderToggleCodeView(events) {
            var runtime = Runtime.make();
            // Only render if actually a code cell and in dev mode.
            // TODO: add cell extension to toggle code view, since this may
            // depend on cell state (or subtype)
            if (cell.cell_type !== 'code') {
                return;
            }
            // if (!ui.isDeveloper()) {
            //     return;
            // }

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
                buttons = Jupyter.narrative.readonly ? [] : [
                    div({class: 'buttons pull-right'}, [
                        span({class: 'kb-func-timestamp'}),
                        span({class: 'fa fa-circle-o-notch fa-spin', style: {color: 'rgb(42, 121, 191)', display: 'none'}}),
                        span({class: 'fa fa-exclamation-triangle', style: {color: 'rgb(255, 0, 0)', display: 'none'}}),
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
                            dataOriginalTitle: toggleMinMax === 'maximized' ? 'Collapse Cell' : 'Expand Cell',
                            id: events.addEvent({type: 'click', handler: doToggleMinMaxCell})
                        }, [
                            span({class: 'fa fa-' + toggleIcon + '-square-o', style: {fontSize: '14pt', color: 'orange'}})
                        ])

                    ])
                ],
                content = div({class: 'kb-cell-toolbar container-fluid'}, [
                    div({class: 'row'}, [
                        div({class: 'col-sm-8 title-container'}, [
                            div({class: 'title', style: {display: 'inline-block'}}, [
                                div({dataElement: 'title', class: 'title'}, [getCellTitle(cell)]),
                                div({dataElement: 'subtitle', class: 'subtitle'}, [getCellSubtitle(cell)]),
                                div({dataElement: 'title',
                                    class: 'info-link'
                                },
                                [getCellInfoLink(cell, events)])
                            ])
                        ]),
                        div({class: 'col-sm-4 buttons-container'}, buttons)
                    ])
                ]);
            var readOnly = Jupyter.narrative.readonly;
            if (readOnly) {
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
                ui = UI.make({node: container});
                cell = parentCell;
                var rendered = render();
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