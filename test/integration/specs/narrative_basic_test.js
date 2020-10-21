/*global describe, it, browser, expect, $, afterEach, beforeEach*/
const Utils = require('../wdioUtils');

describe('Narrative tree page with login', () => {
    'use strict';


    // // async version
    // it('should open the narrative tree page', async () => {
    //     await browser.url('/narrative/tree');
    //     await expect(browser).toHaveTitle('KBase Narrative');
    // });

    // // sync version
    // it('sets the user token', () => {
    //     browser.url('/narrative/tree');
    //     $('.form-control').setValue(userToken);

    //     // find an anchor element with text = OK and click on it
    //     $('=OK').click();
    //     expect(browser.getCookies(['kbase_session'])[0].value).toBe(userToken);
    // });

    it('opens a narrative', async () => {
        await Utils.login();
        // await browser.url('/narrative/tree');
        // await browser.setCookies({name: 'kbase_session', value: userToken, path: '/'});
        // expect(browser.getCookies(['kbase_session'])[0].value).toBe(userToken);
        await browser.url(Utils.makeURL('narrative/31932'));
        // $('.form-control').setValue(userToken);
        // $('=OK').click();
        // expect(browser.getCookies(['kbase_session'])[0].value).toBe(TOKEN);
        // browser.pause(1000);
        // $('span*=ProkkaTest').click();
        // browser.switchWindow('/narrative/notebooks/ws.31932.obj.1');
        const loadingBlocker = await $('#kb-loading-blocker');
        const loadingText = await loadingBlocker.getText();
        expect(loadingText).toContain('Connecting to KBase services...');
    });
});
