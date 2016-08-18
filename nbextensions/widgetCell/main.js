/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'jquery',
    'uuid',
    'base/js/namespace',
    'common/utils',
    'common/runtime',
    'common/ui',
    'common/props',
    'common/appUtils',
    'kb_common/html',
    'common/pythonInterop',
    './widgets/widgetCellWidget'
], function (
    Promise,
    $,
    Uuid,
    Jupyter,
    utils,
    Runtime,
    UI,
    Props,
    AppUtils,
    html,
    PythonInterop,
    WidgetCellWidget
    ) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function specializeCell(cell) {
        cell.minimize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                widgetArea = this.element.find('[data-subarea-type="widget-area"]'),
                showCode = utils.getCellMeta(cell, 'kbase.widgetCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.addClass('hidden');
            }
            widgetArea.addClass('hidden');
            outputArea.addClass('hidden');
        };

        cell.maximize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                widgetArea = this.element.find('[data-subarea-type="widget-area"]'),
                showCode = utils.getCellMeta(cell, 'kbase.widgetCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.removeClass('hidden');
            }
            widgetArea.removeClass('hidden');
            outputArea.removeClass('hidden');
        };
        cell.renderIcon = function () {
            var inputPrompt = this.element[0].querySelector('[data-element="icon"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: {textAlign: 'center'}
                }, [
                    AppUtils.makeAppIcon(utils.getCellMeta(cell, 'kbase.widgetCell.app.spec'))
                ]);
            }
        };
        cell.hidePrompts = function () {
            // Hide the code input area.
            this.input.find('.input_area').addClass('hidden');
            utils.setCellMeta(this, 'kbase.widgetCell.user-settings.showCodeInputArea', false);

            // And add our own!
            var prompt = document.createElement('div');
            prompt.innerHTML = div({dataElement: 'icon', class: 'prompt'});
            cell.input.find('.input_prompt').after($(prompt));


            // Hide the prompt...
            this.input.find('.input_prompt').hide();
            utils.horribleHackToHideElement(this, '.output_prompt', 10);
        };

    }

    // This is the python/kernel driven version
    // 
    function setupCell(cell) {
        if (cell.cell_type !== 'code') {
            return;
        }
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'widget') {
            return;
        }

        specializeCell(cell);

        // The kbase property is only used for managing runtime state of the cell
        // for kbase. Anything to be persistent should be on the metadata.
        cell.kbase = {
        };

        // Update metadata.
        utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

        var appId = utils.getMeta(cell, 'widgetCell', 'app').id,
            appTag = utils.getMeta(cell, 'widgetCell', 'app').tag,
            widgetCellWidget = WidgetCellWidget.make({
                cell: cell
                // workspaceInfo: workspaceInfo
            }),
            ui = UI.make({node: cell.input[0]}),
            kbaseNode = ui.createNode(div({
                dataSubareaType: 'widget-cell-input'
            }));

        // Create (above) and place the main container for the input cell.
        cell.input.after($(kbaseNode));
        cell.kbase.node = kbaseNode;
        cell.kbase.$node = $(kbaseNode);

        cell.hidePrompts();

        cell.renderIcon();

        cell.renderMinMax();

        return widgetCellWidget.init()
            .then(function () {
                return widgetCellWidget.attach(kbaseNode);
            })
            .then(function () {
                return widgetCellWidget.start();
            })
            .then(function () {
                return widgetCellWidget.run({
                    appId: appId,
                    appTag: appTag
                });
            })
            .then(function () {
                // AppCellController.start();
                cell.renderMinMax();
                return {
                    widget: widgetCellWidget
                };
            })
            .catch(function (err) {
                console.error('ERROR starting app cell', err);
                alert('Error starting app cell');
            });
    }

    function makeAppRef(app) {
        switch (app.tag) {
            case 'release':
                return {
                    id: app.id,
                    tag: app.tag,
                    version: app.version
                };
            case 'beta':
            case 'dev':
                return {
                    id: app.id,
                    tag: app.tag
                };
            default:
                throw new Error('Invalid tag for app ' + app.id);
        }
    }

    function buildPython(cell, cellId, runId, app) {
        var //runId = new Uuid(4).format(),
            //app = fixApp(app),
            code = PythonInterop.buildCustomWidgetRunner(cellId, runId, app);
        // TODO: do something with the runId
        //console.log('CODE', code);
        //cell.set_text(code);
        return code;
    }

    function upgradeCell(cell, appSpec, appTag) {
        var cellId = 'kbase_cell_' + (new Uuid(4).format()),
            runId = 'run_' + (new Uuid(4).format());

        console.log('APP SPEC', appSpec);

        return Promise.try(function () {
            // Create base widget cell
            var meta = cell.metadata,
                initialParams = {};
                
            // TODO: rational default params here.
            appSpec.parameters.map(function (parameter) {
                initialParams[parameter.id] = null;
            });

            meta.kbase = {
                type: 'widget',
                attributes: {
                    id: cellId,
                    status: 'new',
                    created: (new Date()).toUTCString(),
                    defaultIcon: 'bar-chart',
                    iconUrl: Props.getDataItem(appSpec, 'info.icon.url'),
                    title: appSpec.info.name,
                    subtitle: appSpec.info.subtitle
                },
                cellState: {
                },
                widgetCell: {
                    app: {
                        id: appSpec.info.id,
                        gitCommitHash: appSpec.info.git_commit_hash,
                        version: appSpec.info.ver,
                        tag: appTag,
                        spec: appSpec
                    },
                    params: initialParams
                }
            };
            cell.metadata = meta;
        })
            .then(function () {
                // Complete the cell setup.
                return setupCell(cell);
            })
            .then(function (cellStuff) {
                // Create the python code, insert it, and execute it.
            
                var appRef = makeAppRef({
                    id: appSpec.info.id,
                    tag: appTag,
                    version: appSpec.info.ver,
                    gitCommitHash: appSpec.info.git_commit_hash
                });

//                // get the python code
                var pythonCode = buildPython(cell, cellId, runId, appRef);

//                // set it in the cell
                cell.set_text(pythonCode);
//
//                // execute it
                cell.execute();
            })
            .then(function () {

                // Initialize the cell to its default state.
                // cellStuff.bus.emit('reset-to-defaults');
            });
    }


    function load() {
        $([Jupyter.events]).on('inserted.Cell', function (event, data) {
            if (data.kbase && data.kbase.type === 'widget') {
                upgradeCell(data.cell, data.kbase.appSpec, data.kbase.appTag)
                    .then(function () {

                        console.log('WIDGET: Cell created?');
                    })
                    .catch(function (err) {
                        console.error('ERROR creating cell', err);
                        // delete cell.
                        $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(data.cell));
                        alert('Could not insert cell due to errors.\n' + err.message);
                    });
            }
        });

        Jupyter.notebook.get_cells().forEach(function (cell) {
            try {
                setupCell(cell);
            } catch (ex) {
                console.error('ERROR setting up output cell', ex);
            }
        });
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, function (err) {
    'use strict';
    console.log('ERROR loading widgetCell main', err);
});