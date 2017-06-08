define([
    'bluebird',
    'kb_common/html',
    'common/monoBus'
], function (
    Promise,
    html
) {
    // This is a functional html composition and generation library.
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        label = t('label');

    function factory(config) {
        // The node provided by the invoker of this widget.
        var hostNode;
        
        // A node created and owned by this widget. It is typically 
        // simply the only child of the host node.
        var container;

        // The runtime is provided by the caller, but may also be created
        // directly from the runtime module.
        var runtime = config.runtime;

        // This creates a bus "connection", which basically keeps any 
        // listener ids created by "on" or "listen" calls on 
        // channels it provides, the benefit being that they will all 
        // be closed when the connection is closed
        var busConnection = runtime.bus().connect();

        // This creates a new channel with a randomized (uuid) name.
        var channel = busConnection.channel();

        // This is NOT required for a widget. It is only a simple 
        // structure this widget uses for association DOM and state.
        var vm = {
            layout: {
                id: html.genId(),
                node: null
            },
            inputControl: {
                id: html.genId(),
                value: null,
                node: null,
                vm: {
                    name: {
                        id: html.genId(),
                        value: null,
                        node: null
                    },
                    disposition: {
                        id: html.genId(),
                        value: null,
                        node: null
                    }
                }
            }
        };

        // INPUT INTERFACE

        function setValue(newValue) {
            if (newValue === undefined) {
                return;
            }
            updateVm(vm.inputControl, newValue);
        }

        // UI

        var autoChangeTimer;
        var editPauseInterval = 100;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function doTouched(e) {
            channel.emit('touched');
            cancelTouched();
            autoChangeTimer = window.setTimeout(function () {
                autoChangeTimer = null;
                e.target.dispatchEvent(new Event('change'));
            }, editPauseInterval);
        }

        function updateVm(vm, data) {
            // the incoming data is raw json, need to 
            // dispence it to the vm, update the vm control value,
            // then sync the controls. I know, a lot of boilerplate, 
            // and a framework would make this easier...
            // Assume the data structure mirrors the vm -- that is the point
            // after all.. otherwise could of course be hand coded.

            if (vm.vm) {
                if (typeof data === 'object' && data !== null) {
                    Object.keys(data).forEach(function (key) {
                        updateVm(vm.vm[key], data[key]);
                    });
                }
            } else {
                vm.rawValue = data;
                // might transform
                vm.value = data;
                // might use a function to update the control
                if (vm.node) {
                    vm.node.value = data;
                }
            }
        }

        function exportVm(vm) {
            if (vm.vm) {
                var exported = {};
                Object.keys(vm.vm).forEach(function (key) {
                    exported[key] = exportVm(vm.vm[key]);
                });
                return exported;
            }
            return vm.value;
        }

        function doChanged() {
            var value = exportVm(vm.inputControl);
            channel.emit('changed', {
                newValue: value
            });
        }

        function renderLayout() {
            container.innerHTML = div({
                id: vm.layout.id
            });
            vm.layout.node = document.getElementById(vm.layout.id);
        }

        function setupInputNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
            vmNode.node.addEventListener('change', function () {
                vmNode.value = vmNode.node.value;
                doChanged();
            });
            vmNode.node.addEventListener('keyup', doTouched);
        }

        function renderControl() {
            vm.layout.node.innerHTML = div({
                dataElement: 'inputControl'
            }, [
                div({}, [
                    label({}, 'Name'),
                    input({
                        class: 'form-control',
                        dataElement: 'inputControl',
                        type: 'text',
                        id: vm.inputControl.vm.name.id,
                        value: vm.inputControl.vm.name.value
                    })
                ]),
                div({}, [
                    label({}, 'Disposition'),
                    input({
                        class: 'form-control',
                        dataElement: 'inputControl',
                        type: 'text',
                        id: vm.inputControl.vm.disposition.id,
                        value: vm.inputControl.vm.disposition.value
                    })
                ])
            ]);
            vm.inputControl.node = document.getElementById(vm.inputControl.id);
            setupInputNode(vm.inputControl.vm.name);
            setupInputNode(vm.inputControl.vm.disposition);
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function () {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                renderLayout();
                renderControl();
                setValue(arg.initialValue);
            });
        }

        function stop() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return {
            // comm bus
            channel: channel,

            // lifecycle api
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