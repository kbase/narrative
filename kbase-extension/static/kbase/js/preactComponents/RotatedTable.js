define(['preact', 'htm'], (preact, htm) => {
    'use strict';
    const { h, Component } = preact;
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

    return { Table, Row, HeaderCell, DisplayCell };
});
