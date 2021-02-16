/*global browser, $ */
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative, sendString, clickWhenReady} = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Also note that refseq test data can be volatile during data loads. narrative-dev data is
// from prod, so should be stable for long periods of time. CI data can be volatile, but in 
// practice rarely changes. Both are most volatile during refseq data updates, which may 
// be every year or two.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.
const allTestCases = {
    ci: {
        TEST_CASE_1: {
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
        TEST_CASE_2: {
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
        TEST_CASE_3: {
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
        TEST_CASE_4: {
            narrativeId: 53983,
            searchFor: 'foobar',
            foundCount: 'None'
        },
        TEST_CASE_5: {
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
        },
        TEST_CASE_6: {
            narrativeId: 53983,
            row: 30,
            scrollTo: true,
            scrolls: [
                20
            ],
            searchFor: 'coli',
            foundCount: '2,317',
            name: 'Escherichia coli',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: '	Bacteria > Proteobacteria > Gammaproteobacteria > Enterobacterales > Enterobacteriaceae > Escherichia'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_000752615.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CCVR01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '447'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '5,847'
                }
            ]
        },
        TEST_CASE_7: {
            narrativeId: 53983,
            searchFor: 'Acetobacter pasteurianus',
            foundCount: '1',
            row: 1,
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093'
                }
            ]
        }
    },
    'narrative-dev':  {
        TEST_CASE_1: {
            narrativeId: 78050,
            row: 3,
            name: "'Massilia aquatica' Holochova et al. 2020",
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Betaproteobacteria > Burkholderiales > Oxalobacteraceae > Massilia'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_011682045.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_VVIW01000010'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '99'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '6,692'
                }
            ]
        },
        TEST_CASE_2: {
            narrativeId: 78050,
            row: 18,
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
        TEST_CASE_3: {
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
        TEST_CASE_4: {
            narrativeId: 78050,
            searchFor: 'foobar',
            foundCount: 'None'
        },
        TEST_CASE_5: {
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
        },
        TEST_CASE_6: {
            narrativeId: 78050,
            row: 30,
            scrollTo: true,
            scrolls: [
                20
            ],
            searchFor: 'orientalis',
            foundCount: '',
            name: 'Francisella orientalis',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Gammaproteobacteria > Thiotrichales > Francisellaceae > Francisella > Francisella noatunensis'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_016600715.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JACVJP010000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '60'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,864'
                }
            ]
        },
        TEST_CASE_7: {
            narrativeId: 78050,
            searchFor: 'Acetobacter pasteurianus',
            foundCount: '19',
            row: 1,
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value: 'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter'
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1'
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001'
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184'
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093'
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

async function waitForRows(panel, count) {
    await browser.waitUntil(async () => {
        const rows = await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
        return rows.length >= count;
    });
    return await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
}

async function openPublicData() {
    // Open the data slide-out
    const button = await $('[data-test-id="data-slideout-button"]');
    await button.waitForExist();
    await clickWhenReady(button);
    const panel = await $('[data-test-id="data-slideout-panel"]');
    await panel.waitForExist();

    // Then click the public data tab.
    const publicTab = await panel.$('[role="tablist"] [data-test-id="tab-public"]');
    await publicTab.waitForExist();
    await clickWhenReady(publicTab);

    // Then wait for the associated panel to be displayed.
    const publicPanel = await panel.$('[data-test-id="panel-public"]');
    await publicPanel.waitForExist();

    // Finally, ensure the refseq public data table displayed.
    // Initially, the public data tab, if loaded with refseq data to any reasonable degree,
    // will have the initial page of 20 rows fully filled.
    const rows = await waitForRows(publicPanel, 20);
    expect(rows.length).toEqual(20);
    return publicPanel;
}

async function doSearch(publicPanel, testCase) {
    const searchInput = await publicPanel.$('[data-test-id="search-input"]');
    await clickWhenReady(searchInput);
    await sendString(testCase.searchFor);
    await browser.keys('Enter');

    const foundCount = await publicPanel.$('[data-test-id="found-count"]');
    expect(foundCount).toHaveText(testCase.foundCount);
}

async function doScrolling(publicPanel, testCase) {
     // get rows
    // When using roles, we sometimes need to be very specific in our queries.
    // Maybe roles are not suitable for integration tests, then.
    for (const scrollRow of testCase.scrolls) {
        const rowElements = await waitForRows(publicPanel, scrollRow);
        const rowElement = rowElements[scrollRow - 1];
        await rowElement.scrollIntoView();
    }
}

async function validateResultRow(row, testCase) {
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
}

async function getRow(publicPanel, testCase) {
    const rows = await waitForRows(publicPanel, testCase.row);
    expect(rows.length).toBeGreaterThanOrEqual(testCase.row);
    const row = rows[testCase.row - 1];
    expect(row).toBeDefined();
    return row;
}

async function scrollToRow(publicPanel, testCase) {
     const rows = await waitForRows(publicPanel, testCase.row);
     expect(rows.length).toBeGreaterThanOrEqual(testCase.row);
     const row = rows[testCase.row - 1];
     await row.scrollIntoView();
     return row;
}

async function validateFoundCount(publicPanel, testCase) {
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
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        const row = await getRow(publicPanel, testCase);
        await validateResultRow(row, testCase);
    });

    it('opens the public data search tab, should show default results, scroll to desired row', async () => {
        const testCase = testCases.TEST_CASE_2;
        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        const row = await scrollToRow(publicPanel, testCase);
        await validateResultRow(row, testCase);
    });

    it('opens the public data search tab, searches for a term, should find an expected row', async () => {
        const testCase = testCases.TEST_CASE_3;

        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        await doSearch(publicPanel, testCase);
        const row = await scrollToRow(publicPanel, testCase);
        await validateResultRow(row, testCase);
    });

    it('opens the public data search tab, searches for a term which should not be found', async () => {
        await login();
        const testCase = testCases.TEST_CASE_4;
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        await doSearch(publicPanel, testCase);
        await validateFoundCount(publicPanel, testCase);
    });

    it('opens the public data search tab, search for species part of scientific  name, scroll to desired row', async () => {
        const testCase = testCases.TEST_CASE_6;
        await login();
        await openNarrative(testCase.narrativeId);

        // Open the data slideout
        const publicPanel = await openPublicData();

        await doSearch(publicPanel, testCase);
        await validateFoundCount(publicPanel, testCase);
        await doScrolling(publicPanel, testCase);
        const row = await scrollToRow(publicPanel, testCase);
        await validateResultRow(row, testCase);
    });

    it('opens the public data search tab, searches for a binomial scientific name', async () => {
        const testCase = testCases.TEST_CASE_7;
        await login();
        await openNarrative(testCase.narrativeId);

        const publicPanel = await openPublicData();
        await doSearch(publicPanel, testCase);
        await validateFoundCount(publicPanel, testCase);
        const row = await scrollToRow(publicPanel, testCase);
        await validateResultRow(row, testCase);
    });
});
