/* global browser, $ */
const { login } = require('../wdioUtils.js');
const TIMEOUT = 30000;
const env = process.env.ENV || 'ci';
const testData = require('./narrative_basic_data.json');
const testCases = testData.envs[env];
const AUTH_COOKIE = 'kbase_session';
const AUTH_BACKUP_COOKIE = 'kbase_session_backup';

describe('Auth cookie tests', () => {
    beforeEach(async () => {
        await browser.setTimeout({ pageLoad: TIMEOUT });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens a narrative and has a backup cookie, if expected by the env', async () => {
        await browser.url(`/narrative/${testCases.CASE_1.narrativeId}`);
        const loadingBlocker = await $('#kb-loading-blocker');
        await loadingBlocker.waitForDisplayed({
            timeout: TIMEOUT,
            timeoutMsg: `Timeout after waiting ${TIMEOUT}ms for loading blocker to appear`,
        });

        // And then the loading blocker should disappear!
        await loadingBlocker.waitForDisplayed({
            timeout: TIMEOUT,
            timeoutMsg: `Timeout after waiting ${TIMEOUT}ms for loading blocker to disappear`,
            reverse: true,
        });

        const KBASE_ENV = browser.options.testParams.ENV;
        const cookies = await browser.getCookies();
        const expectedNames = [AUTH_COOKIE, AUTH_BACKUP_COOKIE];
        const authCookies = cookies.reduce((cookies, cookie) => {
            if (expectedNames.includes(cookie.name)) {
                cookies[cookie.name] = cookie;
            }
            return cookies;
        }, {});
        if (KBASE_ENV === 'narrative') {
            expect(authCookies.length).toBe(2);
            expectedNames.forEach((cookieName) => {
                expect(cookieName in authCookies).toBeTruthy();
            });
            expect(authCookies[AUTH_COOKIE].value).toEqual(authCookies[AUTH_BACKUP_COOKIE].value);
        } else {
            expect(Object.keys(authCookies).length).toBe(1);
            expect(AUTH_COOKIE in authCookies).toBeTruthy();
            expect(AUTH_BACKUP_COOKIE in authCookies).toBeFalsy();
        }
    });
});
