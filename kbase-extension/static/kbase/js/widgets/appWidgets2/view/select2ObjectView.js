/**
 * This creates a view-only widget for the View Configure mode of the App Cell.
 * It resembles the interactive input widget in all its Select2 styling, but as it's
 * not interactive, it only shows the single input given at widget startup.
 *
 * Display is done in the following steps, depending on what string is provided
 * in the initialValue field of the config.
 *
 * 1. config.initialValue is stored as model.value
 * 2. model.value is used to look up the object info
 *      a. if model.value is a string, object info is fetched from either the data
 *      panel or Workspace (if unavailable). This is done a little differently
 *      depending on whether model.value is an UPA or just a string.
 *      b. if model.value is null/undefined at this point, nothing is displayed
 * 3. a listener to the 'data' channel's 'workspace-data-updated' message is set.
 *    When triggered, this checks if the data object was updated and displays the
 *    changed name if any.
 * 4. Validation always succeeds. However, if the object no longer exists in the
 *    Workspace (or the user doesn't have access to it), an error is displayed.
 */

define([
    'bluebird',
    'jquery',
    'common/html',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/data',
    'widgets/appWidgets2/common',
    'select2',
    'bootstrap',
], (Promise, $, html, Events, Runtime, UI, Data, WidgetCommon) => {
    'use strict';

    // Constants
    const t = html.tag,
        button = t('button'),
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            model = {
                value: undefined, // the given value on startup
                objectInfo: undefined, // the object info structure from the Workspace
            };
        let parent, container, ui, workspaceListener;

        function makeInputControl() {
            const selectOptions = [];
            if (model.objectInfo) {
                selectOptions.push(
                    option(
                        {
                            value: model.objectInfo.ref,
                            selected: true,
                            disabled: true,
                        },
                        model.objectInfo.name
                    )
                );
            }
            // CONTROL

            const selectElem = select(
                {
                    id: html.genId(),
                    class: 'form-control',
                    style: {
                        width: '100%',
                    },
                    dataElement: 'input',
                    disabled: true,
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );

            return selectElem;
        }

        // CONTROL

        /**
         * Updates the Select2 control value based on the model's current object info.
         */
        function updateControlValue() {
            const control = ui.getElement('input-container.input');
            $(control).find('option:first').trigger('change');
        }

        // MODEL
        function setModelValue(value) {
            return inputToObjectInfo(value).then((objInfo) => {
                model.value = value;
                model.objectInfo = objInfo;
                updateControlValue();
            });
        }

        function resetModelValue() {
            return setModelValue(spec.data.defaultValue);
        }

        /**
         * Converts an input data string passed to this widget into an Object Info
         * structure. Does this in one of a few ways.
         * 1. If the string looks like an object ref (xx/yy/zz or xx/yy), this
         *    calls out to the workspace to look it up.
         * 2. If the string is just a plain string, we assume this is the object name
         *    and attempt to look it up that way.
         * 3. If the input string is empty/null, an empty object info structure is
         *    returned
         * @param {string} inputData
         */
        function inputToObjectInfo(inputData) {
            if (!inputData) {
                return Promise.resolve({
                    name: null,
                    ref: null,
                });
            } else if (/\//.test(inputData)) {
                // if there's at least one / then it's a reference we can look up
                return Data.getObjectsByRef([inputData])
                    .then((objInfos) => Object.values(objInfos)[0])
                    .catch((error) => {
                        console.error(error);
                        return {
                            name: `Error resolving ${inputData}`,
                            ref: inputData,
                        };
                    });
            } else {
                // if there are no slashes, we can make no assumptions about the
                // workspace it came from, and we just treat the object as a name
                return Promise.resolve({
                    name: inputData,
                    ref: null,
                });
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl();

                ui.setContent('input-container', '');
                const container = ui.getElement('input-container');
                const content = WidgetCommon.containerContent(
                    div,
                    button,
                    events,
                    ui,
                    container,
                    inputControl
                );
                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input'))
                    .select2({
                        readonly: true,
                        templateSelection: function (object) {
                            let text = object.text;
                            if (model.objectInfo) {
                                text = model.objectInfo.name;
                                if (model.objectInfo.version) {
                                    text += ` (v${model.objectInfo.version})`;
                                }
                            }
                            return text;
                        },
                    })
                    .on('advanced-shown.kbase', (e) => {
                        $(e.target).select2({ width: 'resolve' });
                    });
                events.attachEvents(container);
            });
        }

        /*
         * In the layout we set up an environment in which one or more parameter
         * rows may be inserted.
         * For the objectInput, there is only ever one control.
         */
        function layout() {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return content;
        }

        /**
         * Updates the displayed name string in the following situations:
         * 1. We have a workspace UPA in the model.
         * 2. That UPA shows up in the given data.
         * 3. They have different names.
         *
         * In this case, we pass along the name field given here, assuming it's
         * a new name.
         * @param {Array} data
         */
        function propagateWorkspaceUpdate(data) {
            if (!model.objectInfo || !model.objectInfo.ref) {
                return;
            }
            for (const objInfo of data) {
                if (
                    objInfo.ref === model.objectInfo.ref &&
                    objInfo.name !== model.objectInfo.name
                ) {
                    model.objectInfo = objInfo;
                    updateControlValue();
                    return;
                }
            }
        }

        // LIFECYCLE API
        function start(arg) {
            parent = arg.node;
            container = parent.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            container.innerHTML = layout();

            if (config.initialValue !== undefined) {
                model.value = config.initialValue;
            }

            return inputToObjectInfo(config.initialValue)
                .then((objInfo) => {
                    model.objectInfo = objInfo;
                    return render();
                })
                .then(() => {
                    channel.on('reset-to-defaults', () => {
                        resetModelValue();
                    });
                    channel.on('update', (message) => {
                        setModelValue(message.value);
                    });

                    workspaceListener = bus.channel('data').plisten({
                        key: {
                            type: 'workspace-data-updated',
                        },
                        handle: (message) => {
                            propagateWorkspaceUpdate(message.objectInfo);
                        },
                    });
                });
        }

        function stop() {
            if (container) {
                parent.removeChild(container);
            }
            bus.stop();
            if (workspaceListener) {
                runtime.bus().removeListener(workspaceListener);
            }
            return Promise.resolve();
        }

        // INIT

        return {
            start,
            stop,
        };
    }

    return {
        make: (config) => factory(config),
    };
});
