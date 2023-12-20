define([
    'preact',
    'htm',

    'css!./IFrame.css'
], (
    preact,
    htm,
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    class IFrame extends Component {
        render() {

            // The target url is based on the base service url, with a namespace of "widgets",
            // and ultimately invoking the web app as "appName".
            const url = (() => {
                const url = new URL(`${this.props.serviceURL}/widgets/${this.props.appName}`);
                // for (const [key, value] of Object.entries(this.props.params)) {
                //     url.searchParams.append(key, value);
                // }
                url.searchParams.append('params', JSON.stringify(this.props.params));
                return url.toString();
            })();


            // All the app needs to get started is the host channel id, so that it can
            // begin communicating with the host (the Narrative!) via the iframe window.
            const iframeParams = {
                hostChannelId: this.props.hostChannelId,
                pluginChannelId: this.props.pluginChannelId
            }

            return html`
                <iframe src=${url}
                        class="nbextensions-serviceWidgetCell-IFrame"
                        data-params=${encodeURIComponent(JSON.stringify(iframeParams))}
                        data-app-host="true"
                        onLoad=${(ev) => {this.props.onLoaded(ev.target)}}
                />
            `;
        }
    }

    return IFrame;
});
