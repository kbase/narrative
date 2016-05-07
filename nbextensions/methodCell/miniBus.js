/*global define */
/*jslint white:true,global:true*/
/*
 * MiniBus
 * A lightweight message bus implementation.
 * Specialized for cells. 
 *
 */
define([
], function () {
    'use strict';
    function factory(config) {
        var listener = {
            cells: {}
        },
        pending = [],
            interval = 0,
            timer;
        function addListener(cell, message, handler) {
            if (!listener.cells[cell.cell_id]) {
                listener.cells[cell.cell_id] = {};
            }
            var listeners = listener.cells[cell.cell_id];
            listeners[message] = handler;
        }
        function processPending() {
            console.log('processing pending', pending.length);
            var processing = pending;
            pending = [];
            processing.forEach(function (item) {
                if (!listener.cells[item.cellId]) {
                    return;
                }
                if (!listener.cells[item.cellId][item.message]) {
                    return;
                }
                var fun = listener.cells[item.cellId][item.message];

                try {
                    fun(item.data);
                } catch (ex) {
                    console.error('ERROR (1)', ex);
                }
            });
        }
        function run() {
            if (timer) {
                return;
            }
            timer = window.setTimeout(function () {
                try {
                    processPending();
                } catch (ex) {
                    console.error('ERROR (2)', ex);
                } finally {
                    timer = null;
                }
            }, interval);
        }
        function send(cellId, message, data) {
            pending.push({
                cellId: cellId,
                message: message,
                data: data
            });
            run();
        }

        return {
            listen: addListener,
            send: send
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});