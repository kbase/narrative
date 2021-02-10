/*global describe, it, browser, expect, $, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative} = require('../wdioUtils.js');

const notebook = async ()=> {
    const nb = await $('#notebook-container');
    await nb.waitForExist();
    return nb;
};
const cells = async ()=> (await notebook()).$$('.cell');
const sampleSetViewerCell = async ()=> (await cells())[1];
const tabButtons = async ()=> (await sampleSetViewerCell()).$$('.nav-tabs li');
const tabPanes = async ()=> (await sampleSetViewerCell()).$$('.tab-content .tab-pane');
const changePane = async (paneIndex)=>{
    const tabeButton = (await tabButtons())[paneIndex];
    await tabeButton.waitForExist();
    await tabeButton.click();
    const tabPane = (await tabPanes())[paneIndex];
    await tabPane.waitForExist();
    await tabPane.waitForDisplayed();
    const tabSpinner = await tabPane.$('.fa-spinner');
    await tabSpinner.waitForDisplayed({reverse:true});
    return tabPane;
};


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

        const cellsBefore = await cells();
        expect(cellsBefore.length).toBe(2);

        // Find and click data entry
        const sidePanel = await $('#kb-side-panel');
        const [dataPanel] = await sidePanel.$$('.kb-narr-side-panel');
        const dataItem = await dataPanel.$('.kb-data-list-name*=SampleMetaData');
        await dataItem.click();

        // Expect cell to be added
        const cellsAfter = await cells();
        expect(cellsAfter.length).toBe(3);

        // Expect cell to be added with the correct title
        const cellTitle = await (await cellsAfter[2].$('.title .title')).getText();
        const dataTitle = await dataItem.getText();
        expect(cellTitle).toBe(dataTitle);
    });

    it('SampleSetViewer summary should match number of rows in samples table', async () => {

        await (await sampleSetViewerCell()).scrollIntoView();

        // change to samples pane
        const samplesPane = await changePane(1);
        // Find displayed number of rows in the table
        const paginationSpan = await(await samplesPane.$('.col-md-6')).$('span');
        await paginationSpan.waitForExist();
        const pageText = await paginationSpan.getText();
        console.log('pageText', pageText);
        const {numRows} = pageText.match(/Showing \d+ to \d+ of (?<numRows>\d+)/).groups;

        // change back to summary pane
        const summaryPane = await changePane(0);
        // Find displayed number of samples in summary
        const numberHeader = await summaryPane.$('td*=Number');
        const numberVal = await numberHeader.nextElement();
        const sampleNum = await numberVal.getText();

        expect(sampleNum).toBe(numRows);
    });
});