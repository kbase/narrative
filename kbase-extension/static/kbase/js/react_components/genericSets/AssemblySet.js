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

    const { createElement: e } = React;

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
                // base_counts: { A, C, T, G }
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

    class AssemblySetLoader extends Loader {
        constructor(props) {
            props = {
                ...props,
                method: 'get_assembly_set_v1',
                module: AssemblySet
            };
            super(props);
        }
    }

    return AssemblySetLoader;
});
