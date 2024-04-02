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

    class ErrorAlert extends Component {
        renderIcon() {
            if (!this.props.showIcon) {
                return;
            }
            return html` <span class="fa fa-exclamation-triangle"></span> `;
        }

        renderTitle() {
            if (this.props.compact) {
                return this.renderIcon();
            }
            return html`
                <p class="preactComponent-ErrorAlert-title">
                    ${this.renderIcon()} ${this.props.title || 'Error'}
                </p>
            `;
        }
        renderContent() {
            if (this.props.render) {
                return this.props.render();
            }
            return this.props.message || this.props.children;
        }
        render() {
            return html`
                <div class="preactComponent-ErrorAlert alert alert-danger">
                    ${this.renderTitle()} ${this.renderContent()}
                </div>
            `;
        }
    }

    ErrorAlert.propTypes = {
        showIcon: PropTypes.bool,
        compact: PropTypes.bool,
        title: PropTypes.string.isRequired,
        render: PropTypes.func,
        message: PropTypes.string,
    };

    return ErrorAlert;
});
