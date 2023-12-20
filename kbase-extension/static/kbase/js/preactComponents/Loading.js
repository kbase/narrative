define([
    'preact',
    'htm',
    './Loading.styles',

    // For effect
    'bootstrap'
], (
    preact,
    htm,
    styles
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    class Loading extends Component {
        render() {
            const spinner = (() => {
                switch (this.props.size) {
                case 'normal':
                    return html`<span className="fa fa-spinner fa-pulse"></span>`;
                default:
                    return html`<span className="fa fa-2x fa-spinner fa-pulse"></span>`;
                }
            })();
            if (this.props.type === 'inline') {
                return html`
                    <div style=${styles.LoadingInline}>
                        ${spinner}
                        ${' '}
                        <span style=${styles.LoadingMessage}>
                            ${this.props.message}
                        </span>
                    </div>
                `;
            } else {
                return html`
                    <div style=${styles.LoadingContainer}>
                        <div style=${styles.Loading}>
                            ${spinner}
                            ${' '}
                            <span style=${styles.LoadingMessage}>
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