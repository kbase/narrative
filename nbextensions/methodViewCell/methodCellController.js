/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/miniBus'
], function (Bus) {
    'use strict';

    // FOR NOW: use module global state
    // TODO: use window global state

    var methodCells = {},
        bus = Bus.make();


    function addCell(cell) {
        methodCells[cell.getMeta('attributes', 'id')] = {
            cell: cell
        };
    }

    function getCell(kbaseCellId) {
        return methodCells[kbaseCellId];
    }


    function updateRunStatus(cell, data) {
        // console.log('RUNSTATUS', data);
        var jobState = cell.getMeta('jobState');
        switch (data.status) {
            case 'error':
                jobState.runState = 'completed';
                jobState.resultState = 'error';
                jobState.endTime = new Date().getTime();
                cell.setMeta('jobState', jobState);
                // setMeta(cell, 'attributes', 'status', 'job:' + data.status);
                addNotification(cell, 'danger', data.message);
                break;
            case 'job_started':
                jobState.runState = 'running';
                jobState.resultState = 'started';
                // jobState.endTime = new Date().getTime();

                addJob(cell, data.job_id);
                // setMeta(cell, 'attributes', 'status', 'job_started');
                // TODO: tell the job manager? or perhaps it already knows.
                break;
        }
    }
    
    // EVENTS
    
    // LIFECYCLE
    
    function init() {
        
    }
    function start() {
        bus.listen({
            test: function (message) {
                return (message.type === 'runstatus');
            },
            handle: function (message) {
                // updateRunStatus(cell, message);
                console.log('RUNSTATUS', message);
            }
        });
    }
    function stop() {
        
    }

    return {
        init: init,
        start: start,
        stop: stop,
        
        addCell: addCell,
        getCell: getCell
    };
});