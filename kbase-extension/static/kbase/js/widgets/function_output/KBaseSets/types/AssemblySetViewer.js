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

    class AssemblySetViewer extends Viewer {
        renderSetElement() {
            const selectedItem = this.props.set.selectedItem;
            if (selectedItem.status !== 'loaded' && typeof selectedItem.value === 'undefined') {
                return null;
            }

            const {
                dna_size, gc_content, num_contigs,
            } = selectedItem.value;

            const rows = [
                {
                    label: 'DNA Size',
                    value: Intl.NumberFormat('en-US', {}).format(dna_size)
                },
                {
                    label: 'Contig Count',
                    value: Intl.NumberFormat('en-US', {}).format(num_contigs)
                },
                {
                    label: 'GC Content',
                    value: Intl.NumberFormat('en-US', {
                        style: 'percent',
                        minimumFractionDigits: 2
                    }).format(gc_content),
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

    return AssemblySetViewer;
});
