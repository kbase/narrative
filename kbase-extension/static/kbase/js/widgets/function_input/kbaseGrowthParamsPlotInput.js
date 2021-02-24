/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define(
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'narrativeConfig',
        'kbaseNarrativeParameterCustomTextSubdataInput',
        'kbaseNarrativeParameterCustomButtonInput',
        'kbaseNarrativeParameterCustomDropdownGroupInput'
    ], (
    KBWidget,
    bootstrap,
    $,
    Config,
    kbaseNarrativeParameterCustomTextSubdataInput,
    kbaseNarrativeParameterCustomButtonInput,
    kbaseNarrativeParameterCustomDropdownGroupInput
    ) => {

    const workspaceUrl = Config.url('workspace');
    const loadingImage = Config.get('loading_gif');
    return KBWidget({
        name: "kbaseGrowthParamsPlotInput",
        parent: kbaseNarrativeMethodInput,
        version: "1.0.0",
        options: {
            isInSidePanel: false
        },
        inRefreshState: false,
        columnMetadata: {},
        conditionParams: [],
        STATE_NONE: 0,
        STATE_FETCHING: 1,
        STATE_READY: 2,
        state: 0,
        ws: null,
        initWsClient: function () {
            const self = this;
            console.log('initWsClient.self', self);

            if (this.authToken) {
                this.ws = new Workspace(workspaceUrl, {token: this.authToken()});
            } else {
                error('not properly initialized - no auth token found')
            }
        },
        /**
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */

        render: function () {
            const self = this;

            self.initWsClient();

            this.parameters = [];
            this.parameterIdLookup = {};
            const $inputParameterContainer = $('<div>');
            const $optionsDiv = $('<div>');

            const method = this.options.method;
            const params = method.parameters;

            this.addParameterDiv(params[0], "kbaseNarrativeParameterTextInput", $optionsDiv);
            this.addParameterDiv(params[1], "kbaseNarrativeParameterDropdownInput", $optionsDiv);
            this.addParameterDiv(params[2], "kbaseNarrativeParameterCustomTextSubdataInput", $optionsDiv, self);
            this.addParameterDiv(params[3], "kbaseNarrativeParameterCustomButtonInput", $optionsDiv, self);
            this.addParameterDiv(params[4], "kbaseNarrativeParameterCustomDropdownGroupInput", $optionsDiv, self);


            self.parameterIdLookup['input_growth_parameters'].addInputListener(() => {
                if (!self.inRefreshState) {
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_condition_param'].setParameterValue('');
                    self.parameterIdLookup['input_check_other_params'].setParameterValue(false);
                    self.parameterIdLookup['input_check_other_params'].deactivate();
                    self.parameterIdLookup['input_condition_filter'].reset();
                }
            });

            self.parameterIdLookup['input_condition_param'].addInputListener(() => {
                self.parameterIdLookup['input_check_other_params'].setParameterValue(false);
                self.parameterIdLookup['input_check_other_params'].activate();
                self.parameterIdLookup['input_condition_filter'].reset();
            });

            $inputParameterContainer.append($optionsDiv);
            this.$elem.append($inputParameterContainer);
            this.$elem.css({"margin-bottom": "5px"});
        },
        addParameterDiv: function (paramSpec, widgetName, $optionsDiv, $dataModel) {
            const self = this;
            const $stepDiv = $('<div>');
            const $widget = $stepDiv[widgetName](
                {
                    loadingImage: loadingImage,
                    parsedParameterSpec: paramSpec,
                    isInSidePanel: self.options.isInSidePanel,
                    dataModel: $dataModel
                });
            this.parameters.push({id: paramSpec.id, widget: $widget});
            this.parameterIdLookup[paramSpec.id] = $widget;

            if ($optionsDiv.children().length == 0)
                $stepDiv.css({"margin-top": "5px"});
            $optionsDiv.append($stepDiv);
        },
        geMainParams: function () {
            const self = this;
            const mainParams = [];
            const param = self.parameterIdLookup['input_condition_param'].getParameterValue();
            if (param) {
                mainParams.push(param);
            }

            return mainParams;
        },
        getAdditionalParams: function () {
            const self = this;
            const params = [];
            if (!self.columnMetadata)
                return params;

            const mainParams = self.geMainParams();
            if (mainParams.length == 0)
                return params;

            // Collect params
            const paramValues = {};
            for (const i in self.columnMetadata) {
                const cMetadata = self.columnMetadata[i];


                // Check whether the column is a good (all main parameters are present)
                let goodColumn = true;

                for (var k in mainParams) {
                    const mainParam = mainParams[k];
                    let paramFound = false;
                    for (var j in cMetadata) {
                        var propValue = cMetadata[j];
                        if (propValue.category != 'Condition')
                            continue;
                        if (propValue.property_name == mainParam) {
                            paramFound = true;
                            break;
                        }
                    }
                    if (!paramFound) {
                        goodColumn = false;
                        break;
                    }
                }
                if (!goodColumn)
                    continue;


                // Collect other params
                for (var j in cMetadata) {
                    var propValue = cMetadata[j];
                    if (propValue.category != 'Condition')
                        continue;

                    let isMainParam = false;
                    for (var k in mainParams) {
                        if (mainParams[k] == propValue.property_name) {
                            isMainParam = true;
                            break;
                        }
                    }

                    if (isMainParam) {
                        continue;
                    } else {
                        var name = propValue.property_name;
                        const value = propValue.property_value;
                        if (!paramValues[name]) {
                            paramValues[name] = {};
                        }
                        paramValues[name][value] = value;
                    }
                }
            }

            // Build params
            for (var name in paramValues) {
                const valueSet = paramValues[name];
                const values = [];
                for (const val in valueSet) {
                    values.push(val);
                }
                params.push({name: name, values: values});
            }

            return params;
        },
        getDropdownSpecs: function () {
            const self = this;
            const specs = [];

            const params = self.getAdditionalParams();
            for (const i in params) {
                const param = params[i];
                const spec = {
                    "id": "input_param_filter_" + i,
                    ui_name: param.name,
                    short_hint: 'Parameter to be constrained',
                    description: 'Parameter to be constrained',
                    "optional": false,
                    "advanced": false,
                    "allow_multiple": false,
                    "default_values": [],
                    "field_type": "dropdown",
                    "dropdown_options": {
                        "options": []
                    }
                };
                const options = [];
                for (const j in param.values) {
                    const value = param.values[j];
                    options.push({value: value, display: value});
                }
                spec.dropdown_options.options = options;
                spec.default_values.push(param.values[0]);
                specs.push(spec);
            }

            return specs;
        },
        onButtonClick: function () {
            this.parameterIdLookup['input_condition_filter'].show();
        },
        fetchData: function (doneCallback) {
            const self = this;
            console.log('fetchData.self', self);
            if (self.state == self.STATE_NONE) {
                $(document).trigger('workspaceQuery.Narrative',
                    (ws_name) => {

                        const growthParametersID = self.getParameterValue('input_growth_parameters');
                        const refGrowthParams = {ref: ws_name + '/' + growthParametersID}
                        self.ws.get_objects([refGrowthParams],
                            (data) => {
                                self.growthParams = data[0].data;
                                const matrixRef = self.growthParams.matrix_id;
                                if (!matrixRef)
                                    return;

                                const query = [];
                                query.push({ref: matrixRef, included: ["metadata/column_metadata"]});

                                self.state = self.STATE_FETCHING;
                                self.ws.get_object_subset(query,
                                    (result) => {
                                        self.columnMetadata = result[0].data.metadata.column_metadata;
                                        const conditions = self.getConditions(self.columnMetadata);

                                        self.conditionParams = [];
                                        for (const conditionParam in conditions) {
                                            self.conditionParams.push({id: conditionParam, text: conditionParam});
                                        }

                                        self.state = self.STATE_READY;
                                        if (doneCallback) {
                                            doneCallback(self.conditionParams);
                                        }
                                    },
                                    (error) => {
                                        console.error(error);
                                    }
                                );
                            },
                            (error) => {
                                console.error(error);
                            }
                        );
                    }
                );
            } else if (self.state == self.STATE_READY) {
                if (doneCallback) {
                    doneCallback(self.conditionParams);
                }
            }       },
        getConditions: function (columnsMetadata) {
            const conditions = {};
            for (const i in columnsMetadata) {
                const columnMetadata = columnsMetadata[i];
                for (const j in columnMetadata) {
                    const pv = columnMetadata[j];
                    if (pv.category != 'Condition')
                        continue;
                    conditions[pv.property_name] = true;
                }
            }
            return conditions;
        },
        refresh: function () {
            this.inRefreshState = true;
            if (this.parameters) {
                for (let i = 0; i < this.parameters.length; i++) {
                    this.parameters[i].widget.refresh();
                }
            }
            this.inRefreshState = false;
        }

    });
});