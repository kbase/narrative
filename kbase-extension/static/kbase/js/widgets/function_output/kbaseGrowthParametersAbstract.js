define(['kbwidget', 'bootstrap', 'jquery', 'kbaseGrowthMatrixAbstract'], (
    KBWidget,
    bootstrap,
    $,
    kbaseGrowthMatrixAbstract
) => {
    return KBWidget({
        name: 'kbaseGrowthParametersAbstract',
        parent: kbaseGrowthMatrixAbstract,
        version: '1.0.0',
        options: {
            growthParametersID: null,
        },

        // Data form the GrwothParameters object
        growthParams: null,

        //@Overriride
        loadAndRender: function () {
            const self = this;
            self.loading(true);

            const refGrowthParams = self.buildObjectIdentity(
                this.options.workspaceID,
                this.options.growthParametersID
            );
            self.wsClient.get_objects(
                [refGrowthParams],
                (data) => {
                    self.growthParams = data[0].data;
                    const matrixRef = self.growthParams.matrix_id;

                    const ref = self.buildObjectIdentity('', '', '', matrixRef);
                    // Load metadata
                    self.wsClient.get_objects(
                        [ref],
                        (data) => {
                            self.matrix = data[0].data;
                            self.render();
                        },
                        (error) => {
                            self.clientError(error);
                        }
                    );
                },
                (error) => {
                    self.clientError(error);
                }
            );
        },

        buildColumnId2ParamsHash: function () {
            const columnId2Params = {};
            const params = this.growthParams.parameters;
            for (const i in params) {
                columnId2Params[params[i].mtx_column_id] = params[i];
            }
            return columnId2Params;
        },

        buildSamplesWithParameters: function () {
            const samples = [];
            const columnId2Params = this.buildColumnId2ParamsHash();

            const columnsMetadata = this.matrix.metadata.column_metadata;
            for (const columnId in columnsMetadata) {
                const columnMetadata = columnsMetadata[columnId];
                const seriesId = this.getPropertyValue(columnMetadata, 'DataSeries', 'SeriesID');
                const sampleProperties = this.getProperties(columnMetadata, 'Condition');
                const sampleLabel = this.propertiesToString(sampleProperties);

                const grp = columnId2Params[columnId];

                const sample = {
                    columnId: columnId,
                    seriesId: seriesId,
                    label: sampleLabel,
                    conditions: sampleProperties,

                    grp_area_under_curve: grp.area_under_curve,
                    grp_growth_rate: grp.growth_rate,
                    grp_lag_phase: grp.lag_phase,
                    grp_max_growth: grp.max_growth,
                    grp_method: grp.method,
                };
                samples.push(sample);
            }

            return samples;
        },

        groupSamplesWithParametersIntoSeries: function (samplesWithParams) {
            const seriesHash = {};
            for (var i in samplesWithParams) {
                const sample = samplesWithParams[i];
                var seriesId = sample.seriesId;
                var series = seriesHash[seriesId];
                if (series == null) {
                    series = {
                        seriesId: seriesId,
                        samples: [],
                        label: sample.label,
                        conditionHash: {},

                        avg_area_under_curve: 0,
                        avg_growth_rate: 0,
                        avg_lag_phase: 0,
                        avg_max_growth: 0,

                        se_area_under_curve: 0,
                        se_growth_rate: 0,
                        se_lag_phase: 0,
                        se_max_growth: 0,

                        grp_method: null,

                        samplesCountTotal: 0,
                        samplesCountGood: 0,
                    };
                    seriesHash[seriesId] = series;
                }
                series.samples.push(sample);

                for (var i in sample.conditions) {
                    const pv = sample.conditions[i];
                    series.conditionHash[pv.property_name] = pv;
                }
            }

            // Convert hash into list and fill out the number of samples (to be used in the jtables)
            const seriesList = [];
            for (var seriesId in seriesHash) {
                var series = seriesHash[seriesId];
                series.samplesCount = series.samples.length;
                this.updateGrowthParamStat(series);

                seriesList.push(series);
            }

            return seriesList;
        },

        updateGrowthParamStat: function (series) {
            const samples = series.samples;

            let s1_area_under_curve = 0;
            let s2_area_under_curve = 0;

            let s1_growth_rate = 0;
            let s2_growth_rate = 0;

            let s1_lag_phase = 0;
            let s2_lag_phase = 0;

            let s1_max_growth = 0;
            let s2_max_growth = 0;

            let method = 'NA';
            let n = 0;
            for (const i in samples) {
                const sample = samples[i];

                if (sample.grp_method != 'NA') {
                    n += 1;
                    method = sample.grp_method;
                    s1_area_under_curve += sample.grp_area_under_curve;
                    s2_area_under_curve +=
                        sample.grp_area_under_curve * sample.grp_area_under_curve;

                    s1_growth_rate += sample.grp_growth_rate;
                    s2_growth_rate += sample.grp_growth_rate * sample.grp_growth_rate;

                    s1_lag_phase += sample.grp_lag_phase;
                    s2_lag_phase += sample.grp_lag_phase * sample.grp_lag_phase;

                    s1_max_growth += sample.grp_max_growth;
                    s2_max_growth += sample.grp_max_growth * sample.grp_max_growth;
                }
            }
            series.avg_area_under_curve = (n > 0 ? s1_area_under_curve / n : 0).toFixed(3);
            series.avg_growth_rate = (n > 0 ? s1_growth_rate / n : 0).toFixed(3);
            series.avg_lag_phase = (n > 0 ? s1_lag_phase / n : 0).toFixed(3);
            series.avg_max_growth = (n > 0 ? s1_max_growth / n : 0).toFixed(3);

            series.se_area_under_curve = (
                n > 1
                    ? Math.sqrt(
                          (s2_area_under_curve * n - s1_area_under_curve * s1_area_under_curve) /
                              (n - 1) /
                              n /
                              n
                      )
                    : 0
            ).toFixed(5);
            series.se_growth_rate = (
                n > 1
                    ? Math.sqrt(
                          (s2_growth_rate * n - s1_growth_rate * s1_growth_rate) / (n - 1) / n / n
                      )
                    : 0
            ).toFixed(5);
            series.se_lag_phase = (
                n > 1
                    ? Math.sqrt((s2_lag_phase * n - s1_lag_phase * s1_lag_phase) / (n - 1) / n / n)
                    : 0
            ).toFixed(5);
            series.se_max_growth = (
                n > 1
                    ? Math.sqrt(
                          (s2_max_growth * n - s1_max_growth * s1_max_growth) / (n - 1) / n / n
                      )
                    : 0
            ).toFixed(5);
            series.samplesCountTotal = samples.length;
            series.samplesCountGood = n;
            series.grp_method = method;
        },
    });
});
