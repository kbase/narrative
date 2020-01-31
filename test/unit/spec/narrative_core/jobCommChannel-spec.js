/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jobCommChannel',
    'base/js/namespace'
], (
    JobCommChannel,
    Jupyter
) => {
    'use strict';

    const DEFAULT_COMM_INFO = {
        content: {
            comms: []
        }
    };
    const DEFAULT_COMM = {
        on_msg: () => { },
        send: () => { }
    };

    function makeMockNotebook(commInfoReturn, registerTargetReturn) {
        commInfoReturn = commInfoReturn || DEFAULT_COMM_INFO;
        registerTargetReturn = registerTargetReturn || DEFAULT_COMM;
        return {
            save_checkpoint: () => { /* no op */ },
            kernel: {
                comm_info: (name, cb) => cb(commInfoReturn),
                execute: (code, cb) => cb.shell.reply({content: {}}),
                comm_manager: {
                    register_comm: () => {},
                    register_target: (name, cb) => cb(registerTargetReturn, {})
                }
            }
        };
    }

    describe('Test the jobCommChannel widget', () => {
        beforeEach(() => {
            Jupyter.notebook = makeMockNotebook();
        });

        it('Should load properly', () => {
            expect(JobCommChannel).not.toBeNull();
        });

        it('Should be instantiable and contain the right components', () => {
            let comm = new JobCommChannel();
            expect(comm.initCommChannel).toBeDefined();
            expect(comm.jobStates).toEqual({});
        });

        it('Should initialize correctly on request', (done, fail) => {
            let comm = new JobCommChannel();
            comm.initCommChannel()
                .then(done)
                .catch((err) => {
                    console.error(err);
                    fail();
                });
        });
    });
});
