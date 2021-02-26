/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseNarrativeMethodInput',
    'kbaseNarrativeParameterDropdownInput',
    'kbaseNarrativeParameterCheckboxInput',
    'kbaseNarrativeParameterCustomTextSubdataInput',
], (
    KBWidget,
    bootstrap,
    $,
    Config,
    kbaseNarrativeMethodInput,
    kbaseNarrativeParameterDropdownInput,
    kbaseNarrativeParameterCheckboxInput,
    kbaseNarrativeParameterCustomTextSubdataInput
) => {
    const workspaceUrl = Config.url('workspace');
    const loadingImage = Config.get('loading_gif');

    return KBWidget({
        name: 'kbaseGrowthCurvesInput',
        parent: kbaseNarrativeMethodInput,

        version: '1.0.0',
        options: {
            isInSidePanel: false,
        },

        inRefreshState: false,
        sampleSeriesIds: [],
        STATE_NONE: 0,
        STATE_FETCHING: 1,
        STATE_READY: 2,
        state: 0,
        ws: null,
        initWsClient: function () {
            const self = this;

            if (this.authToken) {
                this.ws = new Workspace(workspaceUrl, { token: this.authToken() });
            } else {
                error('not properly initialized - no auth token found');
            }
        },

        render: function () {
            const self = this;
            self.initWsClient();

            this.parameters = [];
            this.parameterIdLookup = {};
            const $inputParameterContainer = $('<div>');
            const $optionsDiv = $('<div>');

            const method = this.options.method;
            const params = method.parameters;

            this.addParameterDiv(params[0], 'kbaseNarrativeParameterTextInput', $optionsDiv);
            this.addParameterDiv(
                params[1],
                'kbaseNarrativeParameterDropdownInput',
                $optionsDiv,
                self
            );

            this.addParameterDiv(
                params[2],
                'kbaseNarrativeParameterCustomTextSubdataInput',
                $optionsDiv,
                self
            );
            this.addParameterDiv(params[3], 'kbaseNarrativeParameterCheckboxInput', $optionsDiv);
            this.addParameterDiv(params[4], 'kbaseNarrativeParameterCheckboxInput', $optionsDiv);

            self.parameterIdLookup['input_growth_matrix'].addInputListener(() => {
                if (!self.inRefreshState) {
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_condition_ids'].setParameterValue('');
                }
            });

            self.parameterIdLookup['input_value_type'].addInputListener(() => {
                if (!self.inRefreshState) {
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_condition_ids'].setParameterValue('');
                }
            });

            $inputParameterContainer.append($optionsDiv);
            this.$elem.append($inputParameterContainer);
            this.$elem.css({ 'margin-bottom': '5px' });
        },

        addParameterDiv: function (paramSpec, widgetName, $optionsDiv, $dataModel) {
            const self = this;
            const $stepDiv = $('<div>');
            const $widget = $stepDiv[widgetName]({
                loadingImage: loadingImage,
                parsedParameterSpec: paramSpec,
                isInSidePanel: self.options.isInSidePanel,
                dataModel: $dataModel,
            });
            this.parameters.push({ id: paramSpec.id, widget: $widget });
            this.parameterIdLookup[paramSpec.id] = $widget;

            if ($optionsDiv.children().length == 0) $stepDiv.css({ 'margin-top': '5px' });
            $optionsDiv.append($stepDiv);
        },

        fetchData: function (doneCallback) {
            const self = this;
            console.log('fetchData.self', self);
            if (self.state == self.STATE_NONE) {
                $(document).trigger('workspaceQuery.Narrative', (ws_name) => {
                    const matrixId = self.getParameterValue('input_growth_matrix');
                    if (!matrixId) return;

                    const query = [];
                    query.push({
                        ref: ws_name + '/' + matrixId,
                        included: ['metadata/column_metadata'],
                    });

                    self.state = self.STATE_FETCHING;
                    self.ws.get_object_subset(
                        query,
                        (result) => {
                            self.sampleSeriesIds = [];
                            const valueType = self.getParameterValue('input_value_type');

                            const samples = self.buildSamples(
                                result[0].data.metadata.column_metadata
                            );
                            if (valueType == 'Samples') {
                                for (var i in samples) {
                                    const sample = samples[i];
                                    self.sampleSeriesIds.push({
                                        id: sample.sampleId,
                                        text: sample.sampleId + ' - ' + sample.label,
                                    });
                                }
                            } else if (valueType == 'Series') {
                                const seriesList = self.groupSamplesIntoSeries(samples);
                                for (var i in seriesList) {
                                    const series = seriesList[i];
                                    self.sampleSeriesIds.push({
                                        id: series.seriesId,
                                        text: series.seriesId + ' - ' + series.label,
                                    });
                                }
                            }

                            self.sampleSeriesIds.sort((a, b) => {
                                return a.text > b.text ? 1 : a.text < b.text ? -1 : 0;
                            });

                            self.state = self.STATE_READY;
                            if (doneCallback) {
                                doneCallback(self.sampleSeriesIds);
                            }
                        },
                        (error) => {
                            console.error(error);
                        }
                    );
                });
            } else if (self.state == self.STATE_READY) {
                if (doneCallback) {
                    doneCallback(self.sampleSeriesIds);
                }
            }
        },

        buildSamples: function (columnsMetadata) {
            const samples = [];

            for (const columnId in columnsMetadata) {
                const columnMetadata = columnsMetadata[columnId];
                let seriesId = null;
                const conditions = [];
                for (const i in columnMetadata) {
                    const pv = columnMetadata[i];
                    if (pv.category == 'Condition') {
                        conditions.push(pv);
                    } else if (pv.category == 'DataSeries' && pv.property_name == 'SeriesID') {
                        seriesId = pv.property_value;
                    }
                }
                conditions.sort((a, b) => {
                    return a.property_name > b.property_name
                        ? 1
                        : a.property_name < b.property_name
                        ? -1
                        : 0;
                });
                const sampleLabel = this.propertiesToString(conditions);

                const sample = {
                    sampleId: columnId,
                    seriesId: seriesId,
                    label: sampleLabel,
                };
                samples.push(sample);
            }

            console.log('columnsMetadata', columnsMetadata);
            console.log('Samples', samples);
            return samples;
        },

        groupSamplesIntoSeries: function (samples) {
            const seriesHash = {};
            for (const i in samples) {
                const sample = samples[i];
                seriesHash[sample.seriesId] = {
                    seriesId: sample.seriesId,
                    label: sample.label,
                };
            }

            const seriesList = [];
            for (const seriesId in seriesHash) {
                seriesList.push(seriesHash[seriesId]);
            }

            return seriesList;
        },

        /*
        * This is toString method for PropertyValues
        *
        * @return
            string
        */
        propertiesToString: function (properties) {
            let str = '';
            for (const i in properties) {
                const pv = properties[i];
                if (str) {
                    str += '; ';
                }
                str += this.propertyValueToString(pv);
            }
            return str;
        },

        /*
        * This is toString method for PropertyValue
        *
        * @return
            string
        */
        propertyValueToString: function (pv) {
            return (
                pv.property_name +
                ': ' +
                pv.property_value +
                (pv.property_unit ? ' ' + pv.property_unit : '')
            );
        },
        refresh: function () {
            this.inRefreshState = true;
            if (this.parameters) {
                for (let i = 0; i < this.parameters.length; i++) {
                    this.parameters[i].widget.refresh();
                }
            }
            this.inRefreshState = false;
        },
    });
});
