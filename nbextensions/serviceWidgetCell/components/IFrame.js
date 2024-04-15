/**
 * A module implementing an iframe to serve as the host of a dynamic service widget app.
 */

define(['preact', 'preact_compat', 'prop_types', 'htm'], (preact, preactCompat, PropTypes, htm) => {
    'use strict';

    const { h } = preact;
    const { Component } = preactCompat;
    const html = htm.bind(h);

    class IFrame extends Component {
        render() {
            // All the app needs to get started is the host channel id, so that it can
            // begin communicating with the host (the Narrative!) via the iframe window.
            const iframeParams = {
                channelId: this.props.channelId,
                hostOrigin: window.location.origin,
            };
            // The target url is based on the base service url, with a namespace of "widgets",
            // and ultimately invoking the widget as "widgetName".
            const url = new URL(`${this.props.serviceURL}/widgets/${this.props.widgetName}`);

            // Parameters for the widget itself.
            url.searchParams.append('params', JSON.stringify(this.props.params));

            // Parameters intended for the service widget support code within the
            // service widget app, and specifically for iframe integration.
            // We cannot pass parameters in iframe attributes, as kbase-ui does,
            // because it the source may be hosted on a different origin, in which
            // case the code running inside of the iframe will not be able to read
            // any attributes from the iframe element.
            url.searchParams.append('iframeParams', JSON.stringify(iframeParams));

            return html`
                <iframe
                    src=${url.toString()}
                    class="nbextensions-serviceWidgetCell-IFrame"
                    data-app-host="true"
                    onLoad=${(ev) => {
                        this.props.onLoaded(ev.target);
                    }}
                />
            `;
        }
    }

    IFrame.propTypes = {
        channelId: PropTypes.string.isRequired,
        serviceURL: PropTypes.string.isRequired,
        params: PropTypes.object.isRequired,
        onLoaded: PropTypes.func.isRequired,
    };

    return IFrame;
});
