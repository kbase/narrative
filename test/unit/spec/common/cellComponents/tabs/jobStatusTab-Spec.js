define([
    'base/js/namespace',
    'common/cellComponents/tabs/jobStatusTab',
    'jquery',
    'common/runtime',
    'common/props',
    'common/spec',
    'json!../../../../data/testAppObj.json',
], function (Jupyter, jobStatusTab, $, Runtime, Props, Spec, TestAppObject) {
    'use strict';

    describe('The job status tab module', function () {
        it('loads', function () {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has expected functions', function () {
            expect(jobStatusTab.make).toBeDefined();
        });
    });

    describe('The job status tab instance', function () {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let jobStatusTab, node, spec, parameters;

        beforeEach(function () {
            const bus = Runtime.make().bus();
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            parameters = spec.getSpec().parameters;

            const workspaceId = 54745;

            jobStatusTab = jobStatusTab.make({
                bus: bus,
                model: model,
                workspaceId: workspaceId,
                initialParams: model.getItem('params'),
                jobId: undefined
            });
        });

        afterEach(() => {
            $('body').empty();
            jobStatusTab = null;
            node = null;
        });

        it('has a make function that returns an object', function () {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has the required methods', function () {
            expect(jobStatusTab.start).toBeDefined();
            expect(jobStatusTab.stop).toBeDefined();
            expect(jobStatusTab.bus).toBeDefined();
        });

        it('should start and render itself', () => {
            return jobStatusTab
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    const contents = [
                        'job statuss',
                        'kb-file-path__table',
                        'kb-file-path__table_row',
                        'kb-file-path__file_number',
                        '1',
                        'fastq_rev_staging_file_name',
                        'fa fa-trash-o fa-lg',
                        'Add Row',
                    ];
                    contents.forEach((item) => {
                        expect(node.innerHTML).toContain(item);
                    });
                });
        });

        it('should add a row when Add Row button is clicked', () => {
            return jobStatusTab
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    let preClickNumberOfRows = $('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $('button')[1].click();
                    let postClickNumberOfRows = $('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
        });

        it('should delete a row when trashcan button is clicked', () => {
            return jobStatusTab
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    let preClickNumberOfRows = $('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $('button')[0].click();
                    let postClickNumberOfRows = $('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });
        });
    });
});
