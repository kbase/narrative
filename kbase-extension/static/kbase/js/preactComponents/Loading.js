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

    class Loading extends Component {
        render() {
            const spinner = (() => {
                switch (this.props.size || 'normal') {
                    case 'normal':
                        return html`<span className="fa fa-spinner fa-pulse"></span>`;
                    case 'large':
                    default:
                        return html`<span className="fa fa-2x fa-spinner fa-pulse"></span>`;
                }
            })();

            switch (this.props.display || 'block') {
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

    Loading.propTypes = {
        size: PropTypes.oneOf(['normal', 'large']),
        display: PropTypes.oneOf(['inline', 'block']),
        message: PropTypes.string.isRequired,
    };

    Loading.defaultProps = {
        size: 'large',
        display: 'block',
    };

    return Loading;
});
