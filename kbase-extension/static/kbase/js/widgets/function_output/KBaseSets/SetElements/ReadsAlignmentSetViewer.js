define([
    'react',
    'prop-types',
    'bootstrap',

    'css!styles/widgets/function_output/KBaseSets/SetElements/SetElement.css'
], (
    React,
    PropTypes,
) => {
    'use strict';

    const { Component, createElement: e } = React;

    class ReadsAlignmentSetViewer extends Component {
        render() {
            const {
                aligned_using,
                aligner_version,
                library_type,
                alignment_stats: {
                    total_reads, unmapped_reads, mapped_reads, multiple_alignments,
                    singletons
                }
            } = this.props.object;

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
                className: 'table table-bordered SetElement'
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

    ReadsAlignmentSetViewer.propTypes = {
        object: PropTypes.shape({
            aligned_using: PropTypes.string.isRequired,
            aligner_version: PropTypes.string.isRequired,
            library_type: PropTypes.string.isRequired,
            alignment_stats: PropTypes.shape({
                total_reads: PropTypes.number.isRequired,
                unmapped_reads: PropTypes.number.isRequired,
                mapped_reads: PropTypes.number.isRequired,
                multiple_alignments: PropTypes.number.isRequired,
                singletons: PropTypes.number.isRequired
            }).isRequired
        }).isRequired,
        objectInfo: PropTypes.object.isRequired
    };

    return ReadsAlignmentSetViewer;
});
