define([
    'react'
], (
    React
) => {
    'use strict';

    const { createElement: e, Component } = React;

    /**
     * A class to display an error message.
     *
     * This is a simple error viewer. It does not show extended information like
     * stacktrace, or richer data from Service clients, like the error code.
     * It should handle service client errors, any error based on the Error class,
     * any object which has a "message" property, and a simple string.
     */
    class ErrorMessage extends Component {
        render() {
            const error = this.props.error;
            let message;
            if (typeof error === 'object' && error !== null) {
                if (error.error && error.error.message) {
                    // handle errors thrown by kbase service clients
                    message = error.error.message;
                } else if (error.message) {
                    // Standard Error objects or descendants, or those which act like one in this regard.
                    message = error.message;
                } else {
                    message = 'Unknown Error (incompatible object)';
                }
            } else if (typeof error === 'string') {
                message = error;
            } else {
                message = 'Unknown Error (incompatible type)';
            }

            return e('div', {
                className: 'alert alert-danger'
            }, [
                'Error: ',
                message
            ]);
        }
    }

    return ErrorMessage;
});
