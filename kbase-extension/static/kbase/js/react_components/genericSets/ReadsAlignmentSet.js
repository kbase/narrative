define([
    'React',
    './base/SetComponent',
    './base/Loader',
    'bootstrap'
], (
    React,
    SetComponent,
    Loader
) => {
    'use strict';

    const { createElement: e, Component } = React;

    class ReadsAlignmentSet extends SetComponent {
        constructor(props) {
            super(props);
        }

        renderItemTable() {
            const item = this.props.currentItem.value;
            if (!item) {
                return;
            }

            const {
                aligned_using,
                aligner_version,
                library_type,
                alignment_stats: {
                    total_reads, unmapped_reads, mapped_reads, multiple_alignments,
                    singletons
                }
            } = item.data;

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
            return e('div', null, e('table', {
                className: 'table table-bordered table-striped'
            }, e('tbody', null,
                rows.map(({ label, value }) => {
                    return e('tr', null, [
                        e('th', { width: '20%', style: { textAlign: 'left' } }, label),
                        e('td', null, value)
                    ]);
                }))
            ));
        }
    }

    class ReadsAlignmentSetLoader extends Component {
        constructor(props) {
            super(props);
        }
        render() {
            return e(Loader, {
                ...this.props,
                method: 'get_reads_alignment_set_v1',
                module: ReadsAlignmentSet
            });
        }
    }

    return ReadsAlignmentSetLoader;
});
