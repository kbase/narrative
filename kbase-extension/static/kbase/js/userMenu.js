/*global UserProfile*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'narrativeConfig',
    'kbase-client-api',
    'kb_common/gravatar',
    'kb_common/html',
    'util/bootstrapDialog',
    'util/string'
], function(
    $,
    Promise,
    NarrativeConfig,
    ClientAPI,
    Gravatar,
    html,
    BootstrapDialog,
    StringUtil
) {
    'use strict';

    function factory(config) {
        const target = config.target,
            email = config.email,
            userName = StringUtil.escape(config.userName),
            displayName = StringUtil.escape(config.displayName),
            token = config.token,
            gravatar = Gravatar.make(),
            profileClient = new UserProfile(NarrativeConfig.url('user_profile'), {token: token});
        
        let gravatarDefault = 'identicon';

        const t = html.tag;
        const button = t('button');
        const div = t('div');
        const a = t('a');
        const span = t('span');
        const ul = t('ul');
        const li = t('li');
        const br = t('br', {close: false});
        const i = t('i');
        const img = html.tag('img');

        Promise.resolve(profileClient.get_user_profile([userName]))
            .then(function(profile) {
                if (profile.length > 0 &&
                    profile[0] &&
                    profile[0].profile &&
                    profile[0].profile.userdata &&
                    profile[0].profile.userdata.avatar &&
                    profile[0].profile.userdata.avatar) {
                    gravatarDefault = profile[0].profile.userdata.avatar.gravatar_default;
                }
            })
            .finally(function() {
                render();
            });

        function renderAvatar() {
            return img({
                src: gravatar.makeGravatarUrl(email, 100, 'pg', gravatarDefault),
                style: 'width: 40px;',
                class: 'login-button-avatar',
                'data-element': 'avatar'
            });
        }

        function render() {
            var menu = div({class: 'dropdown', style: 'display:inline-block'}, [
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
                            div({style: 'display: inline-block'}, [
                                span({'data-element': 'realname'}, displayName),
                                br(),
                                i({'data-element': 'username'}, userName)
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

        function renderError() {
        }

        function logout() {
            var logoutBtn = $(a({type: 'button', class: 'btn btn-primary'}, ['Sign Out']))
                .click(function() {
                    dialog.hide();
                    // dialog.destroy();
                    $(document).trigger('logout.kbase', true);
                });
            var cancelBtn = $(a({type: 'button', class: 'btn btn-default'}, ['Cancel']))
                .click(function() {
                    dialog.hide();
                    // dialog.destroy();
                });
            var dialog = new BootstrapDialog({
                title: 'Sign Out?',
                body: 'Sign out of KBase? This will end your session. Any unsaved changes in any open Narrative will be lost.',
                buttons: [cancelBtn, logoutBtn]
            });
            dialog.show();
        }

        return {
            render,
            renderError,
            logout
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
