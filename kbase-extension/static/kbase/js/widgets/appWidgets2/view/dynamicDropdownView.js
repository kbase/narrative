define(['bluebird', 'jquery', 'common/html', 'common/ui', 'common/props', 'bootstrap', 'select2'], (
    Promise,
    $,
    html,
    UI,
    Props
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        select = t('select');

    function factory(config) {
        const spec = config.parameterSpec,
            ddOptions = spec.original.dynamic_dropdown_options || {},
            bus = config.bus,
            model = Props.make({
                data: {
                    value: null,
                    displayValue: null,
                },
                onUpdate: () => {},
            }),
            baseCssClass = 'kb-appInput__dynDropdown';
        let parent, container, ui;
        const descriptionFields = new Set();

        // if there's a template, process it so we have expected fields
        if (ddOptions.description_template) {
            const m = [...ddOptions.description_template.matchAll(/{{(.+?)}}/g)];
            m.forEach((match) => descriptionFields.add(match[1]));
        }

        // CONTROL

        function setControlValue(newValue, newDisplayValue) {
            const dropdown = $(ui.getElement('input-container.input'));
            const currentData = dropdown.select2('data')[0];
            currentData.value = newValue;
            if (typeof newDisplayValue === 'string') {
                currentData.text = newDisplayValue;
            } else if (typeof newDisplayValue === 'object' && newDisplayValue !== null) {
                for (const key of Object.keys(newDisplayValue)) {
                    currentData[key] = newDisplayValue[key];
                }
            } else {
                currentData.text = newValue;
            }
            dropdown.trigger('change');
        }

        // MODEL

        function setModelValue(value, displayValue) {
            model.setItem('value', value);
            model.setItem('displayValue', displayValue);
            syncModelToControl();
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue, {
                id: spec.data.defaultValue,
                text: spec.data.defaultValue,
            });
        }

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value'), model.getItem('displayValue'));
        }

        /**
         * Formats the display of an object in the dropdown. Every Option in Select2 gets passed
         * through here, for better or worse. This includes temporary ones inserted by Select2,
         * like "Searching..." or "Loading..." fields.
         *
         * This returns either a text string (which will be escaped before rendering)
         * or a jQuery element, which expects pre-escaped "safe" HTML.
         *
         * So here are input cases:
         * 1. (most common), an object with an id, text, and fields as returned from the dynamic
         *    search. This gets rendered using the ddOptions template.
         * 2. (on search/load), an object without an id, but with a text field. Expects to
         *    just return the bare text or an empty string - this lets Select2 use the default
         *    "Searching..." or "Loading..." strings as temporary/unselectable options.
         * 3. (on widget load), an object with id, text, and nothing else should just return
         *    the text?
         * See https://select2.org/dropdown#templating for more details.
         */
        function formatObjectDisplay(retObj) {
            if (!retObj.id) {
                return retObj.text || '';
            } else if (ddOptions.data_source === 'ftp_staging') {
                return retObj.id;
            } else {
                let formattedString;
                // if we have a template and at least one item to fill the template with,
                // do the formatted template
                if (
                    ddOptions.description_template &&
                    [...descriptionFields].some((key) => key in retObj)
                ) {
                    formattedString = formatDescriptionTemplate(retObj);
                }
                // otherwise, if we have a text use that. And if not, use the id as a last resort.
                else {
                    formattedString = retObj.text || retObj.id;
                }
                // and squash the result in a jQuery object with a div.
                return $(
                    div(
                        {
                            class: `${baseCssClass}_display`,
                        },
                        formattedString
                    )
                );
            }
        }

        /**
         * Formats the dynamic dropdown description template by replacing templated
         * values with values from the given object.
         * For example, if the template (in ddOptions.description_template) looks like this:
         *
         * Template value: {{foo}}
         *
         * and the given object is:
         * {
         *   foo: "bar"
         * }
         *
         * This returns the string "Template value: bar".
         *
         * Note that this assumes that ddOptions.description_template exists, for simplicity.
         * @param {any} obj the object to use for replacing template fields
         * @returns {String} the formatted string
         */
        function formatDescriptionTemplate(obj) {
            const replacer = (_match, paramId) => {
                return obj[paramId];
            };
            return ddOptions.description_template.replace(/{{(.+?)}}/g, replacer);
        }

        function selectionTemplate(obj) {
            if (ddOptions.description_template) {
                return formatObjectDisplay(obj);
            }
            if (ddOptions.selection_id) {
                return obj[ddOptions.selection_id];
            }
            if (obj.text || !obj.id) {
                return obj.text;
            }
            return obj.id;
        }

        function render(container) {
            container.innerHTML = div(
                {
                    dataElement: 'input-container',
                },
                [
                    select({
                        class: 'form-control',
                        readonly: true,
                        dataElement: 'input',
                        disabled: true,
                    }),
                ]
            );
            let viewData = {
                selected: true,
                id: config.initialValue || undefined,
                text: config.initialValue,
            };
            if (config.initialDisplayValue) {
                if (typeof config.initialDisplayValue === 'string') {
                    viewData.text = config.initialDisplayValue;
                } else if (
                    typeof config.initialDisplayValue === 'object' &&
                    config.initialDisplayValue !== null
                ) {
                    viewData = Object.assign(viewData, config.initialDisplayValue);
                    if (!viewData.text) {
                        viewData.text = viewData.id;
                    }
                }
            }

            $(ui.getElement('input-container.input')).select2({
                allowClear: false,
                disabled: true,
                templateSelection: selectionTemplate,
                data: [viewData],
            });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                render(container);

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    const displayValue = message.displayValue || message.value;
                    setModelValue(message.value, displayValue);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    $(ui.getElement('input-container.input')).select('destroy').html('');
                    parent.removeChild(container);
                }
            });
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
