/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb_common/html'
], function (html) {
    'use strict';
    
    var t = html.tag,
        div = t('div'), span = t('span');
        
    function factory(config) {
        var container,
            wrappedWidget = config.widget,
            wrappedId = html.genId();
        
        function layout() {
            return div({id: wrappedId});
        }

        function attach(node) {
            container = node;
            container.innerHTML = layout();
            // convert our root node to a container for hosting the rows.
            // TODO: double check this.
            container.classList.add('container-fluid');
            return wrappedWidget.attach(container.querySelector('#' + wrappedId));
        }
        function start() {
            if (wrappedWidget.start) {
                return wrappedWidget.start();
            }
        }
        function run(input) {
            if (wrappedWidget.run) {
                return wrappedWidget.run(input);
            }
        }
        return {
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});