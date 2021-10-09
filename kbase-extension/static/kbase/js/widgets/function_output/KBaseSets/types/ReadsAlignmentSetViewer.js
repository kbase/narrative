define([
    'react',
    'widgets/function_output/KBaseSets/Viewer',
    'bootstrap'
], (
    React,
    Viewer,
) => {
    'use strict';

    const { createElement: e } = React;

    class ReadsAlignmentSetViewer extends Viewer {
        renderSetElement() {
            const selectedItem = this.props.set.selectedItem;
            if (selectedItem.status !== 'loaded' && typeof selectedItem.value === 'undefined') {
                return null;
            }

            const {
                aligned_using,
                aligner_version,
                library_type,
                alignment_stats: {
                    total_reads, unmapped_reads, mapped_reads, multiple_alignments,
                    singletons
                }
            } = selectedItem.value;

            const rows = [
                {
                    label: 'Aligned Using',
                    value: aligned_using
                },
                {
                    label: 'Aligner Version',
                    value: aligner_version
                },
                {
                    label: 'Library Type',
                    value: library_type
                },
                {
                    label: 'Total Reads',
                    value: Intl.NumberFormat('en-US', {}).format(total_reads)
                },
                {
                    label: 'Unmapped Reads',
                    value: [
                        Intl.NumberFormat('en-US', {}).format(unmapped_reads),
                        ' (',
                        Intl.NumberFormat('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 2
                        }).format(unmapped_reads / total_reads),
                        ')'
                    ]
                },
                {
                    label: 'Mapped Reads',
                    value: [
                        Intl.NumberFormat('en-US', {}).format(mapped_reads),
                        ' (',
                        Intl.NumberFormat('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 2
                        }).format(mapped_reads / total_reads),
                        ')'
                    ]
                },
                {
                    label: 'Multiple Alignments',
                    value: [
                        Intl.NumberFormat('en-US', {}).format(multiple_alignments),
                        ' (',
                        Intl.NumberFormat('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 2
                        }).format(multiple_alignments / mapped_reads),
                        ')'
                    ]
                },
                {
                    label: 'Singletons',
                    value: [
                        Intl.NumberFormat('en-US', {}).format(singletons),
                        ' (',
                        Intl.NumberFormat('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 2
                        }).format(singletons / mapped_reads),
                        ')'
                    ]
                }
            ];
            return e('table', {
                className: 'table table-bordered table-striped'
            }, e('tbody', null,
                rows.map(({ label, value }) => {
                    return e('tr', { key: label },
                        e('th', null, label),
                        e('td', null, value)
                    );
                }))
            );
        }
    }

    return ReadsAlignmentSetViewer;
});
