define(['../../../../../narrative/nbextensions/appCell2/widgets/tabs/infoTab'], (infoTabWidget) => {
    'use strict';

    describe('The App Info Tab module', () => {
        it('loads', () => {
            expect(infoTabWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(infoTabWidget.make).toBeDefined();
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
        const mockInfoTab = infoTabWidget.make({ model });
        let node, infoTabPromise, infoTab;

        beforeEach(async () => {
            node = document.createElement('div');
            infoTabPromise = mockInfoTab.start({ node });
            infoTab = await infoTabPromise;
            return infoTab; // to use infoTab for linter
        });

        it('has a factory which can be invoked', () => {
            expect(mockInfoTab).not.toBe(null);
        });

        it('has the required methods', () => {
            expect(mockInfoTab.start).toBeDefined();
            expect(mockInfoTab.stop).toBeDefined();
        });

        it('has a method "start" which returns a Promise', () => {
            expect(infoTabPromise instanceof Promise).toBeTrue();
        });

        it('has a method "stop" which returns a Promise', () => {
            const result = mockInfoTab.stop();
            expect(result instanceof Promise).toBeTrue();
        });

        it('returns the defined description', () => {
            expect(infoTab.firstChild.textContent).toBe(appSpec.full_info.description);
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
