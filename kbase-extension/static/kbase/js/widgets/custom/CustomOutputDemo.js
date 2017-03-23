define([
    'bluebird',
    'kb_common/html'
], function (
    Promise,
    html
) {
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var hostNode = config.node,
            container = hostNode.appendChild(document.createElement('div')),
            places = {
                main: {
                    id: html.genId(),
                    node: null
                },
                error: {
                    id: html.genId(),
                    node: null
                },
                input: {
                    id: html.genId(),
                    node: null
                }
            };


        // UI

        function renderLayout() {
            container.innerHTML = div({
                style: {
                    border: '1px red dashsed'
                }
            }, [
                div({
                    id: places.main.id
                }),
                div({
                    id: places.error.id
                })
            ]);
            places.main.node = document.getElementById(places.main.id);
            places.error.node = document.getElementById(places.error.id);
        }

        renderLayout();

        function doChange() {
            var value = places.input.node.value;

            // save the value into the input metadata ...

            config.api.saveState({
                input: value
            });

            config.api.emit('metadata-changed', null);
        }

        function render(stuff) {
            // console.log('config', config);
            places.main.node.innerHTML = div({}, [
                div({}, [
                    'Param1: ' + config.data.param1
                ]),
                div({}, [
                    'Param2: ',
                    div({},
                        [
                            div({
                            }, 'Name:' + config.data.param2.name),
                            div({
                            }, 'Disposition:' + config.data.param2.disposition),
                        ]
                    )
                ]),
                div({}, [
                    input({
                        type: 'text',
                        id: places.input.id                        
                    })
                ])
            ]);
            places.input.node = document.getElementById(places.input.id);
            places.input.node.addEventListener('change', function (e) {
                doChange();
            });
        }



        // LIFECYCLE API

        function start(params) {
            return Promise.try(function () {
                    render();
                    // var state = config.api.getState();
                    var state = config.state;
                    if (state && typeof state === 'object') {
                        places.input.node.value = state.input;
                    }
                    state = config.api.getState();
                    if (state && typeof state === 'object') {
                        places.input.node.value = state.input;
                    }
                    //  config.cellApi.saveState('hi');
                    // console.log('get state', config.cellApi.getState());
                })
                .catch(function (err) {
                    places.error.node.innerHTML = 'Oops: ' + err.message;
                });
        }

        function stop() {
            return Promise.try(function () {});
        }
        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});