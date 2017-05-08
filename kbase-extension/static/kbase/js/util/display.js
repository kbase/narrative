/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'underscore',
    'bluebird',
    'narrativeConfig',
    'util/timeFormat',
    'kbase-client-api',
    'kbaseAccordion',
    'api/auth'
], function (
    KBWidget,
    bootstrap,
    $,
    _,
    Promise,
    Config,
    TimeFormat,
    kbase_client_api,
    KBaseAccordion,
    Auth
) {
    'use strict';

    var profileClient = new UserProfile(Config.url('user_profile'));
    var authClient = Auth.make({url: Config.url('auth')});
    var profilePageUrl = Config.url('profile_page');
    var cachedUserIds = {};

    function lookupUserProfile(username) {
        if (!cachedUserIds[username]) {
            cachedUserIds[username] = Promise.resolve(profileClient.get_user_profile([username]));
        }
        return cachedUserIds[username];
    }

    /**
     * @method
     * displayRealName
     */
    function displayRealName(username, $target) {
        authClient.getUserNames(null, [username])
        .then(function(user) {
            var usernameLink = '<a href="' + profilePageUrl + username + '" target="_blank">' + username + '</a>';
            if (user[username]) {
                usernameLink = user[username] + ' (' + usernameLink + ')';
            }
            $target.html(usernameLink);
        })
        .catch(function (err) {
            console.error(err);
        });
    }

    /**
     * @method
     * loadingSpinner
     * creates and returns a loading spinner DOM element with optional caption.
     * This node is a div with the usual loading gif centered, with the (optional)
     * caption centered below.
     */
    function loadingSpinner(caption) {
        var spinner = '<span class="fa fa-spinner fa-pulse fa-2x fa-fw">';
        if (caption) {
            spinner += caption + '... &nbsp; &nbsp;'
        }
        spinner += '</span>';
        return spinner;
    }

    function loadingDiv(caption) {
        var $caption = $('<span>');
        var $loader = $('<div>').addClass('kb-data-loading')
            .append('<img src="' + Config.get('loading_gif') + '">')
            .append('<br>')
            .append($caption);
        if (caption)
            setText(caption);

        function setText(caption) {
            $caption.text(caption);
        }

        return {
            div: $loader,
            setText: setText
        };
    }


    /**
     * @method
     * getMethodIcon
     *
     * Provides a JQuery object containing an Icon for narrative apps (in the
     * legacy style) or methods (soon to be called apps).
     *
     * params = {
     *    isApp: true | false  // set to true to use the default app icon
     *    url:  string         // url to the icon image, if missing this will provide a default
     *    size: string         // set the max-width and max-height property for url icons
     *                         // (icons are square), default is 50px
     *    cursor: string       // if set, set the cursor css of the icon, default is 'default'
     *    setColor: true | false  // this param should probably go away, but if true will set the color of the default icon
     * }
     */
    function getAppIcon(params) {

        var cursor = 'default';
        if (params.cursor) {
            cursor = params.cursor;
        }

        if (params.url) {
            var size = '50px';
            if (params.size) {
                size = params.size;
            }
            return $('<img src="' + params.url + '">').css({'max-width': size, 'max-height': size, 'cursor': cursor});
        }

        // no url, so show default
        var icons = Config.get('icons'); // icon default parameters are set in a config

        var isApp = false;
        if (params['isApp']) {
            isApp = params['isApp'];
        }

        var name = isApp ? "app" : "method";
        var icon_color = isApp ? icons.colors[9] : icons.colors[5];
        var icon_class = isApp ? 'app-icon' : 'method-icon';

        var icon = icons.methods[name];
        var $icon = $('<i>');
        // background
        $icon.addClass("fa-stack fa-2x").css({'cursor': cursor});
        var $i = $('<i>').addClass('fa fa-square fa-stack-2x ' + icon_class);
        if (params.setColor) {
            $i.css({color: icon_color});
        }
        $icon.append($i);
        // add stack of font-awesome icons
        _.each(icon, function (cls) {
            $icon.append($('<i>')
                .addClass("fa fa-inverse fa-stack-1x " + cls));
        });
        return $icon;
    }

    /**
     * errorTitle = a string that'll be in bold at the top of the panel.
     * errorBody = a string that'll be in standard text, in the error's body area.
     * if errorBody is an object, ...
     */
    function createError(title, error, stackTrace) {
        var $errorPanel = $('<div>')
                          .addClass('alert alert-danger')
                          .append('<b>' + title + '</b><br>Please contact the KBase team at <a href="http://kbase.us/contact-us/">http://kbase.us/contact-us/</a> with the information below.');

        $errorPanel.append('<br><br>');

        // If it's a string, just dump the string.
        if (typeof error === 'string') {
            $errorPanel.append(error);
        }

        // If it's an object, expect an error object
        else if (typeof error === 'object') {
            Object.keys(error).forEach(function(key) {
                $errorPanel.append($('<div>').append('<b>' + key + ':</b> ' + error[key]));
            });
        }
        else if (error) {
            $errorPanel.append('No other information available. Sorry!');
        }
        if (stackTrace) {
            var $traceAccordion = $('<div>');
            $errorPanel.append($traceAccordion);
            new KBaseAccordion($traceAccordion, {
                elements: [
                    {
                        title: 'Error Details',
                        body: $('<div>').addClass('kb-function-error-traceback').append(stackTrace)
                    }
                ]}
            );
        }
        return $errorPanel;
    }

    /**
     * A helper function that makes a simple button with an icon in it.
     * sizeClass is expected to be a bootstrap btn size (btn-xs, btn-md, etc)
     * iconClass is expected to be a space-delimited string ('fa fa-spinner fa-spin fa-2x', etc.)
     */
    function simpleButton(sizeClass, iconClass) {
        return $('<button>')
               .addClass('btn btn-default ' + sizeClass)
               .append($('<span>').addClass(iconClass));
    }

    return {
        lookupUserProfile: lookupUserProfile,
        displayRealName: displayRealName,
        loadingDiv: loadingDiv,
        getAppIcon: getAppIcon,
        createError: createError,
        simpleButton: simpleButton
    };
});
