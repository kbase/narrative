define([
    './base/SetComponent',
    './base/Loader',
    'bootstrap'
], function (
    SetComponent,
    Loader
) {
    'use strict';

    // Ugly but true - preact is loaded globally by Jupyter and not as an AMD module.
    const { h } = window.preact;

    class AssemblySet extends SetComponent {
        constructor(props) {
            super(props);
        }

        renderItemTable() {
            const item = this.props.currentItem.value;
            if (!item) {
                return;
            }

            const {
                dna_size, gc_content, num_contigs,
                base_counts: { A, C, T, G }
            } = item.data;

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
            return h('div', null, h('table', {
                className: 'table table-bordered table-striped'
            }, h('tbody', null,
                rows.map(({ label, value }) => {
                    return h('tr', null, [
                        h('th', { width: '20%', style: { textAlign: 'left' } }, label),
                        h('td', null, value)
                    ])
                }))
            ));
        }
    }

    class AssemblySetLoader extends Loader {
        constructor(props) {
            props = {
                ...props,
                method: 'get_assembly_set_v1',
                module: AssemblySet
            }
            super(props);
        }
    }

    return AssemblySetLoader;
});
