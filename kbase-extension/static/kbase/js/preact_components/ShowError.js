define([
], function (
) {
    'use strict';

    // Ugly but true - preact is loaded globally by Jupyter and not as an AMD module.
    const { h, Component } = window.preact;

    class ShowError extends Component {
        render() {
            const error = this.props.error;
            let message;
            if (error.error && error.error.message) {
                // handle errors thrown by kbase service clients
                message = error.error.message;
            } else if (error.message) {
                // standard error objects
                message = error.message;
            } else {
                message = error;
            }
            return h('div', {
                className: 'alert alert-danger'
            }, [
                'Error: ',
                message
            ]);
        }
    }
});
