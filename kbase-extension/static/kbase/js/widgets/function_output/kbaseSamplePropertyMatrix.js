define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'plotly',
    'kbaseSamplePropertyMatrixAbstract',
    'kbaseTabs',
    'jquery-dataTables',
], (
    KBWidget,
    bootstrap,
    $,
    Plotly,
    kbaseSamplePropertyMatrixAbstract,
    kbaseTabs,
    jquery_dataTables
) => {
    return KBWidget({
        name: 'kbaseSamplePropertyMatrix',
        parent: kbaseSamplePropertyMatrixAbstract,
        version: '1.0.0',

        render: function () {
            const pref = self.pref;

            // Prepare data for visualization
            const matrix = this.matrix;
            const data = matrix.data;
            const rowsMetadata = matrix.metadata.row_metadata;
            const columnsMetadata = matrix.metadata.column_metadata;

            const samples = this.buildSamples(data.row_ids, rowsMetadata);
            const sampleProperties = this.buildSampleProperties(data.col_ids, columnsMetadata);

            const samplesSat = this.buildSamplesStat(matrix, samples, sampleProperties);
            const samplePropertiesStat = this.buildSamplePropertyStat(
                matrix,
                samples,
                sampleProperties
            );

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
            this.buildMatrixSummary($tabSummary, samples, sampleProperties);

            // Build  samples tab
            const $tabSamples = $('<div/>');
            tabWidget.addTab({
                tab: 'Samples',
                content: $tabSamples,
                canDelete: false,
                show: false,
            });
            this.buildSamplesTab($tabSamples, samplesSat);

            // Build  sample properties tab
            const $tabSampleProperties = $('<div/>');
            tabWidget.addTab({
                tab: 'Sample properties',
                content: $tabSampleProperties,
                canDelete: false,
                show: false,
            });
            this.buildSamplePropertiesTab($tabSampleProperties, samplePropertiesStat);
        },

        buildSamplesTab: function ($container, samplesSat) {
            this.buildTable(
                $container,
                samplesSat,
                [
                    { sTitle: 'Sample', mData: 'name' },
                    { sTitle: 'Max value', mData: 'maxPropertyValue' },
                    { sTitle: 'Max value property', mData: 'maxPropertyLabel' },
                    { sTitle: 'Min value', mData: 'minPropertyValue' },
                    { sTitle: 'Min value property', mData: 'minPropertyLabel' },
                ],
                'No samples found!'
            );
        },

        buildSamplePropertiesTab: function ($container, samplePropertiesStat) {
            this.buildTable(
                $container,
                samplePropertiesStat,
                [
                    { sTitle: 'Sample property', mData: 'label' },
                    { sTitle: 'Average', mData: 'avg' },
                    { sTitle: 'STD', mData: 'std' },
                    { sTitle: 'SE', mData: 'se' },
                    { sTitle: 'Number of samples', mData: 'count' },
                ],
                'No sample properties found!'
            );
        },

        buildMatrixSummary: function ($tab, samples, sampleProperties) {
            const pref = this.pref;

            // Substances summary
            const $container = $('<div>').css('margin-top', '1em').appendTo($tab);

            const $tableSummary = $('<table>')
                .attr('id', pref + 'summary-table')
                .addClass('table table-striped table-bordered')
                .css('width', '100%')
                .css('margin-left', '0px')
                .css('margin-right', '0px')
                .appendTo($container);

            $tableSummary
                .append(this.makeRow('Number of samples', samples.length))
                .append(this.makeRow('Number of properties', sampleProperties.length));
        },
    });
});
