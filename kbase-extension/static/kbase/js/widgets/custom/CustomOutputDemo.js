define(['bluebird', 'common/html'], (Promise, html) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const hostNode = config.node,
            container = hostNode.appendChild(document.createElement('div')),
            places = {
                main: {
                    id: html.genId(),
                    node: null,
                },
                error: {
                    id: html.genId(),
                    node: null,
                },
                input: {
                    id: html.genId(),
                    node: null,
                },
            };

        // UI

        function renderLayout() {
            container.innerHTML = div(
                {
                    style: {
                        border: '1px red dashsed',
                    },
                },
                [
                    div({
                        id: places.main.id,
                    }),
                    div({
                        id: places.error.id,
                    }),
                ]
            );
            places.main.node = document.getElementById(places.main.id);
            places.error.node = document.getElementById(places.error.id);
        }

        renderLayout();

        function doChange() {
            const value = places.input.node.value;

            // save the value into the input metadata ...

            config.api.saveState({
                input: value,
            });

            config.api.emit('metadata-changed', null);
        }

        function render() {
            places.main.node.innerHTML = div({}, [
                div({}, ['Param1: ' + config.data.param1]),
                div({}, [
                    'Param2: ',
                    div({}, [
                        div({}, 'Name: ' + config.data.param2.name),
                        div({}, 'Disposition: ' + config.data.param2.disposition),
                    ]),
                ]),
                div({}, [
                    input({
                        type: 'text',
                        id: places.input.id,
                    }),
                ]),
            ]);
            places.input.node = document.getElementById(places.input.id);
            places.input.node.addEventListener('change', () => {
                doChange();
            });
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                render();
                let state = config.state;
                if (state && typeof state === 'object') {
                    places.input.node.value = state.input;
                }
                state = config.api.getState();
                if (state && typeof state === 'object') {
                    places.input.node.value = state.input;
                }
            }).catch((err) => {
                places.error.node.innerHTML = 'Oops: ' + err.message;
            });
        }

        function stop() {
            return Promise.try(() => {});
        }
        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
