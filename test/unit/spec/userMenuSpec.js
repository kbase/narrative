/* global describe, it, expect, jasmine, beforeEach, afterEach */

define([
    'jquery',
    'userMenu',
    'narrativeConfig',
    'narrativeMocks'
], ($, UserMenu, Config, Mocks) => {
    'use strict';

    const TEST_TOKEN = 'fake_token',
        TEST_USER = 'test_user',
        TEST_NAME = 'Test User',
        TEST_EMAIL = 'test_user@kbase.us';

    function makeTestUserMenu($elem) {
        return UserMenu.make({
            target: $elem,
            token: TEST_TOKEN,
            userName: TEST_USER,
            email: TEST_EMAIL,
            displayName: TEST_NAME
        });
    }

    describe('Test the UserMenu module', () => {
        beforeEach(() => {
            jasmine.Ajax.install();
            Mocks.mockJsonRpc1Call({
                url: Config.url('user_profile'),
                response: [{
                    profile: {
                        userdata: {
                            gravatarDefault: 'identicon'
                        }
                    }
                }]
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should make a user menu object with expected elements', () => {
            expect(UserMenu).toBeDefined();
            expect(UserMenu.make).toBeDefined();
            const $elem = $('<div>');
            const userMenu = makeTestUserMenu($elem);
            ['start', 'render', 'logout'].forEach(fn => {
                expect(userMenu[fn]).toBeDefined();
            });
        });

        it('Should start and create a menu in the target node with an empty user profile', () => {
            const $elem = $('<div>');
            const userMenu = makeTestUserMenu($elem);
            return userMenu.start()
                .then(() => {
                    expect($elem.find('.login-button-avatar')).toBeDefined();
                    const $profileItem = $elem.find('[data-menu-item="userlabel"]');
                    expect($profileItem).toBeDefined();
                    expect($profileItem.attr('href')).toEqual(`/#people/${TEST_USER}`);
                    expect($profileItem.text()).toContain(TEST_NAME);
                    expect($profileItem.text()).toContain(TEST_USER);
                });
        });

        it('Should trigger a logout popup when clicking the logout button', () => {
            const $elem = $('<div>');
            const userMenu = makeTestUserMenu($elem);
            return userMenu.start()
                .then(() => {
                    expect(document.querySelector('.modal [data-element="signout-warning-body"]')).toBeNull();
                    jasmine.clock().install();
                    // click the signout button
                    $elem.find('#signout-button').click();
                    jasmine.clock().tick(2000);
                    // expect to see the modal appear now
                    expect(document.querySelector('.modal [data-element="signout-warning-body"]')).not.toBeNull();
                    // click the cancel button (it has the default button style)
                    document.querySelector('a[data-element="cancel-signout"]').click();
                    jasmine.clock().tick(2000);
                    // expect the modal to go away
                    expect(document.querySelector('.modal [data-element="signout-warning-body"]')).toBeNull();
                    jasmine.clock().uninstall();
                });
        });
    });
});
