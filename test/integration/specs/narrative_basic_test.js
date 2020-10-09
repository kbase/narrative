/*global describe, it, browser, expect, $, afterEach*/
describe('Narrative tree page with login', () => {
    'use strict';
    const userToken = browser.config.kbaseToken;

    afterEach(() => {
        browser.deleteCookies();
    });

    // async version
    it('should open the narrative tree page', async () => {
        await browser.url('http://localhost:8888/narrative/tree');
        await expect(browser).toHaveTitle('KBase Narrative');
    });

    // sync version
    it('sets the user token', () => {
        browser.url('http://localhost:8888/narrative/tree');
        $('.form-control').setValue(userToken);

        // find an anchor element with text = OK and click on it
        $('=OK').click();
        expect(browser.getCookies(['kbase_session'])[0].value).toBe(userToken);
    });

    it('opens a narrative', () => {
        browser.url('http://localhost:8888/narrative/tree');
        $('.form-control').setValue(userToken);
        $('=OK').click();
        browser.pause(1000);
        $('span*=ProkkaTest').click();
        browser.switchWindow('http://localhost:8888/narrative/notebooks/ws.31932.obj.1');
        expect($('nav[id="header"]').isDisplayed()).toBeTruthy();
    });
});
