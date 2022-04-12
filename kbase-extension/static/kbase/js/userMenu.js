define([
    'jquery',
    'narrativeConfig',
    'kb_service/client/userProfile',
    'kb_common/gravatar',
    'common/html',
    'util/bootstrapDialog',
    'util/string',
], ($, NarrativeConfig, UserProfile, Gravatar, html, BootstrapDialog, StringUtil) => {
    'use strict';

    function factory(config) {
        const target = config.target,
            email = config.email,
            userName = StringUtil.escape(config.userName),
            displayName = StringUtil.escape(config.displayName),
            token = config.token,
            gravatar = Gravatar.make(),
            button = html.tag('button'),
            div = html.tag('div'),
            a = html.tag('a'),
            span = html.tag('span'),
            ul = html.tag('ul'),
            li = html.tag('li'),
            img = html.tag('img'),
            profileClient = new UserProfile(NarrativeConfig.url('user_profile'), { token: token }),
            cssBaseClass = 'kb-user-menu';
        let gravatarDefault = 'identicon';

        function start() {
            return profileClient
                .get_user_profile([userName])
                .then((profile) => {
                    if (
                        profile.length &&
                        profile[0] &&
                        profile[0].profile &&
                        profile[0].profile.userdata &&
                        profile[0].profile.userdata.gravatarDefault
                    ) {
                        gravatarDefault = profile[0].profile.userdata.gravatarDefault;
                    }
                })
                .finally(() => {
                    return render();
                });
        }

        function renderAvatar() {
            return img({
                src: gravatar.makeGravatarUrl(email, 100, 'pg', gravatarDefault),
                class: `login-button-avatar ${cssBaseClass}__icon--gravatar`,
                'data-element': 'avatar',
            });
        }

        function render() {
            const menu = div(
                {
                    class: `dropdown ${cssBaseClass}__menu`,
                },
                [
                    button(
                        {
                            type: 'button',
                            class: 'btn btn-default dropdown-toggle',
                            'data-toggle': 'dropdown',
                            'aria-expanded': 'false',
                        },
                        [
                            renderAvatar(),
                            span({
                                class: `caret ${cssBaseClass}__menu_caret`,
                            }),
                        ]
                    ),
                    ul({ class: 'dropdown-menu', role: 'menu' }, [
                        li({}, [
                            a(
                                {
                                    href: '/#people/' + userName,
                                    target: '_blank',
                                    'data-menu-item': 'userlabel',
                                },
                                [
                                    div(
                                        {
                                            class: `${cssBaseClass}__block--user-icon`,
                                        },
                                        [
                                            span({
                                                class: `fa fa-user ${cssBaseClass}__icon--user`,
                                            }),
                                        ]
                                    ),
                                    div(
                                        {
                                            class: `${cssBaseClass}__block--name`,
                                            'data-element': 'user-label',
                                        },
                                        [
                                            span(
                                                {
                                                    class: `${cssBaseClass}__block--userName`,
                                                    'data-element': 'realname',
                                                },
                                                displayName
                                            ),
                                            span(
                                                {
                                                    class: `${cssBaseClass}__block--displayName`,
                                                    'data-element': 'username',
                                                },
                                                userName
                                            ),
                                        ]
                                    ),
                                ]
                            ),
                        ]),
                        li({ class: 'divider' }),
                        li({}, [
                            a({ href: '#', 'data-menu-item': 'logout', id: 'signout-button' }, [
                                div(
                                    {
                                        class: `${cssBaseClass}__block--signout-icon`,
                                    },
                                    [
                                        span({
                                            class: `fa fa-sign-out ${cssBaseClass}__icon--signout`,
                                        }),
                                    ]
                                ),
                                'Sign Out',
                            ]),
                        ]),
                    ]),
                ]
            );
            target.append(menu);
            target.find('#signout-button').click(logout);
        }

        function logout() {
            const logoutBtn = $(
                a(
                    {
                        type: 'button',
                        class: 'btn btn-primary',
                        dataElement: 'signout',
                    },
                    ['Sign Out']
                )
            ).click(() => {
                dialog.hide();
                $(document).trigger('logout.kbase', true);
            });
            const cancelBtn = $(
                a(
                    {
                        type: 'button',
                        class: 'btn btn-default',
                        dataElement: 'cancel-signout',
                    },
                    ['Cancel']
                )
            ).click(() => {
                dialog.hide();
            });
            const dialog = new BootstrapDialog({
                title: 'Sign Out?',
                body: div(
                    { dataElement: 'signout-warning-body' },
                    'Sign out of KBase? This will end your session. Any unsaved changes in any open Narrative will be lost.'
                ),
                buttons: [cancelBtn, logoutBtn],
            });
            dialog.onHidden(() => dialog.destroy());
            dialog.show();
        }

        return {
            render,
            logout,
            start,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
