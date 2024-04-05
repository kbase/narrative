define(['preact', 'preact_compat', 'htm', 'prop_types', 'bootstrap'], (
    preact,
    preactCompat,
    htm,
    PropTypes
) => {
    'use strict';

    const { h } = preact;
    const { Component } = preactCompat;
    const html = htm.bind(h);

    class Row extends Component {
        render() {
            const key = this.props['row-key'];
            const extraProps = {};
            if (key) {
                extraProps.key = key;
                extraProps['data-row-key'] = key;
            }
            return html`<div className="preactComponent-rotated-table-row" ...${extraProps}>
                ${this.props.children}
            </div>`;
        }
    }

    class HeaderCell extends Component {
        render() {
            return html`
                <div className="preactComponent-rotated-table-header-cell">
                    ${this.props.children}
                </div>
            `;
        }
    }

    class DisplayCell extends Component {
        render() {
            return html`
                <div className="preactComponent-rotated-table-value-cell">
                    ${this.props.children}
                </div>
            `;
        }
    }

    class Table extends Component {
        render() {
            return html`<div className="preactComponent-rotated-table">
                ${this.props.children}
            </div>`;
        }
    }

    Table.propTypes = {
        'row-key': PropTypes.string,
        children: PropTypes.element.isRequired,
    };

    DisplayCell.propTypes = {
        children: PropTypes.element,
    };

    HeaderCell.propTypes = {
        children: PropTypes.element,
    };

    Row.propTypes = {
        children: PropTypes.isRequired,
    };

    return { Table, Row, HeaderCell, DisplayCell };
});
