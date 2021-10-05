define([
    'React'
], (
    React
) => {
    'use strict';

    const { createElement: e, Component } = React;

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
            return e('div', {
                className: 'alert alert-danger'
            }, [
                'Error: ',
                message
            ]);
        }
    }

    return ShowError;
});
