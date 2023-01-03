define(['jquery', 'kbaseTabs', 'testUtil', 'bootstrap'], ($, KBaseTabs, testUtil) => {
    'use strict';

    /**
     * TODO: need to incorporate the main Narrative stylesheet
     * <link type="text/css" rel="stylesheet" href="/narrative/static/style/style.min.css">
     * as it contains the bootstrap styles. These styles are important for tabs, since each tab
     * may be pre-rendered, and as such they will appear to "appear" before they appear.
     * In other words, they are in the dom, but hidden by default and only shown if the "active"
     * class is added.
     */

    const { tryFor } = testUtil;

    // Constants

    // A default timeout value for async "tryFor" calls.
    const TIMEOUT = 1000;

    /**
     * Gets the text for the "active" (aka visible) tab within the given DOM node tree.
     * 
     * @param {JQuery} $host - an ancestor node containing the tabset; expects there to be only one tabset.
     * @returns {{navText: string, panelText: string}} - an object containing the tab navigation (aka "tab") text and the tab pane text.
     */
    function getVisiblePanelText($host) {
        // Get tab text (always visible)
        const navText = $host.find('[role="tab"]').text();

        // Get panel text (only the visible one).
        const panelText = $host.find('[role="tabpanel"].active').text();

        return { navText, panelText };
    }

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

            // Note on this technique: It isn't very good test methodology,
            // which should focus on what the user sees and experiences.
            // Here we assume that the "active" class makes a panel visible.

            const { navText, panelText } = getVisiblePanelText($host);

            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');
        });

        async function expectSelectNthTab($host, n, content) {
            // First find, validate, and click the requested tab.
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.nav);
            $tab.find('a').click();

            // Then wait for the panel to appear
            return await tryFor(() => {
                const { panelText } = getVisiblePanelText($host);
                const foundIt = panelText.includes(content.panel);
                return [foundIt, null];
            }, TIMEOUT);
        }

        async function expectCloseNthTab($host, n, content) {
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.closedTab);
            $tab.find('button').click();

            // We only check for success if content was passed in, otherwise
            // we are just clicking it.
            if (content.nextTab) {
                return await tryFor(() => {
                    const { panelText } = getVisiblePanelText($host);
                    const fooGone = !panelText.includes(content.closedTab);
                    const fuzzHere = panelText.includes(content.nextTab);
                    return [fooGone && fuzzHere, null];
                }, TIMEOUT);
            }
        }

        async function expectCloseNthTabWithDialog($host, n, content) {
            const $tab = $($host.find(`[role="tab"]:nth-child(${n})`));
            expect($tab.text()).toContain(content.closedTab);
            $tab.find('button').click();

            // First we look for the modal and confirm the deletion.
            await tryFor(() => {
                // The remove tab confirmation button has the text label "Remove"
                const $removeButton = $('.modal-dialog .btn:contains(Delete)');
                if ($removeButton.length === 0) {
                    return [false, false];
                }
                $removeButton.click();
                return [true, true];
            }, TIMEOUT);

            return await tryFor(() => {
                const closedTabPaneGone = !$host.text().includes(content.closedTab);
                const nextTabPanePresent = $host.text().includes(content.nextTab);
                return [closedTabPaneGone && nextTabPanePresent, null];
            }, TIMEOUT);
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
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });
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
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            // But then we should be able to remove the first tab, and now see the second one.
            await expectCloseNthTab($host, 1, {
                closedTab: 'Foo',
                nextTab: 'Fuzz',
            });
        });

        it('a deletable tab which is last should show the prior one when it is closed', async () => {
            const $host = $(document.createElement('div'));
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
                        content: 'Fuzz',
                    },
                ],
            });

            // Should start out as normal behavior
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            // Navigate to second tab.
            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });

            // But then we should be able to remove the first tab, and now see the second one.
            await expectCloseNthTab($host, 2, { closedTab: 'Baz', nextTab: 'BAR' });
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
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

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

            // Should start out as normal behavior
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            // Initially, the second tab should not have the eventually expected content,
            // nor any text for that matter
            const $secondTabPanel = $($host.find(`[role="tabpanel"]:nth-child(2)`));
            expect($secondTabPanel.text()).not.toContain('Fuzz');
            expect($secondTabPanel.text()).toEqual('');

            // Ensure that the
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

            // Should start out as normal behavior
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            // Initially, the second tab should not have the eventually expected content,
            // nor any text for that matter
            const $secondTabPanel = $($host.find(`[role="tabpanel"]:nth-child(2)`));
            expect($secondTabPanel.text()).not.toContain('Fuzz');
            expect($secondTabPanel.text()).toBeGreaterThanOrEqual('');

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
            const { navText, panelText } = getVisiblePanelText($host);
            expect(navText).toContain('Foo');
            expect(panelText).toContain('BAR');
            expect(navText).toContain('Baz');
            expect(panelText).not.toContain('Fuzz');

            // When opened, the second tab should contain the content.
            await expectSelectNthTab($host, 2, { nav: 'Baz', panel: 'Fuzz' });

            // And we should now have the next expected condition.
            (() => {
                const { navText, panelText } = getVisiblePanelText($host);
                expect(navText).toContain('Foo');
                expect(panelText).not.toContain('BAR');
                expect(navText).toContain('Baz');
                expect(panelText).toContain('Fuzz');
            })();

            // We are omitting the nextTab content in the third parameter, so this does
            // not confirm success (because it won't succeed in that way!)
            await expectCloseNthTab($host, 2, { closedTab: 'Baz' });

            // The tab deletion callback does nothing but set callbackValue to 'Baz'.
            await tryFor(() => {
                return [callbackValue === 'Baz', null];
            }, TIMEOUT);

            // And the tabset should be in the same state.
            (() => {
                const { navText, panelText } = getVisiblePanelText($host);
                expect(navText).toContain('Foo');
                expect(panelText).not.toContain('BAR');
                expect(navText).toContain('Baz');
                expect(panelText).toContain('Fuzz');
            })();
        });
    });
});
