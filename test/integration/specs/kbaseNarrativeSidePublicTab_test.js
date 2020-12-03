/*global describe, it, browser, expect, $, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative, sendString} = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.
const allTestCases = {
    ci: {
        TEST_CASE1: {
            narrativeId: 53983,
            row: 4,
            name: 'Acetobacter ascendens',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001766255.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CP015168'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '4'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,032'
                }
            ]
        },
        TEST_CASE2: {
            narrativeId: 53983,
            row: 10,
            scrollTo: true,
            name: 'Acidaminococcus fermentans',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Terrabacteria group > Firmicutes > Negativicutes > Acidaminococcales > Acidaminococcaceae > Acidaminococcus'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_900107075.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_FNOP01000039'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '40'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,067'
                }
            ]
        },
        TEST_CASE3: {
            narrativeId: 53983,
            row: 1,
            scrollTo: false,
            searchFor: 'prochlorococcus',
            foundCount: '14',
            name: 'Prochlorococcus marinus str. GP2',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Prochloraceae > Prochlorococcus > Prochlorococcus marinus'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_000759885.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JNAH01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '11'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,760'
                }
            ]
        },
        TEST_CASE4: {
            narrativeId: 53983,
            searchFor: 'foobar',
            foundCount: 'None'
        },
        TEST_CASE5: {
            narrativeId: 53983,
            row: 30,
            scrollTo: true,
            scrolls: [
                20
            ],
            name: 'Acinetobacter baumannii',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Gammaproteobacteria > Pseudomonadales > Moraxellaceae > Acinetobacter > Acinetobacter calcoaceticus/baumannii complex'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_000804875.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JSCS01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '74'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,862'
                }
            ]
        }
    },
    'narrative-dev':  {
        TEST_CASE1: {
            narrativeId: 78050,
            row: 3,
            name: 'Absiella sp. AM09-45',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Terrabacteria group > Firmicutes > Erysipelotrichia > Erysipelotrichales > Erysipelotrichaceae > Absiella > unclassified Absiella'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_003433745.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_QVFJ01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '96'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '4,170'
                }
            ]
        },
        TEST_CASE2: {
            narrativeId: 78050,
            row: 10,
            scrollTo: true,
            name: 'Abyssicoccus albus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Terrabacteria group > Firmicutes > Bacilli > Bacillales > Staphylococcaceae > Abyssicoccus'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_003815035.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_RKRK01000002'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '10'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,777'
                }
            ]
        },
        TEST_CASE3: {
            narrativeId: 78050,
            row: 1,
            scrollTo: false,
            searchFor: 'prochlorococcus',
            foundCount: '28',
            name: 'Prochlorococcus marinus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Prochloraceae > Prochlorococcus'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001180245.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CVSV01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '136'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,648'
                }
            ]
        },
        TEST_CASE4: {
            narrativeId: 78050,
            searchFor: 'foobar',
            foundCount: 'None'
        },
        TEST_CASE5: {
            narrativeId: 78050,
            row: 30,
            scrollTo: true,
            scrolls: [
                20
            ],
            name: 'Acetobacter orientalis',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_002153475.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JOMO01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '106'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,539'
                }
            ]
        }
    }
};

const testCases = allTestCases[browser.config.testParams.ENV];

async function testField({container, id, label, value}) {
    const lineageLabel = await container.$(`[role="row"][data-test-id="${id}"] [data-test-id="label"]`);
    expect(lineageLabel).toHaveText(label);
    const lineageValue = await container.$(`[role="row"][data-test-id="${id}"] [data-test-id="value"]`);
    expect(lineageValue).toHaveText(value);
}

async function waitForRows(panel, count){
    await browser.waitUntil(async () => {
        const rows = await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
        return rows.length >= count;
    });
    return await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
}

async function openPublicData() {
    // Open the data slideout
    const button = await $('[data-test-id="data-slideout-button"]');
    await button.waitForExist();
    await browser.waitUntil(() => {
        return button.isClickable();
    });
    await button.click();

    // Here we locate the public data tab, move the mouse cursor to it, and then
    // click on its container, which should open the public data panel.
    // The reason for this roundabout approach is that the click handler is on the
    // container, not the individual tabs. 
    const panel = await $('[data-test-id="data-slideout-panel"]');
    await panel.waitForExist();

    const tablist = await panel.$('[role="tablist"]');
    await tablist.waitForExist();

    const publicTab = await panel.$('[data-test-id="tab-public"]');
    await publicTab.waitForExist();

    await publicTab.moveTo();
    await publicTab.waitUntil(() => {
        return publicTab.isClickable();
    });
    await publicTab.click();

    const publicPanel = await panel.$('[data-test-id="panel-public"]');
    await publicPanel.waitForExist();

    // get rows
    // When using roles, we sometimes need to be very specific in our queries.
    // Maybe roles are not suitable for integration tests, then.
    
    const rows = await waitForRows(publicPanel, 20);
    expect(rows.length).toEqual(20);
    return publicPanel;
}

describe('Test kbaseNarrativeSidePublicTab', () => {

    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens the public data search tab, should show default results', async () => {
        const testCase = testCases.TEST_CASE1;
        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        const rows = await waitForRows(publicPanel, testCase.row);

        expect(rows.length).toBeGreaterThanOrEqual(testCase.row);
        const row = rows[testCase.row - 1];
        expect(row).toBeDefined();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(testCase.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of testCase.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, should show default results, scroll to desired row', async () => {
        const testCase = testCases.TEST_CASE2;
        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        const rows = await waitForRows(publicPanel, testCase.row);

        // Look at the row - it should already be in view.
        const row = rows[testCase.row - 1];
        await row.scrollIntoView();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(testCase.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of testCase.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, searches for a term, should find an expected row', async () => {
        await login();
        const testCase = testCases.TEST_CASE3;
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();

        // Select search input and input a search term
        const searchInput = await publicPanel.$('[data-test-id="search-input"]');
        await browser.waitUntil(() => {
            return searchInput.isClickable();
        });
        await searchInput.click();
        await sendString(testCase.searchFor);
        await browser.keys('Enter');

        const foundCount = await publicPanel.$('[data-test-id="found-count"]');
        expect(foundCount).toHaveText(testCase.foundCount);

        // get rows
        // When using roles, we sometimes need to be very specific in our queries.
        // Maybe roles are not suitable for integration tests, then.
        const rows = await waitForRows(publicPanel, testCase.row);

        expect(rows.length).toBeGreaterThanOrEqual(testCase.row);

        // Look at the row - it should already be in view.
        const row = rows[testCase.row - 1];
        await row.scrollIntoView();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(testCase.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of testCase.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, searches for a term which should not be found', async () => {
        await login();
        const testCase = testCases.TEST_CASE4;
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();

        // Select search input and input a search term
        const searchInput = await publicPanel.$('[data-test-id="search-input"]');
        await browser.waitUntil(() => {
            return searchInput.isClickable();
        });
        await searchInput.click();
        await sendString(testCase.searchFor);
        await browser.keys('Enter');

        await browser.waitUntil(async () => {
            const foundCountElement = await publicPanel.$('[data-test-id="found-count"]');
            
            if (await foundCountElement.isDisplayed()) {
                const text = await foundCountElement.getText();
                return text === testCase.foundCount;
            } else {
                return false;
            }
        });
        
        const foundCount = await publicPanel.$('[data-test-id="found-count"]');
        expect(foundCount).toHaveText(testCase.foundCount);
    });

    it('opens the public data search tab, should show default results, scroll to desired row', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        await openNarrative(testCase.narrativeId);

        // Open the data slideout
        const publicPanel = await openPublicData();

        // get rows
        // When using roles, we sometimes need to be very specific in our queries.
        // Maybe roles are not suitable for integration tests, then.
        for (const scrollRow of testCase.scrolls) {
            const rowElements = await waitForRows(publicPanel, scrollRow);
            const rowElement = rowElements[scrollRow - 1];
            await rowElement.scrollIntoView();
        }

        // ensure we have all of the rows.
        const rows = await waitForRows(publicPanel, testCase.row);
        const row = rows[testCase.row - 1];
        await row.scrollIntoView();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(testCase.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of testCase.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });
});
