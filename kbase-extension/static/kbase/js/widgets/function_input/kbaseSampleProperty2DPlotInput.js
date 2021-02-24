/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseNarrativeParameterCustomTextSubdataInput',
], (KBWidget, bootstrap, $, Config, kbaseNarrativeParameterCustomTextSubdataInput) => {
    const workspaceUrl = Config.url('workspace');
    const loadingImage = Config.get('loading_gif');
    return KBWidget({
        name: 'kbaseSampleProperty2DPlotInput',
        parent: kbaseNarrativeMethodInput,

        version: '1.0.0',
        options: {
            isInSidePanel: false,
        },

        inRefreshState: false,
        columnMetadata: {},
        samplePropertiesParams: [],

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

            this.addParameterDiv(params[0], 'kbaseNarrativeParameterTextInput', $optionsDiv);
            this.addParameterDiv(
                params[1],
                'kbaseNarrativeParameterCustomTextSubdataInput',
                $optionsDiv,
                self
            );
            this.addParameterDiv(
                params[2],
                'kbaseNarrativeParameterCustomTextSubdataInput',
                $optionsDiv,
                self
            );

            self.parameterIdLookup['input_sample_property_matrix'].addInputListener(() => {
                if (!self.inRefreshState) {
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_property_x'].setParameterValue('');
                    self.parameterIdLookup['input_property_y'].setParameterValue('');
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
            if (self.state == self.STATE_NONE) {
                $(document).trigger('workspaceQuery.Narrative', (ws_name) => {
                    const matrixId = self.getParameterValue('input_sample_property_matrix');
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
                            self.columnMetadata = result[0].data.metadata.column_metadata;
                            self.samplePropertiesParams = self.getSampleProperties(
                                self.columnMetadata
                            );

                            self.state = self.STATE_READY;
                            if (doneCallback) {
                                doneCallback(self.samplePropertiesParams);
                            }
                        },
                        (error) => {
                            console.error(error);
                        }
                    );
                });
            } else if (self.state == self.STATE_READY) {
                if (doneCallback) {
                    doneCallback(self.samplePropertiesParams);
                }
            }
        },

        getSampleProperties: function (columnsMetadata) {
            const samplePorpertiesHash = {};
            for (const columnId in columnsMetadata) {
                const columnMetadata = columnsMetadata[columnId];

                var seriesID = null;
                let propName = null;

                for (const i in columnMetadata) {
                    const pv = columnMetadata[i];

                    if (pv.category == 'DataSeries' && pv.property_name == 'SeriesID') {
                        seriesID = pv.property_value;
                    } else if (pv.category == 'Property' && pv.property_name == 'Name') {
                        propName = pv.property_value;
                    }
                }

                if (seriesID != null && propName != null) {
                    samplePorpertiesHash[seriesID] = propName;
                }
            }

            const sampleProperties = [];
            for (var seriesID in samplePorpertiesHash) {
                sampleProperties.push({
                    id: seriesID,
                    text: samplePorpertiesHash[seriesID],
                });
            }

            sampleProperties.sort((a, b) => {
                return a.text > b.text ? 1 : -1;
            });

            return sampleProperties;
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
