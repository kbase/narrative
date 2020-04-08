/*global define, describe, it, expect, jasmine, beforeEach, afterEach*/
/*jslint white: true*/
define([
    'util/jobLogViewer'
], (
    JobLogViewer
) => {
    describe('Test the job log viewer module', () => {
        let hostNode = null;
        beforeEach(() => {
            hostNode = document.createElement('div');
            document.body.appendChild(hostNode);
        });

        afterEach(() => {
            hostNode.remove();
        });

        it('Should load the module code successfully', () => {
            expect(JobLogViewer).toBeDefined();
        });

        it('Should have the factory method', () => {
            expect(JobLogViewer.make).toBeDefined();
            expect(JobLogViewer.make).toEqual(jasmine.any(Function));
        });

        it('Should be created', () => {
            let viewer = JobLogViewer.make();
            expect(viewer.start).toEqual(jasmine.any(Function));
            expect(viewer.stop).toEqual(jasmine.any(Function));
            expect(viewer.detach).toEqual(jasmine.any(Function));
        });

        it('Should fail to start without a node', () => {
            let viewer = JobLogViewer.make();
            const jobId = 'fakejob';
            let arg = {
                jobId: jobId
            };
            expect(() => {viewer.start(arg)}).toThrow(new Error('Requires a node to start'));
        });

        it('Should fail to start without a jobId', () => {
            let viewer = JobLogViewer.make();
            let arg = {
                node: hostNode
            };
            expect(() => {viewer.start(arg)}).toThrow(new Error('Requires a job id to start'));
        });

        it('Should start as expected with inputs, and be stoppable and detachable', () => {
            let viewer = JobLogViewer.make();
            let arg = {
                node: hostNode,
                jobId: 'someFakeJob'
            };
            viewer.start(arg);
            expect(hostNode.querySelector('div[data-element="kb-log"]')).toBeDefined();
            viewer.detach();
            expect(hostNode.innerHTML).toBe('');
        });
    });
})
