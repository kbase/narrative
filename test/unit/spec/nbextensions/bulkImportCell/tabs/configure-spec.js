/* global describe, it, expect, spyOn */
define([
    '../../../../../../../narrative/nbextensions/bulkImportCell/tabs/configure',
    'common/ui',
    'common/runtime',
    'common/props',
    'common/spec',
    'json!../../../../../data/testAppObj.json'
], (
    ConfigureTab,
    UI,
    Runtime,
    Props,
    Spec,
    TestAppObject
) => {
    'use strict';

    describe('test the bulk import cell configure tab', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken'
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should start and render itself', () => {
            const bus = Runtime.make().bus();
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => { }
            });
            let spec = Spec.make({
                appSpec: model.getItem('app.spec')
            });

            const configure = ConfigureTab.make({bus, model, spec});
            return configure.start({
                node: node
            })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(node.innerHTML).toContain('Parameters');
                    expect(node.innerHTML).toContain('File Paths');
                });
        });

        it('should stop itself and empty the node it was in', () => {
            const bus = Runtime.make().bus();
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => { }
            });
            let spec = Spec.make({
                appSpec: model.getItem('app.spec')
            });

            const configure = ConfigureTab.make({bus, model, spec});
            return configure.start({
                node: node
            })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(node.innerHTML).toContain('Parameters');
                    return configure.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
