/*global define,window*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'narrativeConfig',
    'kb_service/client/userProfile',
    'kb_common/gravatar',
    'kb_common/html',
    'util/bootstrapDialog',
    'util/string'
], function(
    $,
    NarrativeConfig,
    UserProfile,
    Gravatar,
    html,
    BootstrapDialog,
    StringUtil
) {
    'use strict';

    function factory(config) {
        var target = config.target,
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
            br = html.tag('br', {close: false}),
            i = html.tag('i'),
            img = html.tag('img'),
            profileClient = new UserProfile(NarrativeConfig.url('user_profile'), {token: token}),
            gravatarDefault = 'identicon';

        function start() {
            return profileClient.get_user_profile([userName])
                .then((profile) => {
                    if (profile.length &&
                        profile[0] &&
                        profile[0].profile &&
                        profile[0].profile.userdata &&
                        profile[0].profile.userdata.gravatarDefault) {
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
                style: 'width: 40px;',
                class: 'login-button-avatar',
                'data-element': 'avatar'
            });
        }

        function render() {
            const menu = div({class: 'dropdown', style: 'display:inline-block'}, [
                button({type: 'button', class: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown', 'aria-expanded': 'false'}, [
                    renderAvatar(),
                    span({class: 'caret', style: 'margin-left: 5px;'})
                ]),
                ul({class: 'dropdown-menu', role: 'menu'}, [
                    li({}, [
                        a({href: '/#people/' + userName, target: '_blank', 'data-menu-item': 'userlabel'}, [
                            div({style: 'display:inline-block; width: 34px; vertical-align: top;'}, [
                                span({class: 'fa fa-user', style: 'font-size: 150%; margin-right: 10px;'})
                            ]),
                            div({style: 'display: inline-block', 'data-element': 'user-label'}, [
                                displayName,
                                br(),
                                i({}, userName)
                            ])
                        ])
                    ]),
                    li({class: 'divider'}),
                    li({}, [
                        a({href: '#', 'data-menu-item': 'logout', id: 'signout-button'}, [
                            div({style: 'display: inline-block; width: 34px;'}, [
                                span({class: 'fa fa-sign-out', style: 'font-size: 150%; margin-right: 10px;'})
                            ]),
                            'Sign Out'
                        ])
                    ])
                ])
            ]);
            target.append(menu);
            target.find('#signout-button').click(logout);
        }

        function logout() {
            const logoutBtn = $(a({
                type: 'button',
                class: 'btn btn-primary',
                dataElement: 'signout'
            }, ['Sign Out']))
                .click(() => {
                    dialog.hide();
                    $(document).trigger('logout.kbase', true);
                });
            const cancelBtn = $(a({
                type: 'button',
                class: 'btn btn-default',
                dataElement: 'cancel-signout'
            }, ['Cancel']))
                .click(() => {
                    dialog.hide();
                });
            const dialog = new BootstrapDialog({
                title: 'Sign Out?',
                body: div(
                    { dataElement: 'signout-warning-body' },
                    'Sign out of KBase? This will end your session. Any unsaved changes in any open Narrative will be lost.'
                ),
                buttons: [cancelBtn, logoutBtn]
            });
            dialog.onHidden(() => dialog.destroy());
            dialog.show();
        }

        return {
            render: render,
            logout: logout,
            start: start
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
