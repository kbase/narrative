/*global define*/
/*eslint-env browser*/

define([
    'jquery',
    'bluebird'
], function (
    $,
    Promise
) {
    'use strict';

    function factory (config) {
        var container,
            parentBus = config.bus

        function start(args) {
            container = args.node;
            return Promise.try(function() {
                container.innerHTML = "I am a reads set editor viewer. Hi.";
                container.innerHTML += '<iframe width="854" height="480" src="https://www.youtube.com/embed/6ql7HAUzU7U" frameborder="0" allowfullscreen></iframe>';
            });
        }

        function stop() {
            return Promise.try(function() {

            });
        }

        return {
            start: start,
            stop: stop
        }

    }

    return {
        make: factory
    }
});
