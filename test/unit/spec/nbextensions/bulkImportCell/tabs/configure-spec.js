define([
    '/narrative/nbextensions/bulkImportCell/tabs/configure',
    'base/js/namespace',
    'common/runtime',
    'common/props',
    'common/spec',
    '/test/data/testAppObj',
], (ConfigureTab, Jupyter, Runtime, Props, Spec, TestAppObject) => {
    'use strict';

    describe('test the bulk import cell configure tab', () => {
        let bus, container;
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };

            const params = TestAppObject.params;
            TestAppObject.params = {
                fastq_reads: params,
            };
        });

        beforeEach(() => {
            bus = Runtime.make().bus();
            container = document.createElement('div');
        });

        afterEach(() => {
            container.remove();
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should start and render itself', () => {
            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });
            const spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            const configure = ConfigureTab.make({ bus, model, spec, fileType: 'fastq_reads' });
            return configure
                .start({
                    node: container,
                })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(container.innerHTML).toContain('Parameters');
                    expect(container.innerHTML).toContain('File Paths');
                });
        });

        it('should stop itself and empty the node it was in', () => {
            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });
            const spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            const configure = ConfigureTab.make({ bus, model, spec, fileType: 'fastq_reads' });
            return configure
                .start({
                    node: container,
                })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(container.innerHTML).toContain('Parameters');
                    return configure.stop();
                })
                .then(() => {
                    expect(container.innerHTML).toEqual('');
                });
        });
    });
});
