/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'jquery',
    'uuid',
    'base/js/namespace',
    'common/utils',
    'common/runtime',
    'common/dom',
    'common/props',
    'kb_common/html',
    './widgets/widgetInvoker',
    'common/pythonInterop'
], function (
    Promise,
    $,
    Uuid,
    Jupyter,
    utils,
    Runtime,
    UI,
    Props,
    html,
    Invoker,
    PythonInterop
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'), img = t('img');
        
        
    function makeIcon(appSpec) {
        // icon is in the spec ...
        var t = html.tag,
            span = t('span'), img = t('img'),
            runtime = Runtime.make(),
            nmsBase = runtime.config('services.narrative_method_store.image_url'),
            iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return span({class: 'fa-stack fa-2x', style: {padding: '0 3px 3px 3px'}}, [
                img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
            ]);
        }

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)'}}, [
                span({class: 'fa fa-square fa-stack-2x', style: {color: 'rgb(103,58,183)'}}),
                span({class: 'fa fa-inverse fa-stack-1x fa-cube'})
            ])
        ]);
    }

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
        cell.renderIcon = function() {
            var inputPrompt = this.element[0].querySelector('[data-element="icon"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: {textAlign: 'center'}
                }, [
                    makeIcon(utils.getCellMeta(cell, 'kbase.widgetCell.app.spec'))
                ]);
            }
        };
    }
    
    function horribleHackToHideElement(cell, selector, tries) {
        var prompt = cell.element.find(selector);
        if (prompt.length > 0) {
            prompt.css('visibility', 'hidden');
            return;
        }
            
        if (tries > 0) {
            tries -= 1;
            window.setTimeout(function () {
                horribleHackToHideElement(cell, tries);
            }, 100);
        } else {
            console.warn('Could not hide the prompt, sorry');
        }
    }
    
    function hidePrompts(cell) {
        // Hide the code input area.
        cell.input.find('.input_area').addClass('hidden');
        utils.setCellMeta(cell, 'kbase.widgetCell.user-settings.showCodeInputArea', false);
        
        // Hide the prompt...
        cell.input.find('.input_prompt').hide();
        horribleHackToHideElement(cell, '.output_prompt', 10);
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

        hidePrompts(cell);

//        cell.element.find('.output_wrapper .prompt').css('visibility', 'hidden');
//        cell.element.find('.output .prompt').css('visibility', 'hidden');
//        
//        console.log('PROMPT?', cell.element.find('.output .prompt'));
//        console.log('PROMPT?', cell.element.find('.output_wrapper .prompt'));
        
        // And add our own!
        var prompt = document.createElement('div');
        prompt.innerHTML = div({dataElement: 'icon', class: 'prompt'});
        cell.input.find('.input_prompt').after($(prompt));
        cell.renderIcon();

        cell.renderMinMax();
        

        return {
            widget: null
        };
    }

    function upgradeCell(cell, appSpec, appTag) {
        var cellId = 'kbase_cell_' + (new Uuid(4).format()),
            runId = 'run_' + (new Uuid(4).format());

        return Promise.try(function () {
            // Create base widget cell
            var meta = cell.metadata;

            meta.kbase = {
                type: 'widget',
                attributes: {
                    id: cellId,
                    status: 'new',
                    created: (new Date()).toUTCString(),
                    defaultIcon: 'bar-chart',
                    iconUrl: appSpec.info.icon.url,
                    title: appSpec.info.name
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
                    params: null
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

                // get the python code
                var pythonCode = PythonInterop.buildCustomWidgetRunner(
                    appSpec.info.id,
                    appSpec.info.ver,
                    appTag,
                    cellId,
                    runId
                    );

                // set it in the cell
                cell.set_text(pythonCode);

                // execute it
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