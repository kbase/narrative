/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'uuid',
    'common/ui',
    'kb_common/html'
], function(Promise, Uuid, UI, html) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        ul = t('ul'),
        li = t('li');

    function convertJobError(errorInfo) {
        var errorId = new Uuid(4).format(),
            errorType, errorMessage, errorDetail;
        if (errorInfo.error) {
            // Classic KBase rpc error message
            errorType = errorInfo.name;
            errorMessage = errorInfo.message;
            errorDetail = errorInfo.error;
        } else if (errorInfo.name) {
            errorType = 'unknown';
            errorMessage = errorInfo.name + ' (code: ' + String(errorInfo.code) + ')';
            errorDetail = 'This error occurred during execution of the app job.';
        } else {
            errorType = 'unknown';
            errorMessage = 'Unknown error (check console for ' + errorId + ')';
            errorDetail = 'There is no further information about this error';
        }

        return {
            location: 'job execution',
            type: errorType,
            message: errorMessage,
            detail: errorDetail
        };
    }

    function convertInternalError(errorInfo) {
        return {
            location: 'app cell',
            type: errorInfo.title,
            message: errorInfo.message,
            advice: ul({ style: { paddingLeft: '1.2em' } }, errorInfo.advice.map(function(adv) {
                return li(adv);
            })),
            detail: errorInfo.detail
                // info:  errorInfo ? html.makeObjTable(errorInfo.info, {rotated: true, classes: []}) : null
        };
    }

    function renderErrorLayout() {
        return div([
            div({ style: { fontWeight: 'bold' } }, [
                'Type'
            ]),
            div({ dataElement: 'type' }),
            div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                'Message'
            ]),
            div({ dataElement: 'message' }),
            div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                'Advice'
            ]),
            div({ dataElement: 'advice' }),
            div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                'Detail'
            ]),
            div({
                dataElement: 'detail',
                style: {
                    border: '0px silver solid',
                    padding: '4px',
                    xoverflowY: 'auto',
                    wordBreak: 'break-word'
                }
            }),
            div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                'Info'
            ]),
            div({ dataElement: 'info' })
        ]);
    }

    function factory(config) {
        var container, ui, model = config.model;

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;

                // Very simple for now, just render the results json in a prettier than normal fashion.

                container.innerHTML = renderErrorLayout();

                ui = UI.make({ node: container });

                var viewModel;
                if (model.hasItem('exec.jobState.error')) {
                    viewModel = convertJobError(model.getItem('exec.jobState.error'));
                } else if (model.hasItem('internalError')) {
                    viewModel = convertInternalError(model.getItem('internalError'));
                } else {
                    viewModel = {
                        location: 'unknown',
                        type: 'unknown',
                        message: 'An unknown error was detected',
                        detail: ''
                    };
                }
                console.error('errorTab', viewModel);

                ui.updateFromViewModel(viewModel);
            });
        }

        function stop() {
            return Promise.try(function() {
                container.innerHTML = 'Bye from error';
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});