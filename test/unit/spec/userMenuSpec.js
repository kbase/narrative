define([
    'jquery',
    'userMenu',
    'narrativeConfig',
    'narrativeMocks',
    'util/bootstrapDialog',
    'testUtil',
], ($, UserMenu, Config, Mocks, BootstrapDialog, TestUtil) => {
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
            displayName: TEST_NAME,
        });
    }

    describe('Test the UserMenu module', () => {
        beforeEach(() => {
            jasmine.Ajax.install();
            Mocks.mockJsonRpc1Call({
                url: Config.url('user_profile'),
                response: [
                    {
                        profile: {
                            userdata: {
                                gravatarDefault: 'identicon',
                            },
                        },
                    },
                ],
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
            ['start', 'render', 'logout'].forEach((fn) => {
                expect(userMenu[fn]).toBeDefined();
            });
        });

        it('Should start and create a menu in the target node with an empty user profile', () => {
            const $elem = $('<div>');
            const userMenu = makeTestUserMenu($elem);
            return userMenu.start().then(() => {
                expect($elem.find('.login-button-avatar')).toBeDefined();
                const $profileItem = $elem.find('[data-menu-item="userlabel"]');
                expect($profileItem).toBeDefined();
                expect($profileItem.attr('href')).toEqual(`/#people/${TEST_USER}`);
                expect($profileItem.text()).toContain(TEST_NAME);
                expect($profileItem.text()).toContain(TEST_USER);
            });
        });

        // logout popups
        const logoutTests = [
            {
                desc: 'simulate cancelling signout',
                button: 'a[data-element="cancel-signout"]',
                // there should be no 'logout.kbase' event
                finalTest: (callArgs) => {
                    return callArgs.every((args) => {
                        return typeof args[0] !== 'string' || args[0] !== 'logout.kbase';
                    });
                },
            },
            {
                desc: 'simulate signout',
                button: 'a[data-element="signout"]',
                // the 'logout.kbase' event should have been triggered
                finalTest: (callArgs) => {
                    return callArgs.some((args) => {
                        return (
                            typeof args[0] === 'string' &&
                            args[0] === 'logout.kbase' &&
                            args[1] === true
                        );
                    });
                },
            },
        ];

        logoutTests.forEach((test) => {
            it(`should ${test.desc} when clicking logout and then the modal button`, () => {
                const $elem = $('<div>');
                const userMenu = makeTestUserMenu($elem);
                const modalQuerySelector = '.modal [data-element="signout-warning-body"]';

                spyOn(BootstrapDialog.prototype, 'show').and.callThrough();
                spyOn(BootstrapDialog.prototype, 'hide').and.callThrough();
                spyOn(BootstrapDialog.prototype, 'destroy').and.callThrough();
                spyOn($.fn, 'trigger').and.callThrough();

                return userMenu
                    .start()
                    .then(() => {
                        expect(document.querySelector(modalQuerySelector)).toBeNull();

                        // click the signout button
                        $elem.find('#signout-button').click();
                        expect(BootstrapDialog.prototype.show).toHaveBeenCalled();
                        expect(BootstrapDialog.prototype.hide).not.toHaveBeenCalled();
                        expect(BootstrapDialog.prototype.destroy).not.toHaveBeenCalled();
                        return TestUtil.waitForElement(document.body, modalQuerySelector);
                    })
                    .then(() => {
                        // expect to see the modal appear now
                        expect(document.querySelector(modalQuerySelector)).not.toBeNull();

                        // click the appropriate button for this test
                        document.querySelector(test.button).click();
                        expect(BootstrapDialog.prototype.hide).toHaveBeenCalled();

                        // .modal should have style display: none
                        return TestUtil.waitForElementState(document.body, () => {
                            return document.querySelector('.modal').style.display === 'none';
                        });
                    })
                    .then(() => {
                        // wait for the modal to be removed
                        return TestUtil.waitForElementState(document.body, () => {
                            return document.querySelectorAll('.modal').length === 0;
                        });
                    })
                    .then(() => {
                        expect(BootstrapDialog.prototype.destroy).toHaveBeenCalled();
                        // expect the modal to go away
                        expect(document.querySelector(modalQuerySelector)).toBeNull();

                        // get all the args from every call to $.fn.trigger
                        const callArgs = $.fn.trigger.calls.allArgs();
                        // check through the args to ensure that the test condition was matched
                        expect(test.finalTest(callArgs)).toBeTrue();
                    });
            });
        });
    });
});
