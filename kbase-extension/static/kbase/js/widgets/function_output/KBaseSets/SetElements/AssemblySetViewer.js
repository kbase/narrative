define([
    'react',
    'prop-types',
    'bootstrap'
], (
    React,
    PropTypes,
) => {
    'use strict';

    const { Component, createElement: e } = React;

    class AssemblySetViewer extends Component {
        render() {
            const {
                dna_size, gc_content, num_contigs,
            } = this.props.object;

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

    AssemblySetViewer.propTypes = {
        object: PropTypes.shape({
            dna_size: PropTypes.number.isRequired,
            gc_content: PropTypes.number.isRequired,
            num_contigs: PropTypes.number.isRequired
        }).isRequired,
        objectInfo: PropTypes.object.isRequired
    };

    return AssemblySetViewer;
});
