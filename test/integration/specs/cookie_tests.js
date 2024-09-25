/* global browser, $ */
const { login } = require('../wdioUtils.js');
const TIMEOUT = 30000;
const env = process.env.ENV || 'ci';
const testData = require('./narrative_basic_data.json');
const testCases = testData.envs[env];
const AUTH_COOKIE = 'kbase_session';
const AUTH_BACKUP_COOKIE = 'kbase_session_backup';

describe('Narrative tree page with login', () => {
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
        if (KBASE_ENV === 'narrative') {
            expect(cookies.length).toBe(2);
            const cookieNames = cookies.reduce((cookie, names) => {
                names[cookie.name] = cookie.value;
                return names;
            });
            [AUTH_COOKIE, AUTH_BACKUP_COOKIE].forEach((cookieName) => {
                expect(cookieName in cookieNames).toBeTruthy();
            });
            expect(cookieNames[AUTH_COOKIE]).toEqual(cookieNames[AUTH_BACKUP_COOKIE]);
        } else {
            expect(cookies.length).toBe(1);
            expect(cookies[0].name).toBe(AUTH_COOKIE);
        }
    });
});
