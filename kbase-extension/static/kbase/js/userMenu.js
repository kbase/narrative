/*global define,window*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'narrativeConfig',
    'kbase-client-api',
    'kb_common/gravatar',
    'kb_common/html',
    'util/bootstrapDialog'
], function(
    $,
    Promise,
    NarrativeConfig,
    ClientAPI,
    Gravatar,
    html,
    BootstrapDialog
) {
    'use strict';

    function factory(config) {
        var target = config.target,
            email = config.email,
            userName = config.userName,
            displayName = config.displayName,
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

        var token = config.token;
        if (!token) {
            // fail elegantly
        }

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

        function renderError(error) {

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
            render: render,
            renderError: renderError,
            logout: logout
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
