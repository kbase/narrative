define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseMatrix2DAbstract',
    'kbaseTabs',
    'jquery-dataTables',
], (KBWidget, bootstrap, $, kbaseMatrix2DAbstract, kbaseTabs, jquery_dataTables) => {
    return KBWidget({
        name: 'kbaseChromatographyMatrix',
        parent: kbaseMatrix2DAbstract,
        version: '1.0.0',

        render: function () {
            const pref = self.pref;

            // Prepare data for visualization
            const timePoints = this.getTimePoints(this.matrix);
            const substances = this.buildSubstances(this.matrix, timePoints);

            const timeSeriesSummary = this.getNumericProperyStat(
                this.matrix.metadata.row_metadata,
                'TimeSeries'
            );
            //            var substancesSummary = this.getSubstancesSummary(substances);

            this.loading(false);
            const $container = $('<div/>');
            this.$elem.append($container);

            // Create a tabPane for all tabs
            const $tabPane = $('<div>')
                .attr('id', pref + 'tab-content')
                .appendTo($container);
            const tabWidget = new kbaseTabs($tabPane, { canDelete: true, tabs: [] });

            // Build matrix overview tab
            const $tabOverview = $('<div/>');
            tabWidget.addTab({
                tab: 'Overview',
                content: $tabOverview,
                canDelete: false,
                show: true,
            });
            this.buildMatrixOverview($tabOverview);

            // Build  matrix summary tab
            const $tabSummary = $('<div/>');
            tabWidget.addTab({
                tab: 'Summary',
                content: $tabSummary,
                canDelete: false,
                show: false,
            });
            this.buildMatrixSummary($tabSummary, timeSeriesSummary, substances);

            // Build  matrix series tab
            const $tabSubstances = $('<div/>');
            tabWidget.addTab({
                tab: 'Substances',
                content: $tabSubstances,
                canDelete: false,
                show: false,
            });
            this.buildSubstancesTable($tabSubstances, substances);
        },

        getTimePoints: function (matrix) {
            return this.getNumericPropertyCourse(
                matrix.data.row_ids,
                matrix.metadata.row_metadata,
                'TimeSeries',
                'Time'
            );
        },

        buildMatrixSummary: function ($tab, timeSeriesSummary, substances) {
            const pref = this.pref;

            // Substances summary
            const $container = $('<div>').css('margin-top', '1em').appendTo($tab);

            $('<div>')
                .append('Substances summary')
                .css('font-style', 'italic')
                .appendTo($container);

            const $tableConditionsSummary = $('<table>')
                .attr('id', pref + 'conditions-summary-table')
                .addClass('table table-striped table-bordered')
                .css('width', '100%')
                .css('margin-left', '0px')
                .css('margin-right', '0px')
                .appendTo($container);

            $tableConditionsSummary.append(this.makeRow('Number of substances', substances.length));

            for (const i in substances) {
                const substabce = substances[i];
                $tableConditionsSummary.append(this.makeRow('Substance', substabce.label));
            }

            // Time points summary
            $('<div>')
                .append('Time course summary')
                .css('font-style', 'italic')
                .css('margin-top', '3em')
                .appendTo($container);

            const $tableTimeSummary = $('<table>')
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

        buildSubstances: function (matrix, timePoints) {
            const substances = [];
            const columnIds = matrix.data.col_ids;
            const columnsMetadata = matrix.metadata.column_metadata;

            for (const cIndex in columnIds) {
                const columnId = columnIds[cIndex];
                const columnMetadata = columnsMetadata[columnId];
                const substanceName = this.getPropertyValue(
                    columnMetadata,
                    'Measurement',
                    'Substance'
                );
                if (substanceName == null) continue;

                let maxValue = null;
                let maxValueTime = null;
                for (const i in timePoints) {
                    const timePoint = timePoints[i];
                    const time = timePoint.value;
                    const rIndex = timePoint.index;

                    const val = matrix.data.values[rIndex][cIndex];
                    if (maxValue == null || val > maxValue) {
                        maxValue = val;
                        maxValueTime = time;
                    }
                }

                substance = {
                    substanceId: columnId,
                    label: substanceName,
                    maxValue: maxValue,
                    maxValueTime: maxValueTime,
                };
                substances.push(substance);
            }

            return substances;
        },

        buildSubstancesTable: function ($container, substances) {
            this.buildTable(
                $container,
                substances,
                [
                    { sTitle: 'Substance ID', mData: 'substanceId' },
                    { sTitle: 'Substance', mData: 'label' },
                    { sTitle: 'Max value', mData: 'maxValue' },
                    { sTitle: 'Max value time', mData: 'maxValueTime' },
                ],
                'No substances found!'
            );
        },
    });
});
