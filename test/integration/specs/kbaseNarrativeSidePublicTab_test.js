'use strict';

const { login, openNarrative, sendString, clickWhenReady } = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Also note that refseq test data can be volatile during data loads. narrative-dev data is
// from prod, so should be stable for long periods of time. CI data can be volatile, but in
// practice rarely changes. Both are most volatile during refseq data updates, which may
// be every year or two.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.

const ROWS_PER_SCROLL_PAGE = 20;

const allTestCases = {
    ci: {
        TEST_CASE_1: {
            narrativeId: 53983,
            row: 4,
            name: 'Abiotrophia defectiva ATCC 49176',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Firmicutes > Bacilli > Lactobacillales > Aerococcaceae > Abiotrophia > Abiotrophia defectiva',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_000160075.2',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_KI535340',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '4',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,848',
                },
            ],
        },
        TEST_CASE_2: {
            narrativeId: 53983,
            row: 1,
            name: "'Chrysanthemum coronarium' phytoplasma",
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Tenericutes > Mollicutes > Acholeplasmatales > Acholeplasmataceae > Candidatus Phytoplasma > Candidatus Phytoplasma asteris',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_000744065.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_BBIY01000170',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '170',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '839',
                },
            ],
        },
        TEST_CASE_3: {
            narrativeId: 53983,
            row: 1,
            searchFor: 'prochlorococcus',
            foundCount: '69',
            totalCount: '109,613',
            name: 'Prochlorococcus marinus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Prochloraceae > Prochlorococcus',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001180245.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CVSV01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '136',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,616',
                },
            ],
        },
        TEST_CASE_4: {
            narrativeId: 53983,
            searchFor: 'foobar',
            foundCount: 'None',
            totalCount: '109,613',
        },
        TEST_CASE_5: {
            narrativeId: 53983,
            row: 30,
            searchFor: 'coli',
            foundCount: '13,181',
            totalCount: '109,613',
            name: 'Campylobacter coli',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > delta/epsilon subdivisions > Epsilonproteobacteria > Campylobacterales > Campylobacteraceae > Campylobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001233705.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CUOB01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '27',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,767',
                },
            ],
        },
        TEST_CASE_6: {
            narrativeId: 53983,
            row: 30,
            searchFor: 'Campylobacter coli',
            foundCount: '950',
            totalCount: '109,613',
            name: 'Campylobacter coli',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > delta/epsilon subdivisions > Epsilonproteobacteria > Campylobacterales > Campylobacteraceae > Campylobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001233705.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CUOB01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '27',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '1,767',
                },
            ],
        },
        TEST_CASE_7: {
            narrativeId: 53983,
            searchFor: 'Acetobacter pasteurianus',
            foundCount: '29',
            totalCount: '109,613',
            row: 2,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093',
                },
            ],
        },
        TEST_CASE_8: {
            narrativeId: 53983,
            searchFor: 'GCF_001662905.1',
            foundCount: '1',
            totalCount: '109,613',
            row: 1,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093',
                },
            ],
        },
        TEST_CASE_9: {
            narrativeId: 53983,
            searchFor: 'NZ_LYUD01000001',
            foundCount: '1',
            totalCount: '109,613',
            row: 1,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093',
                },
            ],
        },
        TEST_CASE_10: {
            narrativeId: 53983,
            searchFor: 'Synechococcales',
            foundCount: '164',
            totalCount: '109,613',
            row: 3,
            name: 'Acaryochloris sp. RCC1774',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Acaryochloridaceae > Acaryochloris',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_003231495.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_PQWO01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '72',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '5,523',
                },
            ],
        },
    },
    'narrative-dev': {
        TEST_CASE_1: {
            narrativeId: 78050,
            row: 3,
            name: "'Cynodon dactylon' phytoplasma",
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Tenericutes > Mollicutes > Acholeplasmatales > Acholeplasmataceae > Candidatus Phytoplasma > unclassified phytoplasmas',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_009268075.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_VWOH01000010',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '21',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '442',
                },
            ],
        },
        TEST_CASE_2: {
            narrativeId: 78050,
            row: 23,
            name: 'Absicoccus porci',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Firmicutes > Erysipelotrichia > Erysipelotrichales > Erysipelotrichaceae > unclassified Erysipelotrichaceae > unclassified Erysipelotrichaceae (miscellaneous)',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_003725415.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_RJQC01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '13',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,267',
                },
            ],
        },
        TEST_CASE_3: {
            narrativeId: 78050,
            row: 3,
            searchFor: 'prochlorococcus',
            foundCount: '111',
            totalCount: '234,255',
            name: 'Cyanobacteria bacterium 150SLHB',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Prochloraceae > Prochlorococcus > unclassified Prochlorococcus',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_012933605.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JABBYR010000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '106',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,469',
                },
            ],
        },
        TEST_CASE_4: {
            narrativeId: 78050,
            searchFor: 'foobar',
            foundCount: 'None',
            totalCount: '234,255',
        },
        TEST_CASE_5: {
            narrativeId: 78050,
            row: 3,
            searchFor: 'orientalis',
            foundCount: '100',
            totalCount: '234,255',
            name: 'Acetobacter orientalis',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_002153735.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JOPK01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '122',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,596',
                },
            ],
        },
        TEST_CASE_6: {
            narrativeId: 78050,
            row: 3,
            searchFor: 'Acetobacter orientalis',
            foundCount: '6',
            totalCount: '234,255',
            name: 'Acetobacter orientalis',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_002153735.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_JOPK01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '122',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,596',
                },
            ],
        },
        TEST_CASE_7: {
            narrativeId: 78050,
            searchFor: 'Acetobacter pasteurianus',
            foundCount: '30',
            totalCount: '234,255',
            row: 1,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001183745.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_CP012111',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '1',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '2,604',
                },
            ],
        },
        TEST_CASE_8: {
            narrativeId: 78050,
            searchFor: 'GCF_001662905.1',
            foundCount: '1',
            totalCount: '234,255',
            row: 1,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093',
                },
            ],
        },
        TEST_CASE_9: {
            narrativeId: 78050,
            searchFor: 'NZ_LYUD01000001',
            foundCount: '1',
            totalCount: '234,255',
            row: 1,
            name: 'Acetobacter pasteurianus',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Proteobacteria > Alphaproteobacteria > Rhodospirillales > Acetobacteraceae > Acetobacter',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_001662905.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_LYUD01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '184',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '3,093',
                },
            ],
        },
        TEST_CASE_10: {
            narrativeId: 78050,
            searchFor: 'Synechococcales',
            foundCount: '385',
            totalCount: '234,255',
            row: 3,
            name: 'Acaryochloris sp. RCC1774',
            metadata: [
                {
                    id: 'lineage',
                    label: 'Lineage',
                    value:
                        'Bacteria > Terrabacteria group > Cyanobacteria/Melainabacteria group > Cyanobacteria > Synechococcales > Acaryochloridaceae > Acaryochloris > unclassified Acaryochloris',
                },
                {
                    id: 'kbase_id',
                    label: 'KBase ID',
                    value: 'GCF_003231495.1',
                },
                {
                    id: 'refseq_id',
                    label: 'RefSeq ID',
                    value: 'NZ_PQWO01000001',
                },
                {
                    id: 'contigs',
                    label: 'Contigs',
                    value: '72',
                },
                {
                    id: 'features',
                    label: 'Features',
                    value: '5,519',
                },
            ],
        },
    },
};

const testCases = allTestCases[browser.config.testParams.ENV];

async function testField({ container, id, label, value }) {
    const lineageLabel = await container.$(
        `[role="row"][data-test-id="${id}"] [data-test-id="label"]`
    );
    await expect(lineageLabel).toHaveText(label);
    const lineageValue = await container.$(
        `[role="row"][data-test-id="${id}"] [data-test-id="value"]`
    );
    await expect(lineageValue).toHaveText(value);
}

async function waitForRows(panel, count) {
    await browser.waitUntil(async () => {
        const rows = await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
        return rows.length >= count;
    });
    return panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
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
    await expect(rows.length).toEqual(20);
    return publicPanel;
}

async function doSearch(publicPanel, testCase) {
    const searchInput = await publicPanel.$('[data-test-id="search-input"]');
    await clickWhenReady(searchInput);
    await sendString(testCase.searchFor);
    await browser.keys('Enter');

    const foundCount = await publicPanel.$('[data-test-id="found-count"]');
    await expect(foundCount).toHaveText(testCase.foundCount);

    const totalCount = await publicPanel.$('[data-test-id="total-count"]');
    await expect(totalCount).toHaveText(testCase.totalCount);
}

async function validateResultRow(row, testCase) {
    const nameCell = await row.$('[role="cell"][data-test-id="name"]');
    await expect(nameCell).toHaveText(testCase.name);
    await Promise.all(
        testCase.metadata.map(({ id, label, value }) => {
            return testField({
                container: row,
                id,
                label,
                value,
            });
        })
    );
}

async function getRow(publicPanel, testCase) {
    const rows = await waitForRows(publicPanel, testCase.row);
    await expect(rows.length).toBeGreaterThanOrEqual(testCase.row);
    const row = rows[testCase.row - 1];
    await expect(row).toBeDefined();
    return row;
}

async function doScrolls(publicPanel, scrolls) {
    for (let i = 1; i <= scrolls; i += 1) {
        const scrollRow = ROWS_PER_SCROLL_PAGE * i;
        const rowElements = await waitForRows(publicPanel, scrollRow);
        const rowElement = rowElements[scrollRow - 1];
        await rowElement.scrollIntoView();
    }
}

async function scrollToRow(publicPanel, testCase) {
    const scrolls = Math.floor(testCase.row / ROWS_PER_SCROLL_PAGE);
    await doScrolls(publicPanel, scrolls);
    const row = await getRow(publicPanel, testCase);
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
    await expect(foundCount).toHaveText(testCase.foundCount);
}

async function simpleSearchTest(testCase) {
    await login();
    await openNarrative(testCase.narrativeId);

    const publicPanel = await openPublicData();
    await doSearch(publicPanel, testCase);
    await validateFoundCount(publicPanel, testCase);
    const row = await scrollToRow(publicPanel, testCase);
    await validateResultRow(row, testCase);
}

describe('Test kbaseNarrativeSidePublicTab', () => {
    before(() => {
        require('expect-webdriverio').setOptions({ wait: 5000 });
    });
    beforeEach(async () => {
        await browser.setTimeout({ implicit: 30000 });
        await browser.reloadSession();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens the public data search tab, should show default results, desired row is in the first scroll page', async () => {
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

    it('opens the public data search tab, search for species part of scientific name', async () => {
        await simpleSearchTest(testCases.TEST_CASE_5);
    });

    it('opens the public data search tab, search for binomial form for the above species', async () => {
        await simpleSearchTest(testCases.TEST_CASE_6);
    });

    it('opens the public data search tab, searches for a binomial scientific name for a different species', async () => {
        await simpleSearchTest(testCases.TEST_CASE_7);
    });

    it('opens the public data search tab, searches for a kbase_id (aka RefSeq assembly accession)', async () => {
        await simpleSearchTest(testCases.TEST_CASE_8);
    });

    it('opens the public data search tab, searches for a source_id (aka NCBI project accession)', async () => {
        await simpleSearchTest(testCases.TEST_CASE_9);
    });

    it('opens the public data search tab, searches for an order, "Synechococcales"', async () => {
        await simpleSearchTest(testCases.TEST_CASE_10);
    });
});
