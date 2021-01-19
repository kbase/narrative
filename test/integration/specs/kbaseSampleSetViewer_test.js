/*global describe, it, browser, expect, $, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative} = require('../wdioUtils.js');

describe('Test kbaseNarrativeSidePublicTab', () => {
    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
        await login();
        await openNarrative(58574);
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('SampleSetViewer should be added when clicked in data toolbar', async () => {
        const notebook = await $('#notebook-container');
        await notebook.waitForExist();

        const cellsBefore = await notebook.$$('.cell');
        expect(cellsBefore.length).toBe(2);

        // Find and click data entry
        const sidePanel = await $('#kb-side-panel');
        const [dataPanel] = await sidePanel.$$('.kb-narr-side-panel');
        const dataItem = await dataPanel.$('.kb-data-list-name*=SampleMetaData');
        await dataItem.click();

        // Expect cell to be added
        const cellsAfter = await notebook.$$('.cell');
        expect(cellsAfter.length).toBe(3);

        // Expect cell to be added with the correct title
        const cellTitle = await (await cellsAfter[2].$('.title .title')).getText();
        const dataTitle = await dataItem.getText();
        expect(cellTitle).toBe(dataTitle);
    });

    it('SampleSetViewer summary should match number of rows in samples table', async () => {

        const notebook = await $('#notebook-container');
        await notebook.waitForExist();
        const cells = await notebook.$$('.cell');

        const sampleSetViewerCell = cells[1];
        await sampleSetViewerCell.scrollIntoView();

        // select important elements
        const [summaryButton, samplesButton] = await sampleSetViewerCell.$$('.nav-tabs li');
        const [summaryPane, samplesPane] = await sampleSetViewerCell.$$('.tab-content .tab-pane');

        // change to samples pane
        await samplesButton.click();
        await samplesPane.waitForDisplayed();
        const samplesSpinner = await samplesPane.$('.fa-spinner');
        await samplesSpinner.waitForDisplayed({reverse:true});

        // Find displayed number of rows in the table
        const paginationSpan = await samplesPane.$('span*=Showing');
        const pageText = await paginationSpan.getText();
        const {numRows} = pageText.match(/Showing \d+ to \d+ of (?<numRows>\d+)/).groups;

        // change back to summary pane
        await summaryButton.click();
        await summaryPane.waitForDisplayed();
        const summarySpinner = await summaryPane.$('.fa-spinner');
        await summarySpinner.waitForDisplayed({reverse:true});

        // Find displayed number of samples in summary
        const numberHeader = await summaryPane.$('td*=Number');
        const numberVal = await numberHeader.nextElement();
        const sampleNum = await numberVal.getText();

        expect(sampleNum).toBe(numRows);
    });
});