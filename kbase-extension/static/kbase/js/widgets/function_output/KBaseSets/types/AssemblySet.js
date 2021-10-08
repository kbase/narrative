define([
    'react',
    '../SetBrowser',
    'bootstrap'
], (
    React,
    SetBrowser,
) => {
    'use strict';

    const { createElement: e } = React;

    class AssemblySet extends SetBrowser {
        renderItemTable() {
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

    // class AssemblySetLoader extends Component {
    //     render() {
    //         return e(SetLoader, {
    //             ...this.props,
    //             method: 'get_assembly_set_v1',
    //             module: AssemblySet
    //         });
    //     }
    // }

    // return AssemblySetLoader;
    return AssemblySet;
});
