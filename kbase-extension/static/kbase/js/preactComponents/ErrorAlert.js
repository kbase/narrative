define(['preact', 'htm', 'bootstrap', 'css!./ErrorAlert.css'], (preact, htm) => {
    'use strict';

    const { h, Component } = preact;
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
                <p class="ErrorAlert-title">${this.renderIcon()} ${this.props.title || 'Error'}</p>
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
                <div class="ErrorAlert -grow alert alert-danger">
                    ${this.renderTitle()} ${this.renderContent()}
                </div>
            `;
        }
    }

    return ErrorAlert;
});
