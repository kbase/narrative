define(['kbwidget', 'jquery', 'plotly', 'kbaseGrowthMatrixAbstract'], (
    KBWidget,
    $,
    Plotly,
    kbaseGrowthMatrixAbstract
) => {
    return KBWidget({
        name: 'kbaseGrowthCurves',
        parent: kbaseGrowthMatrixAbstract,
        version: '1.0.0',
        options: {
            valueType: null,
            sampleSeriesIds: null,

            showErrorBar: 1,
            logScale: 1,
        },

        MAX_LABEL_LENGTH: 25,

        render: function () {
            if (this.options.valueType == this.TYPE_SAMPLES) {
                this.renderSamplesMatrix();
            } else if (this.options.valueType == this.TYPE_SERIES) {
                this.renderSeriesMatrix();
            }
        },

        getSampleIds: function () {
            const valueType = this.options.valueType;
            const sampleSeriesIds = this.options.sampleSeriesIds;

            console.log('kbaseGrowthCurves this.options', this.options);

            let sampleIds = [];
            if (valueType == this.TYPE_SAMPLES) {
                if (sampleSeriesIds == null) {
                    sampleIds = this.matrix.data.col_ids;
                } else {
                    sampleIds = sampleSeriesIds;
                }
            } else if (valueType == this.TYPE_SERIES) {
                if (sampleSeriesIds == null) {
                    sampleIds = this.matrix.data.col_ids;
                } else {
                    // Build hash of seriesIds for the lookup
                    const seriesIdsSet = {};
                    const seriesIds = sampleSeriesIds;
                    for (const i in seriesIds) {
                        seriesIdsSet[seriesIds[i]] = true;
                    }

                    const columnsMetadata = this.matrix.metadata.column_metadata;
                    for (const cId in columnsMetadata) {
                        const columnMetadata = columnsMetadata[cId];
                        const seriesId = this.getPropertyValue(
                            columnMetadata,
                            'DataSeries',
                            'SeriesID'
                        );
                        if (seriesId == null) continue;
                        if (seriesId in seriesIdsSet) {
                            sampleIds.push(cId);
                        }
                    }
                }
            }

            return sampleIds;
        },

        renderSamplesMatrix: function () {
            const timePoints = this.getTimePoints(this.matrix);
            const sampleIds = this.getSampleIds();
            const samples = this.buildSamples(this.matrix, sampleIds, timePoints);
            const timeSeriesStat = this.getNumericProperyStat(
                this.matrix.metadata.row_metadata,
                'TimeSeries',
                'Time'
            );
            this.loading(false);

            const $overviewContainer = $('<div/>');
            this.$elem.append($overviewContainer);
            this.buildOverviewDiv($overviewContainer, samples, this.TYPE_SAMPLES);

            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildSamplesWidget($vizContainer, samples, timePoints, timeSeriesStat);
        },

        renderSeriesMatrix: function () {
            const timePoints = this.getTimePoints(this.matrix);
            const sampleIds = this.getSampleIds();
            const samples = this.buildSamples(this.matrix, sampleIds, timePoints);
            const series = this.groupSamplesIntoSeries(this.matrix, samples, timePoints);
            const timeSeriesStat = this.getNumericProperyStat(
                this.matrix.metadata.row_metadata,
                'TimeSeries',
                'Time'
            );

            this.loading(false);

            const $overviewContainer = $('<div/>');
            this.$elem.append($overviewContainer);
            this.buildOverviewDiv($overviewContainer, series, this.TYPE_SERIES);

            // // Separator
            // this.$elem.append( $('<div style="margin-top:1em"></div>') );

            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildSeriesWidget($vizContainer, series, timePoints, timeSeriesStat);
        },

        buildOverviewDiv: function ($containerDiv, conditions, valuesType) {
            const self = this;

            let msg = '';
            if (valuesType == this.TYPE_SAMPLES) {
                msg = '[Show/Hide Samples]';
            } else if (valuesType == this.TYPE_SERIES) {
                msg = '[Show/Hide Series]';
            }
            const $overviewSwitch = $('<a/>').html(msg);
            $containerDiv.append($overviewSwitch);

            const $overvewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overvewContainer);

            if (valuesType == this.TYPE_SAMPLES) {
                self.buildSamplesTable($overvewContainer, conditions);
            } else if (valuesType == this.TYPE_SERIES) {
                self.buildSeriesTable($overvewContainer, conditions);
            }

            $overviewSwitch.click(() => {
                $overvewContainer.toggle();
            });
        },

        buildSamplesWidget: function ($containerDiv, samples, timePoints, timeSeriesStat) {
            const data = [];

            console.log('samples', samples);

            const values = this.matrix.data.values;
            for (const i in samples) {
                const sample = samples[i];

                // Build xValues
                const xValues = [];
                for (const j in timePoints) {
                    const timePoint = timePoints[j];
                    xValues.push(timePoint.value);
                }

                // Build yValues
                const yValues = [];
                for (const j in timePoints) {
                    const rIndex = timePoints[j].index;
                    yValues.push(values[rIndex][sample.columnIndex]);
                }

                let label = sample.columnId + ' - ' + sample.label;
                if (label.length > this.MAX_LABEL_LENGTH) {
                    label = label.substring(0, this.MAX_LABEL_LENGTH) + '...';
                }

                // Build track
                const dataTrack = {
                    x: xValues,
                    y: yValues,
                    name: label,
                };
                data.push(dataTrack);
            }
            this.buildWidget(
                $containerDiv,
                data,
                this.matrix.description,
                'Time, ' + timeSeriesStat.valueUnit,
                'OD'
            );
        },

        buildSeriesWidget: function ($containerDiv, seriesList, timePoints, timeSeriesStat) {
            const options = this.options;
            const data = [];

            console.log('seriesList', seriesList);
            const values = this.matrix.data.values;
            for (const i in seriesList) {
                const series = seriesList[i];

                // Build xValues
                const xValues = [];
                for (const j in timePoints) {
                    const timePoint = timePoints[j];
                    xValues.push(timePoint.value);
                }

                // Build yValues
                const yValues = [];
                const yErrors = [];
                for (const j in timePoints) {
                    const rIndex = timePoints[j].index;

                    const samples = series.samples;
                    let s1 = 0;
                    let s2 = 0;
                    const n = samples.length;
                    for (const k in samples) {
                        const cIndex = samples[k].columnIndex;
                        s1 += values[rIndex][cIndex];
                        s2 += values[rIndex][cIndex] * values[rIndex][cIndex];
                    }
                    const avg = s1 / n;
                    const se = n > 1 ? Math.sqrt((s2 * n - s1 * s1) / (n - 1) / n / n) : 0;

                    yValues.push(avg);
                    yErrors.push(se);
                }

                let label = series.seriesId + ' - ' + series.label;
                if (label.length > this.MAX_LABEL_LENGTH) {
                    label = label.substring(0, this.MAX_LABEL_LENGTH) + '...';
                }

                // Build track
                const dataTrack = {
                    x: xValues,
                    y: yValues,
                    name: label,
                };

                if (options.showErrorBar == 1) {
                    dataTrack['error_y'] = {
                        type: 'data',
                        array: yErrors,
                        visible: true,
                    };
                }
                data.push(dataTrack);
            }
            this.buildWidget(
                $containerDiv,
                data,
                this.matrix.description,
                'Time, ' + timeSeriesStat.valueUnit,
                'OD'
            );
        },

        // Build widget to visualize growth curves
        buildWidget: function ($containerDiv, data, title, xAxisTitle, yAxisTitle) {
            const options = this.options;
            const layout = {
                autosize: true,
                margin: {
                    l: 50,
                    r: 50,
                    b: 100,
                    t: 100,
                    pad: 4,
                },
                title: title,
                showlegend: true,
                legend: {
                    x: 1,
                    y: 1,
                },
                titlefont: {
                    color: 'rgb(33, 33, 33)',
                    family: '',
                    size: 0,
                },
                xaxis: {
                    title: xAxisTitle,
                    titlefont: {
                        color: '',
                        family: '',
                        size: 0,
                    },
                },
                yaxis: {
                    title: yAxisTitle,
                    autorange: true,
                },
            };

            if (options.logScale == 1) {
                layout.yaxis.type = 'log';
            }

            Plotly.plot($containerDiv[0], data, layout, { showLink: false });
        },
    });
});
