define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'plotly',
    'kbaseGrowthMatrixAbstract',
    'kbaseTabs',
    'jquery-dataTables',
], function (
    KBWidget,
    bootstrap,
    $,
    Plotly,
    kbaseGrowthMatrixAbstract,
    kbaseTabs,
    jquery_dataTables
) {
    return KBWidget({
        name: 'kbaseGrowthMatrix',
        parent: kbaseGrowthMatrixAbstract,
        version: '1.0.0',

        render: function () {
            var pref = self.pref;

            // Prepare data for visualization
            var timePoints = this.getTimePoints(this.matrix);
            var samples = this.buildSamples(this.matrix, this.matrix.data.col_ids, timePoints);
            var series = this.groupSamplesIntoSeries(this.matrix, samples, timePoints);

            var timeSeriesSummary = this.getNumericProperyStat(
                this.matrix.metadata.row_metadata,
                'TimeSeries',
                'Time'
            );
            var samplesSummary = this.getSamplesSummary(samples);

            this.loading(false);
            var $container = $('<div/>');
            this.$elem.append($container);

            // Create a tabPane for all tabs
            var $tabPane = $('<div>')
                .attr('id', pref + 'tab-content')
                .appendTo($container);
            var tabWidget = new kbaseTabs($tabPane, { canDelete: true, tabs: [] });

            // Build  matrix overview tab
            var $tabOverview = $('<div/>');
            tabWidget.addTab({
                tab: 'Overview',
                content: $tabOverview,
                canDelete: false,
                show: true,
            });
            this.buildMatrixOverview($tabOverview);

            // Build  matrix summary tab
            var $tabSummary = $('<div/>');
            tabWidget.addTab({
                tab: 'Summary',
                content: $tabSummary,
                canDelete: false,
                show: false,
            });
            this.buildMatrixSummary($tabSummary, timeSeriesSummary, samplesSummary, series);

            // Build samples tab
            var $tabSamples = $('<div/>');
            tabWidget.addTab({
                tab: 'Samples',
                content: $tabSamples,
                canDelete: false,
                show: false,
            });
            this.buildSamplesTable($tabSamples, samples);

            // Build  matrix series tab
            var $tabSeries = $('<div/>');
            tabWidget.addTab({ tab: 'Series', content: $tabSeries, canDelete: false, show: false });
            this.buildSeriesTable($tabSeries, series);
        },

        buildMatrixSummary: function ($tab, timeSeriesSummary, samplesSummary, series) {
            var pref = this.pref;

            // Conditions summary
            var $container = $('<div>').css('margin-top', '1em').appendTo($tab);

            $('<div>')
                .append('Samples/Series summary')
                .css('font-style', 'italic')
                .appendTo($container);

            var $tableConditionsSummary = $('<table>')
                .attr('id', pref + 'conditions-summary-table')
                .addClass('table table-striped table-bordered')
                .css('width', '100%')
                .css('margin-left', '0px')
                .css('margin-right', '0px')
                .appendTo($container);

            $tableConditionsSummary
                .append(this.makeRow('Number of samples', samplesSummary.samplesCount))
                .append(this.makeRow('Number of series', series.length));

            for (var i in samplesSummary.properties) {
                var propSummary = samplesSummary.properties[i];
                $tableConditionsSummary.append(
                    this.makeRow(
                        propSummary.propName +
                            (propSummary.propertyUnit ? ' (' + propSummary.propertyUnit + ')' : ''),
                        propSummary.valuesString
                    )
                );
            }

            // Time points summary
            $('<div>')
                .append('Time course summary')
                .css('font-style', 'italic')
                .css('margin-top', '3em')
                .appendTo($container);

            var $tableTimeSummary = $('<table>')
                .attr('id', pref + 'time-summary-table')
                .addClass('table table-striped table-bordered')
                .css('width', '100%')
                .css('margin-left', '0px')
                .css('margin-right', '0px')
                .appendTo($container);

            $tableTimeSummary
                .append(this.makeRow('Number of points', this.matrix.data.row_ids.length))
                .append(
                    this.makeRow(
                        'Min time (' + timeSeriesSummary.valueUnit + ')',
                        timeSeriesSummary.valueMin
                    )
                )
                .append(
                    this.makeRow(
                        'Max time (' + timeSeriesSummary.valueUnit + ')',
                        timeSeriesSummary.valueMax
                    )
                );
        },
    });
});
