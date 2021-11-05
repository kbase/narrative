define(['common/cellComponents/tabs/infoTab', 'testUtil'], (InfoTab, TestUtil) => {
    'use strict';

    describe('The App Info Tab module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(InfoTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(InfoTab.make).toBeDefined();
        });
    });

    describe('The App Info Tab instance', () => {
        const model = {
            getItem: (item) => model[item],
            app: { tag: 'Mock App' },
            'app.spec': {
                full_info: {
                    description: 'Details about this mock app',
                },
                info: {
                    authors: ['Abraham', 'Martin', 'John'],
                    id: 0,
                    subtitle: 'A mock app for testing purposes',
                    ver: '1.0.1',
                },
                parameters: [
                    {
                        text_options: {
                            valid_ws_types: ['KBaseRNASeq.RNASeqSampleSet'],
                        },
                        ui_name: 'RNA sequence object <font color=red>*</font>',
                    },
                    {
                        ui_name: 'Adapters',
                    },
                ],
            },
            executionStats: {
                number_of_calls: 1729,
                total_exec_time: 9001,
            },
        };
        const appSpec = model.getItem('app.spec');
        const infoTabInstance = InfoTab.make({ model });
        let container, infoTabPromise, infoTab;

        beforeEach(async () => {
            container = document.createElement('div');
            infoTabPromise = infoTabInstance.start({ node: container });
            infoTab = await infoTabPromise;
            return infoTab; // to use infoTab for linter
        });

        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });

        it('has a factory which can be invoked', () => {
            expect(infoTabInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            ['start', 'stop'].forEach((fn) => {
                expect(infoTabInstance[fn]).toBeDefined();
                expect(infoTabInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('has a method "start" which returns a Promise', () => {
            expect(infoTabPromise instanceof Promise).toBeTrue();
        });

        it('has a method "stop" which returns a Promise and clears its container', () => {
            // just expect it to have something real.
            expect(container.innerHTML).toContain('View Full Documentation');
            const result = infoTabInstance.stop();
            expect(result instanceof Promise).toBeTrue();
            return result.then(() => {
                expect(container.innerHTML).toEqual('');
            });
        });

        it('returns the defined description', () => {
            expect(infoTab.firstChild.firstChild.textContent).toBe(appSpec.full_info.description);
        });

        it('returns an item for each parameter', () => {
            const listItems = Array.from(infoTab.querySelectorAll('li li'));
            expect(listItems.length).toBe(appSpec.parameters.length);
        });

        it('renders parameter with formatting correctly', () => {
            const RNASeqFormat = infoTab.querySelectorAll('li li:nth-child(1) font');
            expect(RNASeqFormat.length).toBeGreaterThan(0);
        });

        it('renders parameter with no formatting correctly', () => {
            const AdaptersFormat = infoTab.querySelectorAll('li li:nth-child(2)')[0];
            expect(AdaptersFormat.innerText).toBe(appSpec.parameters[1].ui_name);
        });
    });
});
