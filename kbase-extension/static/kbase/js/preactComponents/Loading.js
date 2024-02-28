define([
    'preact',
    'htm',

    // For effect
    'bootstrap',
], (preact, htm) => {
    'use strict';

    const { h, Component } = preact;
    const html = htm.bind(h);

    class Loading extends Component {
        render() {
            const spinner = (() => {
                switch (this.props.size) {
                    case 'normal':
                        return html`<span className="fa fa-spinner fa-pulse"></span>`;
                    case 'large':
                    default:
                        return html`<span className="fa fa-2x fa-spinner fa-pulse"></span>`;
                }
            })();

            switch (this.props.display) {
                case 'inline':
                    return html`
                        <div className="preactComponent-Loading-Inline" data-display="inline">
                            ${spinner} ${' '}
                            <span className="preactComponent-Loading-Message">
                                ${this.props.message}
                            </span>
                        </div>
                    `;
                case 'block':
                default:
                    return html`
                        <div className="preactComponent-Loading-Container" data-display="block">
                            <div className="preactComponent-Loading">
                                ${spinner} ${' '}
                                <span className="preactComponent-Loading-Message">
                                    ${this.props.message}
                                </span>
                            </div>
                        </div>
                    `;
            }
        }
    }

    return Loading;
});
