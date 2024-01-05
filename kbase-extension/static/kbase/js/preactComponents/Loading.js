define([
    'preact',
    'htm',

    // For effect
    'bootstrap',
    'css!./Loading.css'
], (
    preact,
    htm
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
                    <div className="Loading-Inline">
                        ${spinner}
                        ${' '}
                        <span className="Loading-Message">
                            ${this.props.message}
                        </span>
                    </div>
                `;
            } else {
                return html`
                    <div className="Loading-Container">
                        <div className="Loading">
                            ${spinner}
                            ${' '}
                            <span className="Loading-Message">
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