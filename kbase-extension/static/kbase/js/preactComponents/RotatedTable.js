define(['preact', 'htm'], (preact, htm) => {
    'use strict';
    const { h, Component } = preact;
    const html = htm.bind(h);

    class Row extends Component {
        render() {
            return html`<div className="preactComponent-rotated-table-row">
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
