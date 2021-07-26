/**
 * Pairwise correlation of gene expression profiles.
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'uuid',
    'kbaseExpressionGenesetBaseWidget',
    'kbaseHeatmap',

    /* for effect */
    'bootstrap',
], (KBWidget, $, Uuid, kbaseExpressionGenesetBaseWidget, kbaseHeatmap) => {
    'use strict';

    // The "MAX_GENES_*" constants are utilized to control performance of using a
    // matrix, which has N² character, generally.

    // Controls the max genes for which a heatmap will be inserted into the DOM.
    const MAX_GENES_FOR_INLINE_HEATMAP = 50;

    // Controls the max genes for which a heatmap will be generated (and queried for), period.
    const MAX_GENES_FOR_HEATMAP = 200;

    // Heatmap display controls.
    const HEATMAP_COLORS = ['#FFA500', '#FFFFFF', '#0066AA'];
    const HEATMAP_MIN_VALUE = -1.0;
    const HEATMAP_MAX_VALUE = 1.0;
    const HEATMAP_ROW_HEIGHT = 15;
    const HEATMAP_MIN_HEIGHT = 210;

    // See base-extension/static/kbase/js/widgets/vis/kbaseHeatmap.js
    const HEATMAP_Y_GUTTER = 80;
    const HEATMAP_Y_PADDING = 20;
    const HEATMAP_X_GUTTER = 110;
    const HEATMAP_X_PADDING = 150;

    function $renderWarningAlert(warningContent) {
        const $warningElement = $('<div>')
            .addClass('alert alert-warning')
            .css('display', 'flex')
            .css('flex-direction', 'row')
            .css('align-items', 'center');

        $warningElement.append(
            $('<span>')
                .addClass('fa fa-exclamation-triangle')
                .css('margin-right', '0.5em')
                .css('font-size', '130%')
        );
        if (typeof warningContent === 'string') {
            $warningElement.append($('<span>').text(warningContent));
        } else {
            $warningElement.append(warningContent);
        }
        return $warningElement;
    }

    /**
     * kbaseExpressionPairwiseCorrelation object viewer widget
     *
     * constructor params:
     * - geneIds {}
     * - workspaceID {}
     * - expressionMatrixID {}
     *
     * from kbaseExpressionGenesetBaseWidget
     * - featureset {}
     * - loadingImage {}
     */

    return KBWidget({
        name: 'kbaseExpressionPairwiseCorrelation',
        parent: kbaseExpressionGenesetBaseWidget,
        version: '1.0.0',

        // To be overridden to specify additional parameters
        getSubmatrixParams: function () {
            const self = this;

            let features = [];
            if (self.options.geneIds) {
                features = $.map(self.options.geneIds.split(','), $.trim);
            }

            return {
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                row_ids: features,
                fl_row_pairwise_correlation: 1,
                fl_row_set_stats: 1,
            };
        },

        buildWidget: function ($hostDiv) {
            const submatrixStat = this.submatrixStat;
            const rowDescriptors = submatrixStat.row_descriptors;
            const values = submatrixStat.row_pairwise_correlation.comparison_values;

            //Build row ids
            const rowIds = [];
            for (let i = 0; i < rowDescriptors.length; i++) {
                rowIds.push(rowDescriptors[i].id);
            }

            // Build data
            const data = [];
            for (let i = 0; i < rowDescriptors.length; i++) {
                const row = [];
                for (let j = 0; j < rowDescriptors.length; j++) {
                    row.push(values[i][j]);
                }
                data.push(row);
            }
            const heatmap = {
                row_ids: rowIds,
                row_labels: rowIds,
                column_ids: rowIds,
                column_labels: rowIds,
                data,
            };

            const $container = $('<div>').css('margin-top', '5px');
            $hostDiv.html($container);

            if (rowIds.length > MAX_GENES_FOR_HEATMAP) {
                const message = [
                    `The selected cluster has ${rowIds.length} genes.`,
                    `Heatmaps cannot be generated for clusters with more than ${MAX_GENES_FOR_HEATMAP} genes, for performance reasons.`,
                ].join(' ');
                $container.append($renderWarningAlert(message));
                return;
            }

            const [heatmapWidth, heatmapHeight] = (() => {
                const size = rowIds.length;
                let rowHeight = HEATMAP_ROW_HEIGHT;
                let height = HEATMAP_Y_GUTTER + HEATMAP_Y_PADDING + size * rowHeight;

                // Under HEATMAP_MIN_HEIGHT pixels, we set the height to the min height.
                if (height < HEATMAP_MIN_HEIGHT) {
                    height = HEATMAP_MIN_HEIGHT;
                    rowHeight = Math.round(
                        (height - (HEATMAP_Y_GUTTER + HEATMAP_Y_PADDING)) / size
                    );
                }
                const columnWidth = rowHeight;
                const width = HEATMAP_X_GUTTER + HEATMAP_X_PADDING + size * columnWidth;

                return [width, height];
            })();

            const $heatmapContainer = $('<div>')
                .css('width', `${heatmapWidth}px`)
                .css('height', `${heatmapHeight}px`)
                .attr('data-testid', 'heatmap');

            // TODO: heatmap values out of range still scale color instead of just the max/min color
            new kbaseHeatmap($heatmapContainer, {
                dataset: heatmap,
                colors: HEATMAP_COLORS,
                minValue: HEATMAP_MIN_VALUE,
                maxValue: HEATMAP_MAX_VALUE,
            });

            if (rowIds.length > MAX_GENES_FOR_INLINE_HEATMAP) {
                const buttonId = new Uuid(4).format();

                const $svg = $heatmapContainer.find('svg');
                const $heatmapDownloadContainer = $.jqElem('div').append($svg);

                const downloadHeatmap = () => {
                    const file = new Blob([$heatmapDownloadContainer.html()], {
                        type: 'text',
                    });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(file);
                    link.href = url;
                    link.download = 'pairwise.svg';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }, 0);
                };

                const $message = $('<span>')
                    .append($('<span>').text(`The selected cluster has ${rowIds.length} genes.`))
                    .append(' ')
                    .append(
                        $('<span>').text(
                            `Heatmaps for clusters with more than ${MAX_GENES_FOR_INLINE_HEATMAP} genes are not displayed inline, for performance reasons.`
                        )
                    )
                    .append(' ')
                    .append(
                        $('<span>')
                            .append('However you may')
                            .append(' ')
                            .append(
                                $('<a>')
                                    .attr('href', '#')
                                    .click((event) => {
                                        event.preventDefault();
                                        downloadHeatmap();
                                    })
                                    .text('download it')
                            )
                            .append('.')
                    );
                $container.append($renderWarningAlert($message));

                $container.append(
                    $.jqElem('p').append(
                        $.jqElem('button')
                            .attr('data-testid', 'download-button')
                            .attr('id', buttonId)
                            .append('Download the SVG image file for this pairwise correlation')
                            .addClass('btn btn-primary')
                            .on('click', () => {
                                downloadHeatmap();
                            })
                    )
                );
                return;
            }

            $container.append($heatmapContainer);
        },
    });
});
