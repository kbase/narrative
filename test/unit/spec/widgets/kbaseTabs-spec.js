define(['jquery', 'kbaseTabs', '../util/asyncTools'], ($, KBaseTabs, asyncTools) => {
    'use strict';

    const { tryFor } = asyncTools;

    describe('The KBaseTabs widget', () => {
        it('module should load', () => {
            expect(KBaseTabs).toBeDefined();
        });

        it('should render with minimal options', () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        content: 'Fuzz',
                    },
                ],
            });
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');
        });

        async function expectSelectNthTab($host, n, content) {
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.nav);
            $tab.find('a').click();
            return await tryFor(() => {
                const foundIt = $host.text().includes(content.panel);
                return [foundIt, null];
            }, 1000);
        }

        async function expectCloseNthTab($host, n, content) {
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.closedTab);
            $tab.find('button').click();

            // We only check for success if content was passed in, otherwise
            // we are just clicking it.
            if (content.nextTab) {
                return await tryFor(() => {
                    const fooGone = !$host.text().includes(content.closedTab);
                    const fuzzHere = $host.text().includes(content.nextTab);
                    return [fooGone && fuzzHere, null];
                }, 1000);
            }
        }

        async function expectCloseNthTabWithDialog($host, n, content) {
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.closedTab);
            $tab.find('button').click();

            // First we look for the modal and confirm the deletion.
            await tryFor(() => {
                const $deleteButton = $('.modal-dialog .btn:contains(Delete)');
                if ($deleteButton.length === 0) {
                    return [false, false];
                }
                $deleteButton.click();
                return [true, true];
            }, 1000);

            return await tryFor(() => {
                const fooGone = !$host.text().includes(content.closedTab);
                const fuzzHere = $host.text().includes(content.nextTab);
                return [fooGone && fuzzHere, null];
            }, 1000);
        }

        it('should render a tab pane when the tab button is clicked', async () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        content: 'Fuzz',
                    },
                ],
            });
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            const foundIt = await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });
            expect(foundIt).toBeNull();
        });

        it('a deletable tab should disappear', async () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                confirmDelete: false,
                tabs: [
                    {
                        tab: 'Foo',
                        canDelete: true,
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        content: 'Fuzz',
                    },
                ],
            });

            // Should start out as normal behavior
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            // But then we should be able to remove the first tab, and now see the second one.
            const foundIt = await expectCloseNthTab($host, 1, {
                closedTab: 'Foo',
                nextTab: 'Fuzz',
            });
            expect(foundIt).toBeNull();
        });

        it('a deletable tab which is last should show the prior one when it is closed', async () => {
            const $host = $(document.createElement('div'));
            KBaseTabs($host, {
                confirmDelete: false,
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        canDelete: true,
                        content: 'Fuzz',
                    },
                ],
            });

            // Should start out as normal behavior
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            // Navigate to second gab.
            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });

            // But then we should be able to remove the first tab, and now see the second one.
            const foundIt = await expectCloseNthTab($host, 2, { closedTab: 'Baz', nextTab: 'BAR' });
            expect(foundIt).toBeNull();
        });

        it('a deletable tab with confirmation should pop up a confirmation dialog', async () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                confirmDelete: true,
                tabs: [
                    {
                        tab: 'Foo',
                        canDelete: true,
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        content: 'Fuzz',
                    },
                ],
            });

            // Should start out as normal behavior
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            // But then we should be able to remove the first tab, and now see the second one.
            const foundIt = await expectCloseNthTabWithDialog($host, 1, {
                closedTab: 'Foo',
                nextTab: 'Fuzz',
            });
            expect(foundIt).toBeNull();
        });

        it('should render tab with a render functions', async () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        showContentCallback: () => {
                            return 'Fuzz';
                        },
                    },
                ],
            });
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            const foundIt = await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });
            expect(foundIt).toBeNull();
        });

        it('should render tab with a render functions each time if it is dynamic', async () => {
            const $host = $(document.createElement('div'));
            let fuzzCounter = 0;
            new KBaseTabs($host, {
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        dynamicContent: true,
                        showContentCallback: () => {
                            return `Fuzz ${++fuzzCounter}`;
                        },
                    },
                ],
            });
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz 1' });
            await expectSelectNthTab($host, 1, { nav: 'Foo', panel: 'BAR' });
            const foundIt = await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz 2' });
            expect(foundIt).toBeNull();
        });

        it('a deletable tab with an deleteCallback will invoke the callback and not delete', async () => {
            const $host = $(document.createElement('div'));
            let callbackValue = null;
            new KBaseTabs($host, {
                confirmDelete: false,
                tabs: [
                    {
                        tab: 'Foo',
                        content: 'BAR',
                    },
                    {
                        tab: 'Baz',
                        canDelete: true,
                        deleteCallback: (tabName) => {
                            callbackValue = tabName;
                        },
                        content: 'Fuzz',
                    },
                ],
            });

            // Should start out as normal behavior
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
            expect($host.text()).toContain('Baz');
            expect($host.text()).not.toContain('Fuzz');

            // Navigate to second gab.
            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });

            expect($host.text()).toContain('Fuzz');

            // We are omitting the nextTab content in the third parameter, so this does
            // not confirm success (because it won't succeed in that way!)
            await expectCloseNthTab($host, 2, { closedTab: 'Baz' });

            await tryFor(() => {
                return [callbackValue === 'Baz', null];
            }, 1000);

            // And it should still be there.
            expect($host.text()).toContain('Fuzz');
        });
    });
});
