/**
 * @author Pavel Novichkov <psnovichkov@lbl.gov>
 *
 * This shows a set of dropdowns dynamically defined by the dataModel provided in the options.
 * The dataModel should have getDropdownSpecs method providing an array of spec files.
 *
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseNarrativeParameterDropdownInput',
    'kbaseNarrativeParameterInput',
], (KBWidget, bootstrap, $, kbaseNarrativeParameterDropdownInput, kbaseNarrativeParameterInput) => {
    return KBWidget({
        name: 'kbaseNarrativeParameterCustomDropdownGroupInput',
        parent: kbaseNarrativeParameterInput,
        version: '1.0.0',
        options: {
            loadingImage: '../images/ajax-loader.gif',
            isInSidePanel: false,
            dataModel: null,
        },
        $optionsDiv: null,
        enabled: true,
        value: true,
        parameters: [],
        show: function (loadSpecs) {
            const self = this;
            self.reset();

            self.$optionsDiv.append($('<div>').append('<hr>'));
            let specs = [];
            if (loadSpecs) {
                specs = loadSpecs;
            } else {
                specs = self.options.dataModel.getDropdownSpecs();
            }

            if (specs.length > 0) {
                self.$optionsDiv.append($('<div>').append(self.spec.ui_name + ':'));
                for (const i in specs) {
                    self.addParameterDiv(
                        specs[i],
                        'kbaseNarrativeParameterDropdownInput',
                        self.$optionsDiv
                    );
                }
            } else {
                self.$optionsDiv.append($('<div>').append(self.spec.ui_name + ': no elements'));
            }
        },
        reset: function () {
            this.$optionsDiv.empty();
            this.parameters = [];
        },
        addParameterDiv: function (paramSpec, widgetName, $optionsDiv) {
            const self = this;
            const $stepDiv = $('<div>');
            const $widget = $stepDiv[widgetName]({
                loadingImage: self.options.loadingImage,
                parsedParameterSpec: paramSpec,
                isInSidePanel: self.options.isInSidePanel,
            });
            this.parameters.push({
                id: paramSpec.id,
                widget: $widget,
                name: paramSpec.ui_name,
                spec: paramSpec,
            });
            $optionsDiv.append($stepDiv);
        },
        render: function () {
            const self = this;

            self.$optionsDiv = $('<div>');
            self.$mainPanel.append(self.$optionsDiv);
        },
        getState: function () {
            const state = {
                specs: [],
                value: this.getParameterValue(),
            };

            for (const i in this.parameters) {
                const param = this.parameters[i];
                state.specs.push(param.spec);
            }
            return state;
        },
        loadState: function (state) {
            this.show(state.specs);
            this.setParameterValue(state.value);
        },
        refresh: function () {},
        isValid: function () {
            return { isValid: true, errormssgs: [] };
        },
        disableParameterEditing: function () {
            for (const i in this.parameters) {
                const param = this.parameters[i];
                param.widget.disableParameterEditing();
            }
        },
        enableParameterEditing: function () {
            for (const i in this.parameters) {
                const param = this.parameters[i];
                param.widget.enableParameterEditing();
            }
        },
        setParameterValue: function (value) {
            for (const i in this.parameters) {
                const param = this.parameters[i];
                const paramValue = value[param.name];
                param.widget.setParameterValue(paramValue);
            }
        },
        getParameterValue: function () {
            const value = {};
            for (const i in this.parameters) {
                const param = this.parameters[i];
                value[param.name] = param.widget.getParameterValue();
            }
            return value;
        },
        prepareValueBeforeRun: function (methodSpec) {},
        lockInputs: function () {
            this.disableParameterEditing();
        },
        unlockInputs: function () {
            this.enableParameterEditing();
        },
        addInputListener: function (onChangeFunc) {
            this.$elem.find('#' + this.spec.id).on('change', onChangeFunc);
        },
    });
});
